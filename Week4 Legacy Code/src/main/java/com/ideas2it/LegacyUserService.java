package com.ideas2it;

import java.sql.*;
import java.util.*;
import java.io.*;
import java.net.URL;
import java.net.URLConnection;
import java.text.SimpleDateFormat;
import java.util.concurrent.atomic.AtomicInteger;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

/**
 * LEGACY CODE - Week 4 AI-Driven Code Review & Refactoring
 * 
 * This class contains intentionally messy code with multiple issues:
 * - 200+ line method (processUserRegistration)
 * - Security vulnerabilities (SQL injection, hardcoded credentials)
 * - Performance bottlenecks (blocking I/O, memory leaks)
 * - Code quality issues (duplication, poor exception handling)
 * - High cyclomatic complexity
 * - Global variables and state management issues
 */
public class LegacyUserService {
    
    // SECURITY ISSUE #1: Hardcoded credentials
    private static final String DB_URL = "jdbc:mysql://localhost:3306/production_db";
    private static final String DB_USER = "admin";
    private static final String DB_PASSWORD = "super_secret_password_123";
    private static final String API_KEY = "sk-1234567890abcdef1234567890abcdef";
    
    // CODE QUALITY ISSUE #1: Global variables
    private static String globalUserData = "";
    private static int globalCounter = 0;
    private static List<String> globalList = new ArrayList<>();
    private static Map<String, String> userCache = new HashMap<>();
    
    // PERFORMANCE ISSUE #1: Memory leak - static list that grows indefinitely
    private static final List<String> memoryLeakList = new ArrayList<>();
    
