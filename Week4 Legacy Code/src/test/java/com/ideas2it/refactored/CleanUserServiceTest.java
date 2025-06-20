package com.ideas2it.refactored;

import com.ideas2it.refactored.utils.ParameterObjects;
import com.ideas2it.refactored.utils.ValidationUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.Optional;

/**
 * Unit tests for CleanUserService demonstrating testability improvements.
 * 
 * These tests show how the refactored code is much easier to test compared
 * to the original legacy code.
 */
@DisplayName("CleanUserService Tests")
class CleanUserServiceTest {

    private CleanUserService userService;
    private CleanUserService.DatabaseConnection mockDatabaseConnection;
    private CleanUserService.EmailService mockEmailService;
    private CleanUserService.AuditLogger mockAuditLogger;
    private Connection mockConnection;
    private PreparedStatement mockPreparedStatement;
    private ResultSet mockResultSet;

    @BeforeEach
    void setUp() throws SQLException {
        // Create mocks
        mockDatabaseConnection = mock(CleanUserService.DatabaseConnection.class);
        mockEmailService = mock(CleanUserService.EmailService.class);
        mockAuditLogger = mock(CleanUserService.AuditLogger.class);
        mockConnection = mock(Connection.class);
        mockPreparedStatement = mock(PreparedStatement.class);
        mockResultSet = mock(ResultSet.class);

        // Setup mock behavior
        when(mockDatabaseConnection.getConnection()).thenReturn(mockConnection);
        when(mockConnection.prepareStatement(anyString())).thenReturn(mockPreparedStatement);
        when(mockPreparedStatement.executeQuery()).thenReturn(mockResultSet);

        // Create service instance
        userService = new CleanUserService(mockDatabaseConnection, mockEmailService, mockAuditLogger);
    }

    @Test
    @DisplayName("Should successfully register a valid user")
    void testSuccessfulUserRegistration() throws Exception {
        // Arrange
        ParameterObjects.UserProfile profile = new ParameterObjects.UserProfile(
            "1234567890", "123 Main St", "City", "State", "12345", "Country",
            LocalDate.of(1990, 1, 1), "male", "Engineer", "Company", 
            "website.com", "Bio", "pic.jpg", "social", "prefs", "settings"
        );

        ParameterObjects.UserRegistrationRequest request = new ParameterObjects.UserRegistrationRequest(
            "testuser", "test@example.com", "password123", profile,
            "192.168.1.1", "Mozilla/5.0", true, true
        );

        when(mockResultSet.next()).thenReturn(false); // User doesn't exist
        when(mockPreparedStatement.executeUpdate()).thenReturn(1); // Insert successful

        // Act
        ParameterObjects.RegistrationResult result = userService.processUserRegistration(request);

        // Assert
        assertTrue(result.isSuccess());
        assertNotNull(result.getUserId());
        assertEquals("Registration successful", result.getMessage());
        
        // Verify interactions
        verify(mockDatabaseConnection, times(2)).getConnection(); // userExists + createAndSaveUser
        verify(mockPreparedStatement, times(2)).setString(eq(1), anyString()); // ID (userExists + createAndSaveUser)
        verify(mockPreparedStatement).setString(eq(2), eq("testuser"));
        verify(mockPreparedStatement).setString(eq(3), eq("test@example.com"));
        verify(mockPreparedStatement).executeUpdate();
        verify(mockEmailService).sendWelcomeEmailAsync(any(CleanUserService.User.class));
        verify(mockAuditLogger).logUserRegistration(any(CleanUserService.User.class), eq("192.168.1.1"));
    }

    @Test
    @DisplayName("Should fail registration when username already exists")
    void testRegistrationFailsWhenUserExists() throws Exception {
        // Arrange
        ParameterObjects.UserProfile profile = new ParameterObjects.UserProfile(
            null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null
        );

        ParameterObjects.UserRegistrationRequest request = new ParameterObjects.UserRegistrationRequest(
            "existinguser", "test@example.com", "password123", profile,
            null, null, false, true
        );

        when(mockResultSet.next()).thenReturn(true); // User exists
        when(mockResultSet.getInt(1)).thenReturn(1);

        // Act
        ParameterObjects.RegistrationResult result = userService.processUserRegistration(request);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("Username already exists", result.getMessage());
        assertNull(result.getUserId());
    }

