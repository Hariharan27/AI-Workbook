package com.ideas2it.refactored.utils;

import java.time.LocalDate;
import java.util.Objects;

/**
 * Parameter objects to replace long parameter lists in legacy code.
 * These classes encapsulate related data and provide validation.
 */
public class ParameterObjects {

    /**
     * Encapsulates user registration request data.
     * Replaces 22 parameters in the original processUserRegistration method.
     */
    public static class UserRegistrationRequest {
        private final String username;
        private final String email;
        private final String password;
        private final UserProfile profile;
        private final String ipAddress;
        private final String userAgent;
        private final boolean newsletter;
        private final boolean termsAccepted;

        public UserRegistrationRequest(String username, String email, String password,
                                     UserProfile profile, String ipAddress, String userAgent,
                                     boolean newsletter, boolean termsAccepted) {
            this.username = Objects.requireNonNull(username, "Username cannot be null");
            this.email = Objects.requireNonNull(email, "Email cannot be null");
            this.password = Objects.requireNonNull(password, "Password cannot be null");
            this.profile = Objects.requireNonNull(profile, "Profile cannot be null");
            this.ipAddress = ipAddress;
            this.userAgent = userAgent;
            this.newsletter = newsletter;
            this.termsAccepted = termsAccepted;
        }

        // Getters
        public String getUsername() { return username; }
        public String getEmail() { return email; }
        public String getPassword() { return password; }
        public UserProfile getProfile() { return profile; }
        public String getIpAddress() { return ipAddress; }
        public String getUserAgent() { return userAgent; }
        public boolean isNewsletter() { return newsletter; }
        public boolean isTermsAccepted() { return termsAccepted; }

        @Override
        public String toString() {
            return "UserRegistrationRequest{" +
                    "username='" + username + '\'' +
                    ", email='" + email + '\'' +
                    ", profile=" + profile +
                    '}';
        }
    }

    /**
     * Encapsulates user profile information.
     */
    public static class UserProfile {
        private final String phone;
        private final String address;
        private final String city;
        private final String state;
        private final String zipCode;
        private final String country;
        private final LocalDate dateOfBirth;
        private final String gender;
        private final String occupation;
        private final String company;
        private final String website;
        private final String bio;
        private final String profilePicture;
        private final String socialMediaLinks;
        private final String preferences;
        private final String settings;

        public UserProfile(String phone, String address, String city, String state,
                          String zipCode, String country, LocalDate dateOfBirth,
                          String gender, String occupation, String company,
                          String website, String bio, String profilePicture,
                          String socialMediaLinks, String preferences, String settings) {
            this.phone = phone;
            this.address = address;
            this.city = city;
            this.state = state;
            this.zipCode = zipCode;
            this.country = country;
            this.dateOfBirth = dateOfBirth;
            this.gender = gender;
            this.occupation = occupation;
            this.company = company;
            this.website = website;
            this.bio = bio;
            this.profilePicture = profilePicture;
            this.socialMediaLinks = socialMediaLinks;
            this.preferences = preferences;
            this.settings = settings;
        }

        // Getters
        public String getPhone() { return phone; }
        public String getAddress() { return address; }
        public String getCity() { return city; }
        public String getState() { return state; }
        public String getZipCode() { return zipCode; }
        public String getCountry() { return country; }
        public LocalDate getDateOfBirth() { return dateOfBirth; }
        public String getGender() { return gender; }
        public String getOccupation() { return occupation; }
        public String getCompany() { return company; }
        public String getWebsite() { return website; }
        public String getBio() { return bio; }
        public String getProfilePicture() { return profilePicture; }
        public String getSocialMediaLinks() { return socialMediaLinks; }
        public String getPreferences() { return preferences; }
        public String getSettings() { return settings; }
    }

    /**
     * Encapsulates discount calculation context.
     * Replaces 10 parameters in the original calculateUserDiscount method.
     */
    public static class DiscountContext {
        private final UserType userType;
        private final int age;
        private final double income;
        private final int loyaltyYears;
        private final boolean isPremium;
        private final boolean hasReferral;
        private final boolean isFirstTime;
        private final String location;
        private final String season;
        private final boolean isHoliday;

        public DiscountContext(UserType userType, int age, double income, int loyaltyYears,
                             boolean isPremium, boolean hasReferral, boolean isFirstTime,
                             String location, String season, boolean isHoliday) {
            this.userType = Objects.requireNonNull(userType, "User type cannot be null");
            this.age = age;
            this.income = income;
            this.loyaltyYears = loyaltyYears;
            this.isPremium = isPremium;
            this.hasReferral = hasReferral;
            this.isFirstTime = isFirstTime;
            this.location = location;
            this.season = season;
            this.isHoliday = isHoliday;
        }

