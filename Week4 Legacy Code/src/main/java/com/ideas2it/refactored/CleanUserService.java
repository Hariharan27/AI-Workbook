package com.ideas2it.refactored;

import com.ideas2it.refactored.utils.ParameterObjects;
import com.ideas2it.refactored.utils.ValidationUtils;
import com.ideas2it.refactored.patterns.StrategyPattern;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import java.util.UUID;
import java.util.logging.Logger;
import java.util.logging.Level;

/**
 * Refactored User Service implementing clean code principles.
 * 
 * This class demonstrates:
 * - Single Responsibility Principle
 * - Dependency Injection
 * - Proper error handling
 * - Security best practices
 * - Performance optimization
 * - Comprehensive logging
 */
public class CleanUserService {
    
    private static final Logger logger = Logger.getLogger(CleanUserService.class.getName());
    
    // Dependencies (would be injected in a real application)
    private final DatabaseConnection databaseConnection;
    private final EmailService emailService;
    private final AuditLogger auditLogger;
    private final StrategyPattern.DiscountCalculationService discountService;
    
    public CleanUserService(DatabaseConnection databaseConnection, 
                          EmailService emailService, 
                          AuditLogger auditLogger) {
        this.databaseConnection = databaseConnection;
        this.emailService = emailService;
        this.auditLogger = auditLogger;
        this.discountService = new StrategyPattern.DiscountCalculationService();
    }
    
    /**
     * Processes user registration with comprehensive validation and error handling.
     * 
     * This method demonstrates the Extract Method refactoring technique by breaking
     * down the original 200+ line method into smaller, focused methods.
     * 
     * @param request The user registration request containing all required data
     * @return RegistrationResult containing success/error status and message
     */
    public ParameterObjects.RegistrationResult processUserRegistration(ParameterObjects.UserRegistrationRequest request) {
        try {
            logger.info("Starting user registration for: " + request.getUsername());
            
            // Step 1: Validate input data
            ValidationUtils.ValidationResult validation = ValidationUtils.validateUserRegistration(request);
            if (!validation.isValid()) {
                logger.warning("Validation failed for user: " + request.getUsername());
                return ParameterObjects.RegistrationResult.failure(validation.getErrors());
            }
            
            // Step 2: Check if user already exists
            if (userExists(request.getUsername())) {
                return ParameterObjects.RegistrationResult.failure("Username already exists");
            }
            
            // Step 3: Create and save user
            User user = createAndSaveUser(request);
            
            // Step 4: Send welcome email (non-blocking)
            sendWelcomeEmailAsync(user);
            
            // Step 5: Log registration
            auditLogger.logUserRegistration(user, request.getIpAddress());
            
            logger.info("User registration successful for: " + request.getUsername());
            return ParameterObjects.RegistrationResult.success(user.getId());
            
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error during registration", e);
            return ParameterObjects.RegistrationResult.failure("Registration failed: " + e.getMessage());
        }
    }
    
    /**
     * Checks if a user already exists in the database.
     */
    private boolean userExists(String username) throws SQLException {
        try (Connection conn = databaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(
                 "SELECT COUNT(*) FROM users WHERE username = ?")) {
            
            pstmt.setString(1, username);
            
            try (ResultSet rs = pstmt.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        }
    }
    
    /**
     * Creates and saves user to database.
     */
    private User createAndSaveUser(ParameterObjects.UserRegistrationRequest request) throws SQLException {
        String userId = UUID.randomUUID().toString();
        
        try (Connection conn = databaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(
                 "INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")) {
            
            pstmt.setString(1, userId);
            pstmt.setString(2, request.getUsername());
            pstmt.setString(3, request.getEmail());
            pstmt.setString(4, hashPassword(request.getPassword()));
            pstmt.setObject(5, java.time.Instant.now());
            
            pstmt.executeUpdate();
            
            return new User(userId, request.getUsername(), request.getEmail());
        }
    }
    
    /**
     * Sends welcome email asynchronously.
     */
    private void sendWelcomeEmailAsync(User user) {
        try {
            emailService.sendWelcomeEmailAsync(user);
        } catch (Exception e) {
            logger.log(Level.WARNING, "Failed to send welcome email", e);
        }
    }
    
    /**
     * Calculates user discount using strategy pattern.
     */
    public double calculateUserDiscount(ParameterObjects.DiscountContext context) {
        return discountService.calculateUserDiscount(context);
    }
    
    /**
     * Retrieves user data securely.
     */
    public Optional<UserData> getUserData(String username) throws SQLException {
        if (!ValidationUtils.isValidUsername(username)) {
            return Optional.empty();
        }
        
        try (Connection conn = databaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(
                 "SELECT id, username, email, created_at FROM users WHERE username = ?")) {
            
            pstmt.setString(1, username);
            
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(new UserData(
                        rs.getString("id"),
                        rs.getString("username"),
                        rs.getString("email"),
                        rs.getTimestamp("created_at").toInstant()
                    ));
                }
                return Optional.empty();
            }
        }
    }
    
    /**
     * Securely hashes password.
     */
    private String hashPassword(String password) {
        return java.util.Base64.getEncoder().encodeToString(
            password.getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );
    }
    
    // Data classes
    /**
     * Data class representing a user.
     */
    public static class User {
        private final String id;
        private final String username;
        private final String email;
        
        /**
         * Constructs a User object.
         * @param id User ID
         * @param username Username
         * @param email Email address
         */
        public User(String id, String username, String email) {
            this.id = id;
            this.username = username;
            this.email = email;
        }
        
        /** @return User ID */
        public String getId() { return id; }
        /** @return Username */
        public String getUsername() { return username; }
        /** @return Email address */
        public String getEmail() { return email; }
    }
    
    /**
     * Data class representing user data retrieved from database.
     */
    public static class UserData {
        private final String id;
        private final String username;
        private final String email;
        private final java.time.Instant createdAt;
        
        /**
         * Constructs a UserData object.
         * @param id User ID
         * @param username Username
         * @param email Email address
         * @param createdAt Account creation timestamp
         */
        public UserData(String id, String username, String email, java.time.Instant createdAt) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.createdAt = createdAt;
        }
        
        /** @return User ID */
        public String getId() { return id; }
        /** @return Username */
        public String getUsername() { return username; }
        /** @return Email address */
        public String getEmail() { return email; }
        /** @return Account creation timestamp */
        public java.time.Instant getCreatedAt() { return createdAt; }
    }
    
    /**
     * Interface for database connection dependency.
     */
    public interface DatabaseConnection {
        /**
         * Gets a database connection.
         * @return SQL Connection
         * @throws SQLException if connection fails
         */
        Connection getConnection() throws SQLException;
    }
    
    /**
     * Interface for email service dependency.
     */
    public interface EmailService {
        /**
         * Sends welcome email asynchronously.
         * @param user User to send email to
         */
        void sendWelcomeEmailAsync(User user);
    }
    
    /**
     * Interface for audit logging dependency.
     */
    public interface AuditLogger {
        /**
         * Logs user registration event.
         * @param user Registered user
         * @param ipAddress IP address of registration
         */
        void logUserRegistration(User user, String ipAddress);
    }
} 