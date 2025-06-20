package com.ideas2it.refactored.patterns;

import java.util.logging.Logger;
import com.ideas2it.refactored.utils.ParameterObjects;

/**
 * Factory Pattern Implementation for Creating Objects
 * 
 * This pattern centralizes object creation logic, making the code more maintainable
 * and allowing for easy extension of new object types.
 */
public class FactoryPattern {
    
    private static final Logger logger = Logger.getLogger(FactoryPattern.class.getName());
    
    /**
     * Factory interface for creating discount strategies
     */
    public interface DiscountStrategyFactory {
        StrategyPattern.DiscountStrategy createDiscountStrategy(String userType);
    }
    
    /**
     * Factory interface for creating user services
     */
    public interface UserServiceFactory {
        Object createUserService(String serviceType);
    }
    
    /**
     * Factory interface for creating validation utilities
     */
    public interface ValidationFactory {
        Object createValidator(String validatorType);
    }
    
    /**
     * Concrete factory implementation for discount strategies
     */
    public static class DiscountStrategyFactoryImpl implements DiscountStrategyFactory {
        
        @Override
        public StrategyPattern.DiscountStrategy createDiscountStrategy(String userType) {
            logger.info("Creating discount strategy for user type: " + userType);
            
            switch (userType.toLowerCase()) {
                case "student":
                    return new StrategyPattern.StudentDiscountStrategy();
                case "senior":
                    return new StrategyPattern.SeniorDiscountStrategy();
                case "veteran":
                case "employee":
                    return new StrategyPattern.CustomerDiscountStrategy();
                case "customer":
                default:
                    return new StrategyPattern.CustomerDiscountStrategy();
            }
        }
        
        /**
         * Creates a discount strategy based on user profile
         */
        public StrategyPattern.DiscountStrategy createDiscountStrategyFromProfile(
                String userType, int age, int loyaltyYears, boolean isPremium) {
            
            logger.info("Creating discount strategy from profile: " + userType + ", age: " + age + 
                       ", loyalty: " + loyaltyYears + ", premium: " + isPremium);
            
            // Complex logic for determining the best discount strategy
            if (age >= 65) {
                return new StrategyPattern.SeniorDiscountStrategy();
            } else if (loyaltyYears >= 5) {
                return new StrategyPattern.CustomerDiscountStrategy();
            } else {
                return createDiscountStrategy(userType);
            }
        }
    }
    
    /**
     * Concrete factory implementation for user services
     */
    public static class UserServiceFactoryImpl implements UserServiceFactory {
        
        @Override
        public Object createUserService(String serviceType) {
            logger.info("Creating user service of type: " + serviceType);
            
            switch (serviceType.toLowerCase()) {
                case "secure":
                    return new com.ideas2it.refactored.SecureUserService(null);
                case "clean":
                    return new com.ideas2it.refactored.CleanUserService(null, null, null);
                case "optimized":
                    return new com.ideas2it.refactored.OptimizedPerformance();
                default:
                    throw new IllegalArgumentException("Unknown service type: " + serviceType);
            }
        }
    }
    
    /**
     * Concrete factory implementation for validation utilities
     */
    public static class ValidationFactoryImpl implements ValidationFactory {
        
        @Override
        public Object createValidator(String validatorType) {
            logger.info("Creating validator of type: " + validatorType);
            
            switch (validatorType.toLowerCase()) {
                case "email":
                    return new EmailValidator();
                case "password":
                    return new PasswordValidator();
                case "username":
                    return new UsernameValidator();
                case "phone":
                    return new PhoneValidator();
                default:
                    throw new IllegalArgumentException("Unknown validator type: " + validatorType);
            }
        }
    }
    
    /**
     * Abstract factory for creating related objects
     */
    public static class UserManagementFactory {
        private final DiscountStrategyFactory discountFactory;
        private final UserServiceFactory userServiceFactory;
        private final ValidationFactory validationFactory;
        
        public UserManagementFactory() {
            this.discountFactory = new DiscountStrategyFactoryImpl();
            this.userServiceFactory = new UserServiceFactoryImpl();
            this.validationFactory = new ValidationFactoryImpl();
        }
        
        public DiscountStrategyFactory getDiscountStrategyFactory() {
            return discountFactory;
        }
        
        public UserServiceFactory getUserServiceFactory() {
            return userServiceFactory;
        }
        
