import { StrictMode } from 'react';
import * as ReactDOMClient from 'react-dom/client';

/* Theme */
import { ThemeProvider } from 'commons/style/styled-components';
import { theme } from 'commons/style/theme';
import GlobalStyle from 'commons/style/global-style';

/* Context Providers */
import { ProductsProvider } from 'contexts/products-context';
import { CartProvider } from 'contexts/cart-context';

/* Components */
import App from 'components/App';
import ErrorBoundary from 'components/ErrorBoundary';

const root = document.getElementById('root')!;
const container = ReactDOMClient.createRoot(root);

container.render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <ErrorBoundary>
          <ProductsProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </ProductsProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
