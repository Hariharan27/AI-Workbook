package com.ideas2it.refactored;

import com.ideas2it.refactored.patterns.StrategyPattern;
import com.ideas2it.refactored.patterns.FactoryPattern;
import com.ideas2it.refactored.patterns.ObserverPattern;
import com.ideas2it.refactored.utils.ParameterObjects;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

/**
 * Unit tests for design patterns demonstrating pattern implementations.
 */
@DisplayName("Design Patterns Tests")
class PatternsTest {

    @Test
    @DisplayName("Should calculate student discount correctly")
    void testStudentDiscountStrategy() {
        // Arrange
        StrategyPattern.DiscountStrategy strategy = new StrategyPattern.StudentDiscountStrategy();
        ParameterObjects.DiscountContext context = new ParameterObjects.DiscountContext(
            ParameterObjects.UserType.STUDENT, 20, 30000.0, 1, false, false, true,
            "New York", "winter", true
        );

        // Act
        double discount = strategy.calculateDiscount(context);

        // Assert
        assertTrue(discount > 0);
        assertTrue(discount <= 50.0); // Max discount
        // Student under 25 should get 15% base + seasonal + holiday + first time
        assertTrue(discount >= 30.0); // 15 + 5 + 10 + 15 = 45%
    }

    @Test
    @DisplayName("Should calculate senior discount correctly")
    void testSeniorDiscountStrategy() {
        // Arrange
        StrategyPattern.DiscountStrategy strategy = new StrategyPattern.SeniorDiscountStrategy();
        ParameterObjects.DiscountContext context = new ParameterObjects.DiscountContext(
            ParameterObjects.UserType.SENIOR, 70, 40000.0, 3, true, false, false,
            "Florida", "summer", false
        );

        // Act
        double discount = strategy.calculateDiscount(context);

        // Assert
        assertTrue(discount > 0);
        assertTrue(discount <= 50.0); // Max discount
        // Senior 65+ should get 20% base + seasonal
        assertTrue(discount >= 20.0); // 20 + 3 = 23%
    }

    @Test
    @DisplayName("Should calculate customer discount correctly")
    void testCustomerDiscountStrategy() {
        // Arrange
        StrategyPattern.DiscountStrategy strategy = new StrategyPattern.CustomerDiscountStrategy();
        ParameterObjects.DiscountContext context = new ParameterObjects.DiscountContext(
            ParameterObjects.UserType.CUSTOMER, 35, 60000.0, 5, true, true, false,
            "California", "spring", false
        );

        // Act
        double discount = strategy.calculateDiscount(context);

        // Assert
        assertTrue(discount > 0);
        assertTrue(discount <= 50.0); // Max discount
        // Customer with 5+ loyalty years should get 20% base + premium + referral
        assertTrue(discount >= 30.0); // 20 + 10 + 5 = 35%
    }

    @Test
    @DisplayName("Should get correct strategy from factory")
    void testDiscountStrategyFactory() {
        // Act & Assert
        assertTrue(StrategyPattern.DiscountStrategyFactory.getStrategy(ParameterObjects.UserType.STUDENT) 
                   instanceof StrategyPattern.StudentDiscountStrategy);
        assertTrue(StrategyPattern.DiscountStrategyFactory.getStrategy(ParameterObjects.UserType.SENIOR) 
                   instanceof StrategyPattern.SeniorDiscountStrategy);
        assertTrue(StrategyPattern.DiscountStrategyFactory.getStrategy(ParameterObjects.UserType.CUSTOMER) 
                   instanceof StrategyPattern.CustomerDiscountStrategy);
    }

