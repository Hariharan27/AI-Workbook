const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { WebSocketServer } = require('ws');
// FIX: Use main export for useServer (latest graphql-ws)
let useServer;
try {
  ({ useServer } = require('graphql-ws'));
} catch (e) {
  // If not available, skip subscriptions
  useServer = null;
}
const { makeExecutableSchema } = require('@graphql-tools/schema');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const jwt = require('jsonwebtoken');

// Create context function for authentication
const createContext = async ({ req }) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return { user: null };
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { user: decoded };
  } catch (error) {
    return { user: null };
  }
};

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Setup GraphQL server
const setupGraphQL = async (app, httpServer) => {
  // Create WebSocket server for subscriptions if useServer is available
  let serverCleanup = { dispose: async () => {} };
  if (useServer) {
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: '/graphql',
    });
    serverCleanup = useServer(
      {
        schema,
        context: async (ctx) => {
          // Handle WebSocket authentication
          const token = ctx.connectionParams?.authorization?.replace('Bearer ', '');
          if (token) {
            try {
              const decoded = jwt.verify(token, process.env.JWT_SECRET);
              return { user: decoded };
            } catch (error) {
              return { user: null };
            }
          }
          return { user: null };
        },
      },
      wsServer
    );
  }

  // Create Apollo Server
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return {
        message: error.message,
        path: error.path,
        extensions: {
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        },
      };
    },
    introspection: process.env.NODE_ENV !== 'production',
  });

  // Start the server
  await server.start();

  // Apply middleware
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: createContext,
    })
  );

  console.log('🚀 GraphQL server ready at /graphql');
  if (useServer) {
    console.log('🔌 WebSocket server ready at /graphql');
  }

  return server;
};

module.exports = { setupGraphQL }; 