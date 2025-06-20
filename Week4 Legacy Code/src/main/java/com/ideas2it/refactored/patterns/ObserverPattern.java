package com.ideas2it.refactored.patterns;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

/**
 * Observer Pattern Implementation for User Registration Events
 * 
 * This pattern allows different components to be notified when user registration events occur,
 * promoting loose coupling between the user service and notification systems.
 */
public class ObserverPattern {
    
    private static final Logger logger = Logger.getLogger(ObserverPattern.class.getName());
    
    /**
     * Subject interface that notifies observers of events
     */
    public interface UserRegistrationSubject {
        void registerObserver(UserRegistrationObserver observer);
        void removeObserver(UserRegistrationObserver observer);
        void notifyObservers(UserRegistrationEvent event);
    }
    
    /**
     * Observer interface for handling user registration events
     */
    public interface UserRegistrationObserver {
        void onUserRegistered(UserRegistrationEvent event);
    }
    
    /**
     * Event class containing user registration data
     */
    public static class UserRegistrationEvent {
        private final String userId;
        private final String username;
        private final String email;
        private final long timestamp;
        
        public UserRegistrationEvent(String userId, String username, String email) {
            this.userId = userId;
            this.username = username;
            this.email = email;
            this.timestamp = System.currentTimeMillis();
        }
        
        public String getUserId() { return userId; }
        public String getUsername() { return username; }
        public String getEmail() { return email; }
        public long getTimestamp() { return timestamp; }
        
        @Override
        public String toString() {
            return String.format("UserRegistrationEvent{userId='%s', username='%s', email='%s', timestamp=%d}", 
                               userId, username, email, timestamp);
        }
    }
    
    /**
     * Concrete subject implementation for user registration
     */
    public static class UserRegistrationService implements UserRegistrationSubject {
        private final List<UserRegistrationObserver> observers = new ArrayList<>();
        
        @Override
        public void registerObserver(UserRegistrationObserver observer) {
            if (observer != null && !observers.contains(observer)) {
                observers.add(observer);
                logger.info("Observer registered: " + observer.getClass().getSimpleName());
            }
        }
        
        @Override
        public void removeObserver(UserRegistrationObserver observer) {
            if (observers.remove(observer)) {
                logger.info("Observer removed: " + observer.getClass().getSimpleName());
            }
        }
        
        @Override
        public void notifyObservers(UserRegistrationEvent event) {
            logger.info("Notifying " + observers.size() + " observers of user registration: " + event.getUsername());
            for (UserRegistrationObserver observer : observers) {
                try {
                    observer.onUserRegistered(event);
                } catch (Exception e) {
                    logger.warning("Observer " + observer.getClass().getSimpleName() + " failed: " + e.getMessage());
                }
            }
        }
        
        /**
         * Simulates user registration and notifies all observers
         */
        public void registerUser(String userId, String username, String email) {
            logger.info("Registering user: " + username);
            
            // Simulate user registration process
            // In a real application, this would save to database
            
            // Create event and notify observers
            UserRegistrationEvent event = new UserRegistrationEvent(userId, username, email);
            notifyObservers(event);
            
            logger.info("User registration completed: " + username);
        }
    }
    
    /**
     * Email notification observer
     */
    public static class EmailNotificationObserver implements UserRegistrationObserver {
        @Override
        public void onUserRegistered(UserRegistrationEvent event) {
            logger.info("Sending welcome email to: " + event.getEmail());
            // In a real application, this would send an actual email
            System.out.println("Welcome email sent to: " + event.getEmail());
        }
    }
    
    /**
     * Audit logging observer
     */
    public static class AuditLogObserver implements UserRegistrationObserver {
        @Override
        public void onUserRegistered(UserRegistrationEvent event) {
            logger.info("Audit log entry created for user: " + event.getUsername());
            // In a real application, this would write to audit log
            System.out.println("Audit log: User " + event.getUsername() + " registered at " + event.getTimestamp());
        }
    }
    
    /**
     * Analytics observer
     */
    public static class AnalyticsObserver implements UserRegistrationObserver {
        @Override
        public void onUserRegistered(UserRegistrationEvent event) {
            logger.info("Analytics event recorded for user: " + event.getUsername());
            // In a real application, this would send analytics data
            System.out.println("Analytics: New user registration - " + event.getUsername());
        }
    }
    
    /**
     * Demo method showing how to use the Observer pattern
     */
    public static void demonstrateObserverPattern() {
        logger.info("=== Observer Pattern Demonstration ===");
        
        // Create the subject (user registration service)
        UserRegistrationService registrationService = new UserRegistrationService();
        
        // Create and register observers
        EmailNotificationObserver emailObserver = new EmailNotificationObserver();
        AuditLogObserver auditObserver = new AuditLogObserver();
        AnalyticsObserver analyticsObserver = new AnalyticsObserver();
        
        registrationService.registerObserver(emailObserver);
        registrationService.registerObserver(auditObserver);
        registrationService.registerObserver(analyticsObserver);
        
        // Register a user (this will notify all observers)
        registrationService.registerUser("user123", "john_doe", "john@example.com");
        
        // Remove an observer
        registrationService.removeObserver(analyticsObserver);
        
        // Register another user (analytics observer won't be notified)
        registrationService.registerUser("user124", "jane_smith", "jane@example.com");
        
        logger.info("=== Observer Pattern Demonstration Complete ===");
    }
} 