        // Getters
        public UserType getUserType() { return userType; }
        public int getAge() { return age; }
        public double getIncome() { return income; }
        public int getLoyaltyYears() { return loyaltyYears; }
        public boolean isPremium() { return isPremium; }
        public boolean hasReferral() { return hasReferral; }
        public boolean isFirstTime() { return isFirstTime; }
        public String getLocation() { return location; }
        public String getSeason() { return season; }
        public boolean isHoliday() { return isHoliday; }
    }

    /**
     * Encapsulates data processing request.
     * Replaces 6 parameters in the original processComplexData method.
     */
    public static class DataProcessingRequest {
        private final String data;
        private final int type;
        private final boolean flag;
        private final String option;
        private final java.util.List<String> items;
        private final java.util.Map<String, Object> config;

        public DataProcessingRequest(String data, int type, boolean flag, String option,
                                   java.util.List<String> items, java.util.Map<String, Object> config) {
            this.data = Objects.requireNonNull(data, "Data cannot be null");
            this.type = type;
            this.flag = flag;
            this.option = option;
            this.items = items;
            this.config = config;
        }

        // Getters
        public String getData() { return data; }
        public int getType() { return type; }
        public boolean isFlag() { return flag; }
        public String getOption() { return option; }
        public java.util.List<String> getItems() { return items; }
        public java.util.Map<String, Object> getConfig() { return config; }
    }

    /**
     * User type enumeration for discount calculations.
     */
    public enum UserType {
        STUDENT, SENIOR, VETERAN, EMPLOYEE, CUSTOMER
    }

    /**
     * Result object for user registration operations.
     */
    public static class RegistrationResult {
        private final boolean success;
        private final String message;
        private final String userId;
        private final java.util.List<String> errors;

        /**
         * Constructs a RegistrationResult.
         * @param success true if registration succeeded
         * @param message Result message
         * @param userId Registered user ID
         * @param errors List of error messages
         */
        private RegistrationResult(boolean success, String message, String userId, java.util.List<String> errors) {
            this.success = success;
            this.message = message;
            this.userId = userId;
            this.errors = errors;
        }

        /**
         * Creates a success result.
         * @param userId Registered user ID
         * @return RegistrationResult indicating success
         */
        public static RegistrationResult success(String userId) {
            return new RegistrationResult(true, "Registration successful", userId, null);
        }

        /**
         * Creates a failure result with a message.
         * @param message Error message
         * @return RegistrationResult indicating failure
         */
        public static RegistrationResult failure(String message) {
            return new RegistrationResult(false, message, null, java.util.List.of(message));
        }

        /**
         * Creates a failure result with a list of errors.
         * @param errors List of error messages
         * @return RegistrationResult indicating failure
         */
        public static RegistrationResult failure(java.util.List<String> errors) {
            return new RegistrationResult(false, "Validation failed", null, errors);
        }

        /** @return true if registration succeeded */
        public boolean isSuccess() { return success; }
        /** @return Result message */
        public String getMessage() { return message; }
        /** @return Registered user ID */
        public String getUserId() { return userId; }
        /** @return List of error messages */
        public java.util.List<String> getErrors() { return errors; }
    }

    /**
     * Result object for data processing operations.
     */
    public static class ProcessingResult {
        private final boolean success;
        private final String message;
        private final String recordId;
        private final Object processedData;
        private final java.util.List<String> errors;

        /**
         * Constructs a ProcessingResult.
         * @param success true if processing succeeded
         * @param message Result message
         * @param recordId Processed record ID
         * @param processedData Processed data object
         * @param errors List of error messages
         */
        private ProcessingResult(boolean success, String message, String recordId, Object processedData, java.util.List<String> errors) {
            this.success = success;
            this.message = message;
            this.recordId = recordId;
            this.processedData = processedData;
            this.errors = errors;
        }

        /**
         * Creates a success result.
         * @param recordId Processed record ID
         * @param processedData Processed data object
         * @return ProcessingResult indicating success
         */
        public static ProcessingResult success(String recordId, Object processedData) {
            return new ProcessingResult(true, "Processing successful", recordId, processedData, null);
        }

        /**
         * Creates a failure result with a message.
         * @param message Error message
         * @return ProcessingResult indicating failure
         */
        public static ProcessingResult failure(String message) {
            return new ProcessingResult(false, message, null, null, java.util.List.of(message));
        }

        /**
         * Creates a failure result with a list of errors.
         * @param errors List of error messages
         * @return ProcessingResult indicating failure
         */
        public static ProcessingResult failure(java.util.List<String> errors) {
            return new ProcessingResult(false, "Processing failed", null, null, errors);
        }

        /** @return true if processing succeeded */
        public boolean isSuccess() { return success; }
        /** @return Result message */
        public String getMessage() { return message; }
        /** @return Processed record ID */
        public String getRecordId() { return recordId; }
        /** @return Processed data object */
        public Object getProcessedData() { return processedData; }
        /** @return List of error messages */
        public java.util.List<String> getErrors() { return errors; }
    }
} 