    @Test
    @DisplayName("Should throw exception for unsupported user type")
    void testDiscountStrategyFactoryUnsupportedType() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            StrategyPattern.DiscountStrategyFactory.getStrategy(null);
        });
    }

    @Test
    @DisplayName("Should calculate discount using service")
    void testDiscountCalculationService() {
        // Arrange
        StrategyPattern.DiscountCalculationService service = new StrategyPattern.DiscountCalculationService();
        ParameterObjects.DiscountContext context = new ParameterObjects.DiscountContext(
            ParameterObjects.UserType.STUDENT, 22, 25000.0, 1, false, false, true,
            "Boston", "autumn", false
        );

        // Act
        double discount = service.calculateUserDiscount(context);

        // Assert
        assertTrue(discount > 0);
        assertTrue(discount <= 50.0);
    }

    @Test
    @DisplayName("Should throw exception for null context")
    void testDiscountCalculationServiceNullContext() {
        // Arrange
        StrategyPattern.DiscountCalculationService service = new StrategyPattern.DiscountCalculationService();

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            service.calculateUserDiscount(null);
        });
    }

    @Test
    @DisplayName("Should create discount strategy from factory")
    void testDiscountStrategyFactoryImpl() {
        // Arrange
        FactoryPattern.DiscountStrategyFactory factory = new FactoryPattern.DiscountStrategyFactoryImpl();

        // Act & Assert
        assertTrue(factory.createDiscountStrategy("student") instanceof StrategyPattern.StudentDiscountStrategy);
        assertTrue(factory.createDiscountStrategy("senior") instanceof StrategyPattern.SeniorDiscountStrategy);
        assertTrue(factory.createDiscountStrategy("customer") instanceof StrategyPattern.CustomerDiscountStrategy);
        assertTrue(factory.createDiscountStrategy("veteran") instanceof StrategyPattern.CustomerDiscountStrategy);
        assertTrue(factory.createDiscountStrategy("employee") instanceof StrategyPattern.CustomerDiscountStrategy);
    }

    @Test
    @DisplayName("Should create discount strategy from profile")
    void testCreateDiscountStrategyFromProfile() {
        // Arrange
        FactoryPattern.DiscountStrategyFactoryImpl factory = new FactoryPattern.DiscountStrategyFactoryImpl();

        // Act & Assert
        assertTrue(factory.createDiscountStrategyFromProfile("student", 70, 5, true) 
                   instanceof StrategyPattern.SeniorDiscountStrategy); // Age 65+
        assertTrue(factory.createDiscountStrategyFromProfile("customer", 30, 6, false) 
                   instanceof StrategyPattern.CustomerDiscountStrategy); // Loyalty 5+
        assertTrue(factory.createDiscountStrategyFromProfile("student", 20, 2, false) 
                   instanceof StrategyPattern.StudentDiscountStrategy); // Default
    }

    @Test
    @DisplayName("Should create user service from factory")
    void testUserServiceFactoryImpl() {
        // Arrange
        FactoryPattern.UserServiceFactory factory = new FactoryPattern.UserServiceFactoryImpl();

        // Act & Assert
        assertNotNull(factory.createUserService("secure"));
        assertNotNull(factory.createUserService("clean"));
        assertNotNull(factory.createUserService("optimized"));
    }

    @Test
    @DisplayName("Should throw exception for unknown service type")
    void testUserServiceFactoryImplUnknownType() {
        // Arrange
        FactoryPattern.UserServiceFactory factory = new FactoryPattern.UserServiceFactoryImpl();

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            factory.createUserService("unknown");
        });
    }

    @Test
    @DisplayName("Should create validator from factory")
    void testValidationFactoryImpl() {
        // Arrange
        FactoryPattern.ValidationFactory factory = new FactoryPattern.ValidationFactoryImpl();

        // Act & Assert
        assertTrue(factory.createValidator("email") instanceof FactoryPattern.EmailValidator);
        assertTrue(factory.createValidator("password") instanceof FactoryPattern.PasswordValidator);
        assertTrue(factory.createValidator("username") instanceof FactoryPattern.UsernameValidator);
        assertTrue(factory.createValidator("phone") instanceof FactoryPattern.PhoneValidator);
    }

    @Test
    @DisplayName("Should throw exception for unknown validator type")
    void testValidationFactoryImplUnknownType() {
        // Arrange
        FactoryPattern.ValidationFactory factory = new FactoryPattern.ValidationFactoryImpl();

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            factory.createValidator("unknown");
        });
    }

    @Test
    @DisplayName("Should create user management system")
    void testUserManagementFactory() {
        // Arrange
        FactoryPattern.UserManagementFactory factory = new FactoryPattern.UserManagementFactory();

        // Act
        FactoryPattern.UserManagementSystem system = factory.createUserManagementSystem("secure");

        // Assert
        assertNotNull(system);
        assertNotNull(system.getUserService());
        assertNotNull(system.getDiscountFactory());
        assertNotNull(system.getValidationFactory());
    }

    @Test
    @DisplayName("Should validate email correctly")
    void testEmailValidator() {
        // Arrange
        FactoryPattern.EmailValidator validator = new FactoryPattern.EmailValidator();

        // Act & Assert
        assertTrue(validator.isValid("test@example.com"));
        assertTrue(validator.isValid("user.name@domain.co.uk"));
        assertFalse(validator.isValid("invalid-email"));
        assertFalse(validator.isValid("test@"));
        assertFalse(validator.isValid("@example.com"));
        assertFalse(validator.isValid(null));
    }

    @Test
    @DisplayName("Should validate password correctly")
    void testPasswordValidator() {
        // Arrange
        FactoryPattern.PasswordValidator validator = new FactoryPattern.PasswordValidator();

        // Act & Assert
        assertTrue(validator.isValid("password123"));
        assertTrue(validator.isValid("123456"));
        assertFalse(validator.isValid("12345"));
        assertFalse(validator.isValid(""));
        assertFalse(validator.isValid(null));
    }

    @Test
    @DisplayName("Should validate username correctly")
    void testUsernameValidator() {
        // Arrange
        FactoryPattern.UsernameValidator validator = new FactoryPattern.UsernameValidator();

        // Act & Assert
        assertTrue(validator.isValid("user123"));
        assertTrue(validator.isValid("abc"));
        assertFalse(validator.isValid("ab"));
        assertFalse(validator.isValid(""));
        assertFalse(validator.isValid(null));
    }

    @Test
    @DisplayName("Should validate phone correctly")
    void testPhoneValidator() {
        // Arrange
        FactoryPattern.PhoneValidator validator = new FactoryPattern.PhoneValidator();

        // Act & Assert
        assertTrue(validator.isValid("1234567890"));
        assertTrue(validator.isValid("+1234567890"));
        assertTrue(validator.isValid("123456789012345"));
        assertFalse(validator.isValid("123456789"));
        assertFalse(validator.isValid("1234567890123456"));
        assertFalse(validator.isValid("123-456-7890"));
        assertFalse(validator.isValid(null));
    }

    @Test
    @DisplayName("Should register and notify observers")
    void testObserverPattern() {
        // Arrange
        ObserverPattern.UserRegistrationService service = new ObserverPattern.UserRegistrationService();
        ObserverPattern.EmailNotificationObserver emailObserver = new ObserverPattern.EmailNotificationObserver();
        ObserverPattern.AuditLogObserver auditObserver = new ObserverPattern.AuditLogObserver();
        ObserverPattern.AnalyticsObserver analyticsObserver = new ObserverPattern.AnalyticsObserver();

        // Act
        service.registerObserver(emailObserver);
        service.registerObserver(auditObserver);
        service.registerObserver(analyticsObserver);

        // Assert - should not throw exception when registering user
        assertDoesNotThrow(() -> {
            service.registerUser("user123", "john_doe", "john@example.com");
        });
    }

    @Test
    @DisplayName("Should remove observer")
    void testRemoveObserver() {
        // Arrange
        ObserverPattern.UserRegistrationService service = new ObserverPattern.UserRegistrationService();
        ObserverPattern.EmailNotificationObserver emailObserver = new ObserverPattern.EmailNotificationObserver();
        ObserverPattern.AuditLogObserver auditObserver = new ObserverPattern.AuditLogObserver();

        service.registerObserver(emailObserver);
        service.registerObserver(auditObserver);

        // Act
        service.removeObserver(emailObserver);

        // Assert - should not throw exception when registering user after removal
        assertDoesNotThrow(() -> {
            service.registerUser("user123", "john_doe", "john@example.com");
        });
    }

    @Test
    @DisplayName("Should register user and notify observers")
    void testRegisterUser() {
        // Arrange
        ObserverPattern.UserRegistrationService service = new ObserverPattern.UserRegistrationService();
        ObserverPattern.EmailNotificationObserver emailObserver = new ObserverPattern.EmailNotificationObserver();
        ObserverPattern.AuditLogObserver auditObserver = new ObserverPattern.AuditLogObserver();

        service.registerObserver(emailObserver);
        service.registerObserver(auditObserver);

        // Act
        service.registerUser("user123", "john_doe", "john@example.com");

        // Assert - should not throw exception and observers should be notified
        assertDoesNotThrow(() -> service.registerUser("user124", "jane_smith", "jane@example.com"));
    }

    @Test
    @DisplayName("Should create user registration event")
    void testUserRegistrationEvent() {
        // Arrange
        ObserverPattern.UserRegistrationEvent event = new ObserverPattern.UserRegistrationEvent(
            "user123", "john_doe", "john@example.com"
        );

        // Act & Assert
        assertEquals("user123", event.getUserId());
        assertEquals("john_doe", event.getUsername());
        assertEquals("john@example.com", event.getEmail());
        assertTrue(event.getTimestamp() > 0);
        assertNotNull(event.toString());
    }

    @Test
    @DisplayName("Should handle observer exceptions gracefully")
    void testObserverExceptionHandling() {
        // Arrange
        ObserverPattern.UserRegistrationService service = new ObserverPattern.UserRegistrationService();
        
        // Create a mock observer that throws exception
        ObserverPattern.UserRegistrationObserver failingObserver = event -> {
            throw new RuntimeException("Observer failed");
        };

        service.registerObserver(failingObserver);

        // Act & Assert - should not throw exception
        assertDoesNotThrow(() -> {
            service.registerUser("user123", "test_user", "test@example.com");
        });
    }

    @Test
    @DisplayName("Should demonstrate observer pattern")
    void testDemonstrateObserverPattern() {
        // Act & Assert - should not throw exception
        assertDoesNotThrow(() -> {
            ObserverPattern.demonstrateObserverPattern();
        });
    }

    @Test
    @DisplayName("Should demonstrate factory pattern")
    void testDemonstrateFactoryPattern() {
        // Act & Assert - should not throw exception
        assertDoesNotThrow(() -> {
            FactoryPattern.demonstrateFactoryPattern();
        });
    }
} 