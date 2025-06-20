package com.ideas2it;

import java.util.*;
import java.io.*;
import java.sql.*;

/**
 * LEGACY CODE - Code Quality Issues for Week 4 Analysis
 * 
 * This class contains intentional code quality problems:
 * - High cyclomatic complexity
 * - Code duplication
 * - Poor exception handling
 * - Magic numbers
 * - Long methods
 * - Inconsistent naming
 * - Poor separation of concerns
 * - Global state management
 */
public class CodeQualityIssues {
    
    // CODE QUALITY ISSUE #1: Global variables
    private static String globalData = "";
    private static int globalCounter = 0;
    private static List<String> globalList = new ArrayList<>();
    
    // CODE QUALITY ISSUE #2: Magic numbers
    private static final int MAX_SIZE = 100;
    private static final int MIN_SIZE = 5;
    private static final int MAX_LENGTH = 50;
    
    /**
     * CODE QUALITY ISSUE #3: Long method with multiple responsibilities
     */
    public String processComplexData(String data, int type, boolean flag, String option, 
                                   List<String> items, Map<String, Object> config) {
        
        // Validation logic
        if (data == null || data.isEmpty()) {
            return "Error: Data is required";
        }
        if (data.length() < MIN_SIZE) {
            return "Error: Data too short";
        }
        if (data.length() > MAX_LENGTH) {
            return "Error: Data too long";
        }
        
        // Processing logic
        String processedData = "";
        if (type == 1) {
            processedData = data.toUpperCase();
        } else if (type == 2) {
            processedData = data.toLowerCase();
        } else if (type == 3) {
            processedData = data.trim();
        } else if (type == 4) {
            processedData = data.replace(" ", "_");
        } else if (type == 5) {
            processedData = data.substring(0, Math.min(data.length(), 10));
        } else {
            processedData = data;
        }
        
        // Flag processing
        if (flag) {
            processedData = "FLAG_" + processedData;
        }
        
        // Option processing
        if (option != null && !option.isEmpty()) {
            if (option.equals("prefix")) {
                processedData = "PREFIX_" + processedData;
            } else if (option.equals("suffix")) {
                processedData = processedData + "_SUFFIX";
            } else if (option.equals("wrap")) {
                processedData = "[" + processedData + "]";
            }
        }
        
        // Items processing
        if (items != null && !items.isEmpty()) {
            StringBuilder itemsStr = new StringBuilder();
            for (String item : items) {
                itemsStr.append(item).append(",");
            }
            processedData = processedData + "_" + itemsStr.toString();
        }
        
        // Config processing
        if (config != null && !config.isEmpty()) {
            for (Map.Entry<String, Object> entry : config.entrySet()) {
                processedData = processedData + "_" + entry.getKey() + ":" + entry.getValue();
            }
        }
        
        // Database operations
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        
        try {
            conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/test", "user", "pass");
            String query = "INSERT INTO processed_data (data, type, flag, option, created_at) VALUES (?, ?, ?, ?, NOW())";
            pstmt = conn.prepareStatement(query);
            pstmt.setString(1, processedData);
            pstmt.setInt(2, type);
            pstmt.setBoolean(3, flag);
            pstmt.setString(4, option);
            int result = pstmt.executeUpdate();
            
            if (result > 0) {
                // Logging
                logProcessedData(processedData, type);
                
                // Update global state
                globalData = processedData;
                globalCounter++;
                globalList.add(processedData);
                
                return "Success: " + processedData;
            } else {
                return "Error: Failed to save data";
            }
            
        } catch (SQLException e) {
            e.printStackTrace();
            return "Error: Database error";
        } finally {
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
     * CODE QUALITY ISSUE #4: High cyclomatic complexity method
     */
    public String calculateComplexDiscount(String userType, int age, double income, int loyaltyYears, 
                                         boolean isPremium, boolean hasReferral, boolean isFirstTime, 
                                         String location, String season, boolean isHoliday, 
                                         String membershipLevel, boolean isEmployee, boolean isStudent,
                                         String paymentMethod, boolean hasCoupon, String couponCode) {
        
        double discount = 0.0;
        
        // User type discounts
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
        
        // Income-based discounts
        if (income < 30000) {
            discount += 5.0;
        } else if (income < 50000) {
            discount += 3.0;
        } else if (income < 100000) {
            discount += 1.0;
        }
        
        // Premium status
        if (isPremium) {
            discount += 10.0;
        }
        
        // Referral bonus
        if (hasReferral) {
            discount += 5.0;
        }
        
        // First-time customer
        if (isFirstTime) {
            discount += 15.0;
        }
        
        // Location-based discounts
        if (location.equals("NYC") || location.equals("LA") || location.equals("Chicago")) {
            discount += 2.0;
        } else if (location.equals("Miami") || location.equals("Seattle")) {
            discount += 3.0;
        } else if (location.equals("Austin") || location.equals("Denver")) {
            discount += 1.5;
        }
        
        // Seasonal discounts
        if (season.equals("winter")) {
            discount += 5.0;
        } else if (season.equals("summer")) {
            discount += 3.0;
        } else if (season.equals("spring")) {
            discount += 2.0;
        } else if (season.equals("fall")) {
            discount += 1.0;
        }
        
        // Holiday discounts
        if (isHoliday) {
            discount += 10.0;
        }
        
        // Membership level discounts
        if (membershipLevel.equals("gold")) {
            discount += 8.0;
        } else if (membershipLevel.equals("silver")) {
            discount += 5.0;
        } else if (membershipLevel.equals("bronze")) {
            discount += 2.0;
        }
        
        // Employee discounts
        if (isEmployee) {
            discount += 12.0;
        }
        
        // Student discounts
        if (isStudent) {
            discount += 7.0;
        }
        
        // Payment method discounts
        if (paymentMethod.equals("credit_card")) {
            discount += 2.0;
        } else if (paymentMethod.equals("debit_card")) {
            discount += 1.0;
        } else if (paymentMethod.equals("cash")) {
            discount += 0.5;
        }
        
        // Coupon discounts
        if (hasCoupon && couponCode != null && !couponCode.isEmpty()) {
            if (couponCode.equals("SAVE10")) {
                discount += 10.0;
            } else if (couponCode.equals("SAVE20")) {
                discount += 20.0;
            } else if (couponCode.equals("SAVE5")) {
                discount += 5.0;
            } else if (couponCode.startsWith("DISCOUNT")) {
                discount += 3.0;
            }
        }
        
        // Cap the discount
        if (discount > 50.0) {
            discount = 50.0;
        }
        
        return String.format("%.2f", discount);
    }
    
    /**
     * CODE QUALITY ISSUE #5: Code duplication across methods
     */
    public void validateData(String data) {
        if (data == null || data.isEmpty()) {
            System.out.println("Error: Data is required");
            return;
        }
        if (data.length() < MIN_SIZE) {
            System.out.println("Error: Data must be at least " + MIN_SIZE + " characters");
            return;
        }
        if (data.length() > MAX_LENGTH) {
            System.out.println("Error: Data must be less than " + MAX_LENGTH + " characters");
            return;
        }
        System.out.println("Data validated: " + data);
    }
    
    public void validateUserData(String userData) {
        if (userData == null || userData.isEmpty()) {
            System.out.println("Error: User data is required");
            return;
        }
        if (userData.length() < MIN_SIZE) {
            System.out.println("Error: User data must be at least " + MIN_SIZE + " characters");
            return;
        }
        if (userData.length() > MAX_LENGTH) {
            System.out.println("Error: User data must be less than " + MAX_LENGTH + " characters");
            return;
        }
        System.out.println("User data validated: " + userData);
    }
    
    public void validateOrderData(String orderData) {
        if (orderData == null || orderData.isEmpty()) {
            System.out.println("Error: Order data is required");
            return;
        }
        if (orderData.length() < MIN_SIZE) {
            System.out.println("Error: Order data must be at least " + MIN_SIZE + " characters");
            return;
        }
        if (orderData.length() > MAX_LENGTH) {
            System.out.println("Error: Order data must be less than " + MAX_LENGTH + " characters");
            return;
        }
        System.out.println("Order data validated: " + orderData);
    }
    
    public void validateProductData(String productData) {
        if (productData == null || productData.isEmpty()) {
            System.out.println("Error: Product data is required");
            return;
        }
        if (productData.length() < MIN_SIZE) {
            System.out.println("Error: Product data must be at least " + MIN_SIZE + " characters");
            return;
        }
        if (productData.length() > MAX_LENGTH) {
            System.out.println("Error: Product data must be less than " + MAX_LENGTH + " characters");
            return;
        }
        System.out.println("Product data validated: " + productData);
    }
    
    /**
     * CODE QUALITY ISSUE #6: Poor exception handling
     */
    public String processWithPoorExceptionHandling(String data) {
        try {
            // Multiple operations that can fail
            String processed = data.toUpperCase();
            int length = processed.length();
            String result = processed.substring(0, Math.min(length, 10));
            
            // Database operation
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/test", "user", "pass");
            PreparedStatement pstmt = conn.prepareStatement("INSERT INTO data (value) VALUES (?)");
            pstmt.setString(1, result);
            pstmt.executeUpdate();
            
            // File operation
            File file = new File("output.txt");
            FileWriter writer = new FileWriter(file);
            writer.write(result);
            writer.close();
            
            return result;
            
        } catch (Exception e) {
            // Generic exception handling - CODE QUALITY ISSUE
            e.printStackTrace();
            return "Error occurred";
        }
    }
    
    /**
     * CODE QUALITY ISSUE #7: Inconsistent naming conventions
     */
    public void processUserData(String userData) {
        // Inconsistent variable naming
        String user_data = userData;
        String UserData = userData;
        String userdata = userData;
        String USER_DATA = userData;
        
        // Inconsistent method naming
        process_data(user_data);
        ProcessData(UserData);
        processdata(userdata);
        PROCESS_DATA(USER_DATA);
    }
    
    private void process_data(String data) {
        System.out.println("Processing: " + data);
    }
    
    private void ProcessData(String data) {
        System.out.println("Processing: " + data);
    }
    
    private void processdata(String data) {
        System.out.println("Processing: " + data);
    }
    
    private void PROCESS_DATA(String data) {
        System.out.println("Processing: " + data);
    }
    
    /**
     * CODE QUALITY ISSUE #8: Poor separation of concerns
     */
    public String processOrder(String orderId, String customerName, String productName, 
                             double price, int quantity, String address, String phone, 
                             String email, String paymentMethod, boolean isExpress) {
        
        // Validation
        if (orderId == null || orderId.isEmpty()) {
            return "Error: Order ID required";
        }
        if (customerName == null || customerName.isEmpty()) {
            return "Error: Customer name required";
        }
        if (productName == null || productName.isEmpty()) {
            return "Error: Product name required";
        }
        if (price <= 0) {
            return "Error: Invalid price";
        }
        if (quantity <= 0) {
            return "Error: Invalid quantity";
        }
        
        // Business logic
        double total = price * quantity;
        if (isExpress) {
            total += 10.0; // Express shipping
        }
        
        // Database operations
        Connection conn = null;
        PreparedStatement pstmt = null;
        try {
            conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/test", "user", "pass");
            
            // Insert order
            String orderQuery = "INSERT INTO orders (order_id, customer_name, product_name, price, quantity, total, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())";
            pstmt = conn.prepareStatement(orderQuery);
            pstmt.setString(1, orderId);
            pstmt.setString(2, customerName);
            pstmt.setString(3, productName);
            pstmt.setDouble(4, price);
            pstmt.setInt(5, quantity);
            pstmt.setDouble(6, total);
            pstmt.executeUpdate();
            
            // Insert customer
            String customerQuery = "INSERT INTO customers (name, address, phone, email) VALUES (?, ?, ?, ?)";
            pstmt = conn.prepareStatement(customerQuery);
            pstmt.setString(1, customerName);
            pstmt.setString(2, address);
            pstmt.setString(3, phone);
            pstmt.setString(4, email);
            pstmt.executeUpdate();
            
            // Insert payment
            String paymentQuery = "INSERT INTO payments (order_id, method, amount) VALUES (?, ?, ?)";
            pstmt = conn.prepareStatement(paymentQuery);
            pstmt.setString(1, orderId);
            pstmt.setString(2, paymentMethod);
            pstmt.setDouble(3, total);
            pstmt.executeUpdate();
            
        } catch (SQLException e) {
            e.printStackTrace();
            return "Error: Database error";
        } finally {
            try {
                if (pstmt != null) pstmt.close();
                if (conn != null) conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        
        // Email notification
        sendOrderConfirmation(email, orderId, total);
        
        // Logging
        logOrderProcessed(orderId, customerName, total);
        
        // Update inventory
        updateInventory(productName, quantity);
        
        return "Order processed successfully. Total: $" + total;
    }
    
    private void sendOrderConfirmation(String email, String orderId, double total) {
        // Email sending logic
        System.out.println("Sending confirmation to " + email + " for order " + orderId);
    }
    
    private void logOrderProcessed(String orderId, String customerName, double total) {
        // Logging logic
        System.out.println("Order " + orderId + " processed for " + customerName + " with total " + total);
    }
    
    private void updateInventory(String productName, int quantity) {
        // Inventory update logic
        System.out.println("Updating inventory for " + productName + " by " + quantity);
    }
    
    private void logProcessedData(String data, int type) {
        // Logging logic
        System.out.println("Data processed: " + data + " with type: " + type);
    }
} 