    @Test
    @DisplayName("Should fail registration with invalid username")
    void testRegistrationFailsWithInvalidUsername() {
        // Arrange
        ParameterObjects.UserProfile profile = new ParameterObjects.UserProfile(
            null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null
        );

        ParameterObjects.UserRegistrationRequest request = new ParameterObjects.UserRegistrationRequest(
            "a", // Too short username
            "test@example.com", 
            "password123", 
            profile,
            null, null, false, true
        );

        // Act
        ParameterObjects.RegistrationResult result = userService.processUserRegistration(request);

        // Assert
        assertFalse(result.isSuccess());
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("Username must be 3-50 characters")));
    }

    @Test
    @DisplayName("Should fail registration with invalid email")
    void testRegistrationFailsWithInvalidEmail() {
        // Arrange
        ParameterObjects.UserProfile profile = new ParameterObjects.UserProfile(
            null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null
        );

        ParameterObjects.UserRegistrationRequest request = new ParameterObjects.UserRegistrationRequest(
            "validuser",
            "invalid-email", // Invalid email format
            "password123", 
            profile,
            null, null, false, true
        );

        // Act
        ParameterObjects.RegistrationResult result = userService.processUserRegistration(request);

        // Assert
        assertFalse(result.isSuccess());
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("Invalid email format")));
    }

    @Test
    @DisplayName("Should fail registration when terms not accepted")
    void testRegistrationFailsWhenTermsNotAccepted() {
        // Arrange
        ParameterObjects.UserProfile profile = new ParameterObjects.UserProfile(
            null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null
        );

        ParameterObjects.UserRegistrationRequest request = new ParameterObjects.UserRegistrationRequest(
            "validuser",
            "test@example.com",
            "password123", 
            profile,
            null, null, false, false // Terms not accepted
        );

        // Act
        ParameterObjects.RegistrationResult result = userService.processUserRegistration(request);

        // Assert
        assertFalse(result.isSuccess());
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("Terms and conditions must be accepted")));
    }

    @Test
    @DisplayName("Should handle database errors gracefully")
    void testRegistrationHandlesDatabaseErrors() throws Exception {
        // Arrange
        ParameterObjects.UserProfile profile = new ParameterObjects.UserProfile(
            null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null
        );

        ParameterObjects.UserRegistrationRequest request = new ParameterObjects.UserRegistrationRequest(
            "testuser", "test@example.com", "password123", profile,
            null, null, false, true
        );

        when(mockResultSet.next()).thenThrow(new SQLException("Database connection failed"));

        // Act
        ParameterObjects.RegistrationResult result = userService.processUserRegistration(request);

        // Assert
        assertFalse(result.isSuccess());
        assertTrue(result.getMessage().contains("Registration failed"));
    }

    @Test
    @DisplayName("Should calculate discount correctly for student")
    void testCalculateDiscountForStudent() {
        // Arrange
        ParameterObjects.DiscountContext context = new ParameterObjects.DiscountContext(
            ParameterObjects.UserType.STUDENT,
            20, // age
            25000.0, // income
            0, // loyalty years
            false, // isPremium
            false, // hasReferral
            true, // isFirstTime
            "New York", // location
            "winter", // season
            false // isHoliday
        );

        // Act
        double discount = userService.calculateUserDiscount(context);

        // Assert
        assertTrue(discount > 0);
        assertTrue(discount <= 50.0); // Should be capped at 50%
        // Student (15%) + Income < 30k (5%) + Winter (5%) + First time (15%) = 40%
        assertEquals(40.0, discount, 0.01);
    }

    @Test
    @DisplayName("Should calculate discount correctly for senior")
    void testCalculateDiscountForSenior() {
        // Arrange
        ParameterObjects.DiscountContext context = new ParameterObjects.DiscountContext(
            ParameterObjects.UserType.SENIOR,
            70, // age
            40000.0, // income
            0, // loyalty years
            false, // isPremium
            false, // hasReferral
            false, // isFirstTime
            "California", // location
            "summer", // season
            true // isHoliday
        );

        // Act
        double discount = userService.calculateUserDiscount(context);

        // Assert
        assertTrue(discount > 0);
        assertTrue(discount <= 50.0);
        // Senior 65+ (20%) + Income < 50k (3%) + Summer (3%) + Holiday (10%) = 36%
        assertEquals(36.0, discount, 0.01);
    }

    @Test
    @DisplayName("Should retrieve user data successfully")
    void testGetUserDataSuccess() throws Exception {
        // Arrange
        String username = "testuser";
        when(mockResultSet.next()).thenReturn(true);
        when(mockResultSet.getString("id")).thenReturn("user123");
        when(mockResultSet.getString("username")).thenReturn("testuser");
        when(mockResultSet.getString("email")).thenReturn("test@example.com");
        when(mockResultSet.getTimestamp("created_at")).thenReturn(
            java.sql.Timestamp.from(java.time.Instant.now())
        );

        // Act
        Optional<CleanUserService.UserData> result = userService.getUserData(username);

        // Assert
        assertTrue(result.isPresent());
        assertEquals("user123", result.get().getId());
        assertEquals("testuser", result.get().getUsername());
        assertEquals("test@example.com", result.get().getEmail());
    }

    @Test
    @DisplayName("Should return empty when user not found")
    void testGetUserDataNotFound() throws Exception {
        // Arrange
        String username = "nonexistentuser";
        when(mockResultSet.next()).thenReturn(false);

        // Act
        Optional<CleanUserService.UserData> result = userService.getUserData(username);

        // Assert
        assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("Should return empty for invalid username")
    void testGetUserDataInvalidUsername() throws Exception {
        // Arrange
        String username = "a"; // Too short

        // Act
        Optional<CleanUserService.UserData> result = userService.getUserData(username);

        // Assert
        assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("Should handle database errors in getUserData")
    void testGetUserDataDatabaseError() throws Exception {
        // Arrange
        String username = "testuser";
        when(mockResultSet.next()).thenThrow(new SQLException("Database error"));

        // Act & Assert
        assertThrows(SQLException.class, () -> userService.getUserData(username));
    }

    @Test
    @DisplayName("Should validate user registration request correctly")
    void testUserRegistrationValidation() {
        // Arrange
        ParameterObjects.UserProfile profile = new ParameterObjects.UserProfile(
            "1234567890", "123 Main St", "City", "State", "12345", "Country",
            LocalDate.of(1990, 1, 1), "male", "Engineer", "Company", 
            "website.com", "Bio", "pic.jpg", "social", "prefs", "settings"
        );

        ParameterObjects.UserRegistrationRequest request = new ParameterObjects.UserRegistrationRequest(
            "testuser", "test@example.com", "password123", profile,
            "192.168.1.1", "Mozilla/5.0", true, true
        );

        // Act
        ValidationUtils.ValidationResult result = ValidationUtils.validateUserRegistration(request);

        // Assert
        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
    }

    @Test
    @DisplayName("Should detect multiple validation errors")
    void testMultipleValidationErrors() {
        // Arrange
        ParameterObjects.UserProfile profile = new ParameterObjects.UserProfile(
            "invalid-phone", "short", "C", "S", "invalid", "C",
            LocalDate.of(1990, 1, 1), "invalid-gender", "O", "C", 
            "w", "B".repeat(1001), "p", "s", "p", "s"
        );

        ParameterObjects.UserRegistrationRequest request = new ParameterObjects.UserRegistrationRequest(
            "a", // Too short
            "invalid-email", // Invalid email
            "short", // Too short password
            profile,
            null, null, false, false // Terms not accepted
        );

        // Act
        ValidationUtils.ValidationResult result = ValidationUtils.validateUserRegistration(request);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().size() > 1);
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("Username must be 3-50 characters")));
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("Invalid email format")));
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("Password must be 6-128 characters")));
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("Terms and conditions must be accepted")));
    }
} 