        public ValidationFactory getValidationFactory() {
            return validationFactory;
        }
        
        /**
         * Creates a complete user management system
         */
        public UserManagementSystem createUserManagementSystem(String serviceType) {
            logger.info("Creating complete user management system with service type: " + serviceType);
            
            Object userService = userServiceFactory.createUserService(serviceType);
            return new UserManagementSystem(userService, discountFactory, validationFactory);
        }
    }
    
    /**
     * User management system that uses factory-created components
     */
    public static class UserManagementSystem {
        private final Object userService;
        private final DiscountStrategyFactory discountFactory;
        private final ValidationFactory validationFactory;
        
        public UserManagementSystem(Object userService, DiscountStrategyFactory discountFactory, 
                                  ValidationFactory validationFactory) {
            this.userService = userService;
            this.discountFactory = discountFactory;
            this.validationFactory = validationFactory;
        }
        
        public Object getUserService() { return userService; }
        public DiscountStrategyFactory getDiscountFactory() { return discountFactory; }
        public ValidationFactory getValidationFactory() { return validationFactory; }
    }
    
    /**
     * Validator for email addresses.
     */
    public static class EmailValidator {
        private static final String EMAIL_PATTERN = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
        
        /**
         * Checks if the email is valid.
         * @param email Email address
         * @return true if valid, false otherwise
         */
        public boolean isValid(String email) {
            return email != null && email.matches(EMAIL_PATTERN);
        }
    }
    
    /**
     * Validator for passwords.
     */
    public static class PasswordValidator {
        /**
         * Checks if the password is valid.
         * @param password Password string
         * @return true if valid, false otherwise
         */
        public boolean isValid(String password) {
            return password != null && password.length() >= 6;
        }
    }
    
    /**
     * Validator for usernames.
     */
    public static class UsernameValidator {
        /**
         * Checks if the username is valid.
         * @param username Username string
         * @return true if valid, false otherwise
         */
        public boolean isValid(String username) {
            return username != null && username.length() >= 3;
        }
    }
    
    /**
     * Validator for phone numbers.
     */
    public static class PhoneValidator {
        /**
         * Checks if the phone number is valid.
         * @param phone Phone number string
         * @return true if valid, false otherwise
         */
        public boolean isValid(String phone) {
            return phone != null && phone.matches("^[+]?[0-9]{10,15}$");
        }
    }
    
    /**
     * Demo method showing how to use the Factory pattern
     */
    public static void demonstrateFactoryPattern() {
        logger.info("=== Factory Pattern Demonstration ===");
        
        // Create the main factory
        UserManagementFactory factory = new UserManagementFactory();
        
        // Create discount strategies
        StrategyPattern.DiscountStrategy studentStrategy = 
            factory.getDiscountStrategyFactory().createDiscountStrategy("student");
        StrategyPattern.DiscountStrategy seniorStrategy = 
            factory.getDiscountStrategyFactory().createDiscountStrategy("senior");
        
        // Create user services
        Object secureService = factory.getUserServiceFactory().createUserService("secure");
        Object cleanService = factory.getUserServiceFactory().createUserService("clean");
        
        // Create validators
        EmailValidator emailValidator = (EmailValidator) factory.getValidationFactory().createValidator("email");
        PasswordValidator passwordValidator = (PasswordValidator) factory.getValidationFactory().createValidator("password");
        
        // Test the created objects
        ParameterObjects.DiscountContext studentContext = new ParameterObjects.DiscountContext(
            ParameterObjects.UserType.STUDENT, 20, 25000, 2, true, false, true, "spring", "spring", true
        );
        ParameterObjects.DiscountContext seniorContext = new ParameterObjects.DiscountContext(
            ParameterObjects.UserType.SENIOR, 70, 40000, 5, false, true, false, "winter", "winter", false
        );
        
        System.out.println("Student discount: " + studentStrategy.calculateDiscount(studentContext));
        System.out.println("Senior discount: " + seniorStrategy.calculateDiscount(seniorContext));
        System.out.println("Email valid: " + emailValidator.isValid("test@example.com"));
        System.out.println("Password valid: " + passwordValidator.isValid("password123"));
        
        // Create complete system
        UserManagementSystem system = factory.createUserManagementSystem("secure");
        System.out.println("User management system created with: " + system.getUserService().getClass().getSimpleName());
        
        logger.info("=== Factory Pattern Demonstration Complete ===");
    }
} 