package com.ideas2it.refactored;

import com.ideas2it.refactored.utils.ValidationUtils;
import com.ideas2it.refactored.utils.ParameterObjects;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Unit tests for ValidationUtils demonstrating validation improvements.
 */
@DisplayName("ValidationUtils Tests")
class ValidationUtilsTest {

    @Test
    @DisplayName("Should validate username correctly")
    void testIsValidUsername() {
        // Valid usernames
        assertTrue(ValidationUtils.isValidUsername("user123"));
        assertTrue(ValidationUtils.isValidUsername("test_user"));
        assertTrue(ValidationUtils.isValidUsername("abc"));
        assertTrue(ValidationUtils.isValidUsername("a".repeat(50)));
        
        // Invalid usernames
        assertFalse(ValidationUtils.isValidUsername("ab")); // Too short
        assertFalse(ValidationUtils.isValidUsername("a".repeat(51))); // Too long
        assertFalse(ValidationUtils.isValidUsername("user'name")); // Contains quote
        assertFalse(ValidationUtils.isValidUsername("user\"name")); // Contains quote
        assertFalse(ValidationUtils.isValidUsername("user;name")); // Contains semicolon
        assertFalse(ValidationUtils.isValidUsername("user-name")); // Contains hyphen
        assertFalse(ValidationUtils.isValidUsername("user name")); // Contains space
        assertFalse(ValidationUtils.isValidUsername(null));
    }

    @Test
    @DisplayName("Should validate email correctly")
    void testIsValidEmail() {
        // Valid emails
        assertTrue(ValidationUtils.isValidEmail("test@example.com"));
        assertTrue(ValidationUtils.isValidEmail("user.name@domain.co.uk"));
        assertTrue(ValidationUtils.isValidEmail("user+tag@example.com"));
        assertTrue(ValidationUtils.isValidEmail("a".repeat(5) + "@b.com")); // Min length
        assertTrue(ValidationUtils.isValidEmail("a".repeat(90) + "@b.com")); // Max length (100 chars total)
        
        // Invalid emails
        assertFalse(ValidationUtils.isValidEmail("test")); // Too short
        assertFalse(ValidationUtils.isValidEmail("a".repeat(91) + "@b.com")); // Too long
        assertFalse(ValidationUtils.isValidEmail("test@"));
        assertFalse(ValidationUtils.isValidEmail("@example.com"));
        assertFalse(ValidationUtils.isValidEmail("test@example"));
        assertFalse(ValidationUtils.isValidEmail("test.example.com"));
        assertFalse(ValidationUtils.isValidEmail(null));
    }

    @Test
    @DisplayName("Should validate password correctly")
    void testIsValidPassword() {
        // Valid passwords
        assertTrue(ValidationUtils.isValidPassword("password123"));
        assertTrue(ValidationUtils.isValidPassword("123456")); // Min length
        assertTrue(ValidationUtils.isValidPassword("a".repeat(128))); // Max length
        
        // Invalid passwords
        assertFalse(ValidationUtils.isValidPassword("12345")); // Too short
        assertFalse(ValidationUtils.isValidPassword("a".repeat(129))); // Too long
        assertFalse(ValidationUtils.isValidPassword(null));
    }

    @Test
    @DisplayName("Should validate phone number correctly")
    void testIsValidPhone() {
        // Valid phone numbers
        assertTrue(ValidationUtils.isValidPhone("1234567890"));
        assertTrue(ValidationUtils.isValidPhone("+1234567890"));
        assertTrue(ValidationUtils.isValidPhone("123456789012345"));
        
        // Invalid phone numbers
        assertFalse(ValidationUtils.isValidPhone("123456789")); // Too short
        assertFalse(ValidationUtils.isValidPhone("1234567890123456")); // Too long
        assertFalse(ValidationUtils.isValidPhone("123-456-7890")); // Contains hyphens
        assertFalse(ValidationUtils.isValidPhone("(123) 456-7890")); // Contains parentheses
        assertFalse(ValidationUtils.isValidPhone("abc123def")); // Contains letters
        assertFalse(ValidationUtils.isValidPhone(null));
    }