    /**
     * MAIN LEGACY METHOD - 200+ lines with multiple responsibilities
     * This method violates Single Responsibility Principle and contains:
     * - Input validation (20+ parameters)
     * - Database operations
     * - Email sending
     * - Logging
     * - State management
     * - Security vulnerabilities
     */
    public String processUserRegistration(String username, String email, String password, String phone, String address, 
                                        String city, String state, String zipCode, String country, String dateOfBirth,
                                        String gender, String occupation, String company, String website, String bio,
                                        String profilePicture, String socialMediaLinks, String preferences, String settings,
                                        boolean newsletter, boolean termsAccepted, String ipAddress, String userAgent) {
        
        // SECURITY ISSUE #2: Poor input validation
        if (username == null || username.isEmpty()) {
            return "Error: Username is required";
        }
        if (email == null || email.isEmpty()) {
            return "Error: Email is required";
        }
        if (password == null || password.isEmpty()) {
            return "Error: Password is required";
        }
        
        // CODE QUALITY ISSUE #2: Repetitive validation logic
        if (username.length() < 3) {
            return "Error: Username must be at least 3 characters";
        }
        if (username.length() > 50) {
            return "Error: Username must be less than 50 characters";
        }
        if (email.length() < 5) {
            return "Error: Email must be at least 5 characters";
        }
        if (email.length() > 100) {
            return "Error: Email must be less than 100 characters";
        }
        if (password.length() < 6) {
            return "Error: Password must be at least 6 characters";
        }
        if (password.length() > 128) {
            return "Error: Password must be less than 128 characters";
        }
        
        // SECURITY ISSUE #3: Weak email validation
        if (!email.contains("@") || !email.contains(".")) {
            return "Error: Invalid email format";
        }
        
        // More repetitive validation...
        if (phone != null && !phone.isEmpty()) {
            if (phone.length() < 10) {
                return "Error: Phone number must be at least 10 digits";
            }
            if (phone.length() > 15) {
                return "Error: Phone number must be less than 15 digits";
            }
        }
        
        if (address != null && !address.isEmpty()) {
            if (address.length() < 5) {
                return "Error: Address must be at least 5 characters";
            }
            if (address.length() > 200) {
                return "Error: Address must be less than 200 characters";
            }
        }
        
        if (city != null && !city.isEmpty()) {
            if (city.length() < 2) {
                return "Error: City must be at least 2 characters";
            }
            if (city.length() > 50) {
                return "Error: City must be less than 50 characters";
            }
        }
        
        if (state != null && !state.isEmpty()) {
            if (state.length() < 2) {
                return "Error: State must be at least 2 characters";
            }
            if (state.length() > 50) {
                return "Error: State must be less than 50 characters";
            }
        }
        
        if (zipCode != null && !zipCode.isEmpty()) {
            if (zipCode.length() < 5) {
                return "Error: Zip code must be at least 5 characters";
            }
            if (zipCode.length() > 10) {
                return "Error: Zip code must be less than 10 characters";
            }
        }
        
        if (country != null && !country.isEmpty()) {
            if (country.length() < 2) {
                return "Error: Country must be at least 2 characters";
            }
            if (country.length() > 50) {
                return "Error: Country must be less than 50 characters";
            }
        }
        
        // Date validation
        if (dateOfBirth != null && !dateOfBirth.isEmpty()) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
                sdf.parse(dateOfBirth);
            } catch (Exception e) {
                return "Error: Invalid date of birth format";
            }
        }
        
        // Gender validation
        if (gender != null && !gender.isEmpty()) {
            if (!gender.equals("male") && !gender.equals("female") && !gender.equals("other")) {
                return "Error: Gender must be male, female, or other";
            }
        }
        
        // More validation...
        if (occupation != null && !occupation.isEmpty()) {
            if (occupation.length() < 2) {
                return "Error: Occupation must be at least 2 characters";
            }
            if (occupation.length() > 100) {
                return "Error: Occupation must be less than 100 characters";
            }
        }
        
        if (company != null && !company.isEmpty()) {
            if (company.length() < 2) {
                return "Error: Company must be at least 2 characters";
            }
            if (company.length() > 100) {
                return "Error: Company must be less than 100 characters";
            }
        }
        
        if (website != null && !website.isEmpty()) {
            if (!website.startsWith("http://") && !website.startsWith("https://")) {
                website = "http://" + website;
            }
            if (website.length() > 200) {
                return "Error: Website must be less than 200 characters";
            }
        }
        
        if (bio != null && !bio.isEmpty()) {
            if (bio.length() > 1000) {
                return "Error: Bio must be less than 1000 characters";
            }
        }
        
        if (profilePicture != null && !profilePicture.isEmpty()) {
            if (profilePicture.length() > 500) {
                return "Error: Profile picture URL must be less than 500 characters";
            }
        }
        
        if (socialMediaLinks != null && !socialMediaLinks.isEmpty()) {
            if (socialMediaLinks.length() > 1000) {
                return "Error: Social media links must be less than 1000 characters";
            }
        }
        
        if (preferences != null && !preferences.isEmpty()) {
            if (preferences.length() > 500) {
                return "Error: Preferences must be less than 500 characters";
            }
        }
        
        if (settings != null && !settings.isEmpty()) {
            if (settings.length() > 500) {
                return "Error: Settings must be less than 500 characters";
            }
        }
        
        if (ipAddress != null && !ipAddress.isEmpty()) {
            if (ipAddress.length() > 45) {
                return "Error: IP address must be less than 45 characters";
            }
        }
        
        if (userAgent != null && !userAgent.isEmpty()) {
            if (userAgent.length() > 500) {
                return "Error: User agent must be less than 500 characters";
            }
        }
        
        // SECURITY ISSUE #4: SQL Injection vulnerable database operations
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        
        try {
            conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
            
            // VULNERABLE: Direct string concatenation for SQL
            String checkQuery = "SELECT id FROM users WHERE username = '" + username + "' OR email = '" + email + "'";
            pstmt = conn.prepareStatement(checkQuery);
            rs = pstmt.executeQuery();
            
            if (rs.next()) {
                return "Error: User already exists";
            }
            
            // VULNERABLE: More SQL injection
            String insertQuery = "INSERT INTO users (username, email, password, phone, address, city, state, zip_code, " +
                               "country, date_of_birth, gender, occupation, company, website, bio, profile_picture, " +
                               "social_media_links, preferences, settings, newsletter, terms_accepted, ip_address, " +
                               "user_agent, created_at, updated_at) VALUES ('" + username + "', '" + email + "', '" + 
                               password + "', '" + phone + "', '" + address + "', '" + city + "', '" + state + "', '" + 
                               zipCode + "', '" + country + "', '" + dateOfBirth + "', '" + gender + "', '" + occupation + 
                               "', '" + company + "', '" + website + "', '" + bio + "', '" + profilePicture + "', '" + 
                               socialMediaLinks + "', '" + preferences + "', '" + settings + "', " + newsletter + ", " + 
                               termsAccepted + ", '" + ipAddress + "', '" + userAgent + "', NOW(), NOW())";
            
            pstmt = conn.prepareStatement(insertQuery);
            int result = pstmt.executeUpdate();
            
            if (result > 0) {
                // PERFORMANCE ISSUE #2: Blocking I/O operations
                sendWelcomeEmail(email, username);
                logUserRegistration(username, email, ipAddress);
                
                // CODE QUALITY ISSUE #3: Global state mutation
                globalUserData = username + "|" + email;
                globalCounter++;
                globalList.add(username);
                memoryLeakList.add(username); // PERFORMANCE ISSUE #3: Memory leak
                
                return "Success: User registered successfully";
            } else {
                return "Error: Failed to register user";
            }
            
        } catch (SQLException e) {
            // CODE QUALITY ISSUE #4: Poor exception handling
            e.printStackTrace();
            return "Error: Database error occurred";
        } catch (Exception e) {
            // CODE QUALITY ISSUE #5: Generic exception handling
            e.printStackTrace();
            return "Error: An unexpected error occurred";
        } finally {
            // CODE QUALITY ISSUE #6: Duplicated resource cleanup
            try {
                if (rs != null) rs.close();
                if (pstmt != null) pstmt.close();
                if (conn != null) conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
    
    /**
     * PERFORMANCE ISSUE #4: Blocking I/O in main thread
     */
    private void sendWelcomeEmail(String email, String username) {
        try {
            URL url = new URL("http://email-service.com/send");
            URLConnection connection = url.openConnection();
            connection.setDoOutput(true);
            
            String emailData = "to=" + email + "&subject=Welcome&body=Hello " + username + ", welcome to our platform!";
            connection.getOutputStream().write(emailData.getBytes());
            
            BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            String response = reader.readLine();
            reader.close();
            
            System.out.println("Email sent: " + response);
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * PERFORMANCE ISSUE #5: Synchronous logging
     */
    private void logUserRegistration(String username, String email, String ipAddress) {
        try {
            File logFile = new File("user_registrations.log");
            FileWriter writer = new FileWriter(logFile, true);
            writer.write(new java.util.Date() + " - User registered: " + username + " (" + email + ") from IP: " + ipAddress + "\n");
            writer.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * CODE QUALITY ISSUE #7: High cyclomatic complexity method
     */
    public String calculateUserDiscount(String userType, int age, double income, int loyaltyYears, 
                                      boolean isPremium, boolean hasReferral, boolean isFirstTime, 
                                      String location, String season, boolean isHoliday) {
        
        double discount = 0.0;
        
        if (userType.equals("student")) {
            if (age < 18) {
                discount += 10.0;
            } else if (age >= 18 && age <= 25) {
                discount += 15.0;
            } else {
                discount += 5.0;
            }
        } else if (userType.equals("senior")) {
            if (age >= 65) {
                discount += 20.0;
            } else if (age >= 60) {
                discount += 15.0;
            } else {
                discount += 10.0;
            }
        } else if (userType.equals("veteran")) {
            discount += 25.0;
        } else if (userType.equals("employee")) {
            discount += 30.0;
        } else if (userType.equals("customer")) {
            if (loyaltyYears >= 5) {
                discount += 20.0;
            } else if (loyaltyYears >= 3) {
                discount += 15.0;
            } else if (loyaltyYears >= 1) {
                discount += 10.0;
            } else {
                discount += 5.0;
            }
        }
        
        if (income < 30000) {
            discount += 5.0;
        } else if (income < 50000) {
            discount += 3.0;
        } else if (income < 100000) {
            discount += 1.0;
        }
        
        if (isPremium) {
            discount += 10.0;
        }
        
        if (hasReferral) {
            discount += 5.0;
        }
        
        if (isFirstTime) {
            discount += 15.0;
        }
        
        if (location.equals("NYC") || location.equals("LA") || location.equals("Chicago")) {
            discount += 2.0;
        } else if (location.equals("Miami") || location.equals("Seattle")) {
            discount += 3.0;
        }
        
        if (season.equals("winter")) {
            discount += 5.0;
        } else if (season.equals("summer")) {
            discount += 3.0;
        } else if (season.equals("spring")) {
            discount += 2.0;
        }
        
        if (isHoliday) {
            discount += 10.0;
        }
        
        if (discount > 50.0) {
            discount = 50.0;
        }
        
        return String.format("%.2f", discount);
    }
    
    /**
     * CODE QUALITY ISSUE #8: Code duplication across methods
     */
    public void processData(String data) {
        if (data == null || data.isEmpty()) {
            System.out.println("Error: Data is required");
            return;
        }
        if (data.length() < 5) {
            System.out.println("Error: Data must be at least 5 characters");
            return;
        }
        if (data.length() > 100) {
            System.out.println("Error: Data must be less than 100 characters");
            return;
        }
        System.out.println("Processing: " + data);
    }
    
    public void processUserData(String userData) {
        if (userData == null || userData.isEmpty()) {
            System.out.println("Error: User data is required");
            return;
        }
        if (userData.length() < 5) {
            System.out.println("Error: User data must be at least 5 characters");
            return;
        }
        if (userData.length() > 100) {
            System.out.println("Error: User data must be less than 100 characters");
            return;
        }
        System.out.println("Processing user data: " + userData);
    }
    
    public void processOrderData(String orderData) {
        if (orderData == null || orderData.isEmpty()) {
            System.out.println("Error: Order data is required");
            return;
        }
        if (orderData.length() < 5) {
            System.out.println("Error: Order data must be at least 5 characters");
            return;
        }
        if (orderData.length() > 100) {
            System.out.println("Error: Order data must be less than 100 characters");
            return;
        }
        System.out.println("Processing order data: " + orderData);
    }
    
    /**
     * SECURITY ISSUE #5: Weak password hashing
     */
    public String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(password.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * PERFORMANCE ISSUE #6: Inefficient string concatenation
     */
    public String buildLargeString(List<String> items) {
        String result = "";
        for (String item : items) {
            result += item + ", ";
        }
        return result;
    }
    
    /**
     * PERFORMANCE ISSUE #7: Poor caching strategy
     */
    public String getCachedData(String key) {
        if (userCache.containsKey(key)) {
            return userCache.get(key);
        }
        String data = fetchDataFromNetwork("http://api.example.com/data/" + key);
        userCache.put(key, data);
        return data;
    }
    
    private String fetchDataFromNetwork(String url) {
        return "Data from " + url;
    }
    
    /**
     * PERFORMANCE ISSUE #8: Memory leak method
     */
    public void addToMemoryLeak(String data) {
        memoryLeakList.add(data);
        System.out.println("Added to memory leak list. Size: " + memoryLeakList.size());
    }
} 