    @Test
    @DisplayName("Should validate zip code correctly")
    void testIsValidZipCode() {
        // Valid zip codes
        assertTrue(ValidationUtils.isValidZipCode("12345"));
        assertTrue(ValidationUtils.isValidZipCode("12345-6789"));
        
        // Invalid zip codes
        assertFalse(ValidationUtils.isValidZipCode("1234")); // Too short
        assertFalse(ValidationUtils.isValidZipCode("123456")); // Too long
        assertFalse(ValidationUtils.isValidZipCode("12345-678")); // Invalid format
        assertFalse(ValidationUtils.isValidZipCode("12345-67890")); // Invalid format
        assertFalse(ValidationUtils.isValidZipCode("abc12")); // Contains letters
        assertFalse(ValidationUtils.isValidZipCode(null));
    }

    @Test
    @DisplayName("Should validate gender correctly")
    void testIsValidGender() {
        // Valid genders
        assertTrue(ValidationUtils.isValidGender("male"));
        assertTrue(ValidationUtils.isValidGender("female"));
        assertTrue(ValidationUtils.isValidGender("other"));
        
        // Invalid genders
        assertFalse(ValidationUtils.isValidGender("MALE")); // Wrong case
        assertFalse(ValidationUtils.isValidGender("Male")); // Wrong case
        assertFalse(ValidationUtils.isValidGender("unknown"));
        assertFalse(ValidationUtils.isValidGender(""));
        assertFalse(ValidationUtils.isValidGender(null));
    }

    @Test
    @DisplayName("Should validate length correctly")
    void testIsValidLength() {
        // Valid lengths
        assertTrue(ValidationUtils.isValidLength("test", 1, 10));
        assertTrue(ValidationUtils.isValidLength("test", 4, 4)); // Exact length
        assertTrue(ValidationUtils.isValidLength("", 0, 10)); // Empty string
        
        // Invalid lengths
        assertFalse(ValidationUtils.isValidLength("test", 5, 10)); // Too short
        assertFalse(ValidationUtils.isValidLength("test", 1, 3)); // Too long
        assertFalse(ValidationUtils.isValidLength(null, 1, 10));
    }

    @Test
    @DisplayName("Should validate user registration request")
    void testValidateUserRegistration() {
        // Valid request
        ParameterObjects.UserProfile profile = new ParameterObjects.UserProfile(
            "1234567890", "123 Main St", "City", "State", "12345", "Country",
            LocalDate.of(1990, 1, 1), "male", "Engineer", "Company", 
            "website.com", "Bio", "pic.jpg", "social", "prefs", "settings"
        );

        ParameterObjects.UserRegistrationRequest request = new ParameterObjects.UserRegistrationRequest(
            "testuser", "test@example.com", "password123", profile,
            "192.168.1.1", "Mozilla/5.0", true, true
        );

        ValidationUtils.ValidationResult result = ValidationUtils.validateUserRegistration(request);

        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
    }

    @Test
    @DisplayName("Should detect validation errors in user registration")
    void testValidateUserRegistrationWithErrors() {
        // Invalid request
        ParameterObjects.UserProfile profile = new ParameterObjects.UserProfile(
            "invalid-phone", "short", "C", "S", "invalid", "Country",
            LocalDate.of(1990, 1, 1), "invalid", "Engineer", "Company", 
            "website.com", "Bio", "pic.jpg", "social", "prefs", "settings"
        );

        ParameterObjects.UserRegistrationRequest request = new ParameterObjects.UserRegistrationRequest(
            "ab", "invalid-email", "123", profile,
            "192.168.1.1", "Mozilla/5.0", true, false // Terms not accepted
        );

        ValidationUtils.ValidationResult result = ValidationUtils.validateUserRegistration(request);

        assertFalse(result.isValid());
        assertFalse(result.getErrors().isEmpty());
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("Username")));
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("email")));
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("Password")));
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("phone")));
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("Address")));
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("City")));
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("zip code")));
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("Gender")));
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("Terms")));
    }

    @Test
    @DisplayName("Should validate data processing request")
    void testValidateDataProcessing() {
        // Valid request
        ParameterObjects.DataProcessingRequest request = new ParameterObjects.DataProcessingRequest(
            "test data", 1, true, "option1", List.of("item1", "item2"), null
        );

        ValidationUtils.ValidationResult result = ValidationUtils.validateDataProcessing(request);

        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
    }

    @Test
    @DisplayName("Should detect validation errors in data processing")
    void testValidateDataProcessingWithErrors() {
        // Invalid request
        ParameterObjects.DataProcessingRequest request = new ParameterObjects.DataProcessingRequest(
            "", -1, true, "", null, null
        );

        ValidationUtils.ValidationResult result = ValidationUtils.validateDataProcessing(request);

        assertFalse(result.isValid());
        assertFalse(result.getErrors().isEmpty());
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("Data cannot be empty")));
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("Type must be positive")));
    }

    @Test
    @DisplayName("Should validate discount context")
    void testValidateDiscountContext() {
        // Valid context
        ParameterObjects.DiscountContext context = new ParameterObjects.DiscountContext(
            ParameterObjects.UserType.STUDENT, 20, 50000.0, 2, true, false, true,
            "New York", "winter", true
        );

        ValidationUtils.ValidationResult result = ValidationUtils.validateDiscountContext(context);

        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
    }

    @Test
    @DisplayName("Should detect validation errors in discount context")
    void testValidateDiscountContextWithErrors() {
        // Invalid context
        ParameterObjects.DiscountContext context = new ParameterObjects.DiscountContext(
            ParameterObjects.UserType.STUDENT, -5, -1000.0, -1, true, false, true,
            "", "invalid-season", true
        );

        ValidationUtils.ValidationResult result = ValidationUtils.validateDiscountContext(context);

        assertFalse(result.isValid());
        assertFalse(result.getErrors().isEmpty());
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("Age must be positive")));
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("Income must be positive")));
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("Loyalty years must be non-negative")));
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("Location cannot be empty")));
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("Invalid season")));
    }

    @Test
    @DisplayName("Should sanitize HTML correctly")
    void testSanitizeHtml() {
        // Test HTML sanitization
        String input = "<script>alert('xss')</script><p>Hello <b>World</b></p>";
        String result = ValidationUtils.sanitizeHtml(input);

        assertNotNull(result);
        assertFalse(result.contains("<script>"));
        assertFalse(result.contains("alert('xss')"));
        assertTrue(result.contains("<p>"));
        assertTrue(result.contains("<b>"));
        assertTrue(result.contains("Hello"));
        assertTrue(result.contains("World"));
    }

    @Test
    @DisplayName("Should handle null input in sanitizeHtml")
    void testSanitizeHtmlNull() {
        String result = ValidationUtils.sanitizeHtml(null);
        assertEquals("", result);
    }

    @Test
    @DisplayName("Should validate file path correctly")
    void testIsValidFilePath() {
        // Valid file paths
        assertTrue(ValidationUtils.isValidFilePath("document.pdf", "/uploads"));
        assertTrue(ValidationUtils.isValidFilePath("image.jpg", "/uploads"));
        assertTrue(ValidationUtils.isValidFilePath("file.txt", "/uploads"));
        
        // Invalid file paths (path traversal attempts)
        assertFalse(ValidationUtils.isValidFilePath("../secret.txt", "/uploads"));
        assertFalse(ValidationUtils.isValidFilePath("../../../etc/passwd", "/uploads"));
        assertFalse(ValidationUtils.isValidFilePath("..\\windows\\system32\\config", "/uploads"));
        assertFalse(ValidationUtils.isValidFilePath("", "/uploads"));
        assertFalse(ValidationUtils.isValidFilePath(null, "/uploads"));
    }

    @Test
    @DisplayName("Should create validation result correctly")
    void testValidationResult() {
        // Success result
        ValidationUtils.ValidationResult success = new ValidationUtils.ValidationResult(true, List.of());
        assertTrue(success.isValid());
        assertTrue(success.getErrors().isEmpty());
        assertEquals("", success.getErrorMessage());

        // Failure result
        List<String> errors = List.of("Error 1", "Error 2", "Error 3");
        ValidationUtils.ValidationResult failure = new ValidationUtils.ValidationResult(false, errors);
        assertFalse(failure.isValid());
        assertEquals(3, failure.getErrors().size());
        assertEquals("Error 1; Error 2; Error 3", failure.getErrorMessage());
    }

    @Test
    @DisplayName("Should handle null errors in validation result")
    void testValidationResultNullErrors() {
        ValidationUtils.ValidationResult result = new ValidationUtils.ValidationResult(true, null);
        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
        assertEquals("", result.getErrorMessage());
    }
} 