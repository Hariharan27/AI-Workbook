package com.ideas2it;

import java.io.*;
import java.net.*;
import java.sql.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

/**
 * LEGACY CODE - Security Vulnerabilities for Week 4 Analysis
 * 
 * This class contains intentional security vulnerabilities:
 * - SQL Injection
 * - XSS vulnerabilities
 * - Path traversal
 * - Command injection
 * - Hardcoded credentials
 * - Unsafe deserialization
 * - Weak encryption
 * - Information disclosure
 */
public class SecurityVulnerabilities {
    
    // SECURITY ISSUE #1: Hardcoded credentials
    private static final String DATABASE_URL = "jdbc:mysql://localhost:3306/production_db";
    private static final String DATABASE_USER = "admin";
    private static final String DATABASE_PASSWORD = "super_secret_password_123";
    private static final String API_KEY = "sk-1234567890abcdef1234567890abcdef";
    private static final String ENCRYPTION_KEY = "mysecretkey123456";
    
    // SECURITY ISSUE #2: Weak encryption key
    private static final String WEAK_KEY = "1234567890123456"; // 16 bytes but predictable
    
    /**
     * SECURITY ISSUE #3: SQL Injection vulnerable method
     */
    public List<String> getUserData(String username) {
        List<String> results = new ArrayList<>();
        Connection conn = null;
        Statement stmt = null;
        ResultSet rs = null;
        
        try {
            conn = DriverManager.getConnection(DATABASE_URL, DATABASE_USER, DATABASE_PASSWORD);
            
            // VULNERABLE: Direct string concatenation
            String query = "SELECT * FROM users WHERE username = '" + username + "'";
            stmt = conn.createStatement();
            rs = stmt.executeQuery(query);
            
            while (rs.next()) {
                results.add(rs.getString("email"));
                results.add(rs.getString("password")); // SECURITY ISSUE #4: Exposing passwords
            }
            
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            try {
                if (rs != null) rs.close();
                if (stmt != null) stmt.close();
                if (conn != null) conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        return results;
    }
    
    /**
     * SECURITY ISSUE #5: XSS vulnerable method
     */
    public String generateUserProfile(String username, String bio) {
        // VULNERABLE: Direct HTML injection
        String html = "<div class='user-profile'>";
        html += "<h1>Welcome " + username + "</h1>";
        html += "<p>Bio: " + bio + "</p>";
        html += "<script>alert('Hello " + username + "');</script>";
        html += "</div>";
        return html;
    }
    
    /**
     * SECURITY ISSUE #6: Path traversal vulnerable method
     */
    public String readFile(String filename) {
        try {
            // VULNERABLE: No path validation
            File file = new File("/var/www/uploads/" + filename);
            BufferedReader reader = new BufferedReader(new FileReader(file));
            StringBuilder content = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line).append("\n");
            }
            reader.close();
            return content.toString();
        } catch (IOException e) {
            e.printStackTrace();
            return "Error reading file";
        }
    }
    
    /**
     * SECURITY ISSUE #7: Command injection vulnerable method
     */
    public String executeSystemCommand(String command) {
        try {
            // VULNERABLE: Direct command execution
            Process process = Runtime.getRuntime().exec(command);
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
            reader.close();
            return output.toString();
        } catch (IOException e) {
            e.printStackTrace();
            return "Error executing command";
        }
    }
    
    /**
     * SECURITY ISSUE #8: Unsafe deserialization
     */
    public Object deserializeData(byte[] data) {
        try {
            // VULNERABLE: Unsafe deserialization
            ByteArrayInputStream bis = new ByteArrayInputStream(data);
            ObjectInputStream ois = new ObjectInputStream(bis);
            Object obj = ois.readObject();
            ois.close();
            return obj;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * SECURITY ISSUE #9: Weak password hashing
     */
    public String hashPassword(String password) {
        try {
            // VULNERABLE: Using MD5 (broken)
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(password.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * SECURITY ISSUE #10: Weak encryption
     */
    public String encryptData(String data) {
        try {
            // VULNERABLE: Using weak encryption algorithm and key
            SecretKeySpec secretKey = new SecretKeySpec(WEAK_KEY.getBytes(), "AES");
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding"); // ECB is insecure
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] encrypted = cipher.doFinal(data.getBytes());
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * SECURITY ISSUE #11: Insecure random number generation
     */
    public String generateToken() {
        // VULNERABLE: Using predictable Random instead of SecureRandom
        Random random = new Random();
        StringBuilder token = new StringBuilder();
        for (int i = 0; i < 32; i++) {
            token.append(random.nextInt(10));
        }
        return token.toString();
    }
    
    /**
     * SECURITY ISSUE #12: Information disclosure
     */
    public String getSystemInfo() {
        StringBuilder info = new StringBuilder();
        info.append("Java Version: ").append(System.getProperty("java.version")).append("\n");
        info.append("OS Name: ").append(System.getProperty("os.name")).append("\n");
        info.append("User Home: ").append(System.getProperty("user.home")).append("\n");
        info.append("Database URL: ").append(DATABASE_URL).append("\n");
        info.append("API Key: ").append(API_KEY).append("\n");
        return info.toString();
    }
    
    /**
     * SECURITY ISSUE #13: Input validation bypass
     */
    public boolean validateEmail(String email) {
        // VULNERABLE: Weak email validation
        if (email == null || email.isEmpty()) {
            return false;
        }
        // Only checks for @ symbol, easily bypassed
        return email.contains("@");
    }
    
    /**
     * SECURITY ISSUE #14: Session fixation
     */
    public String createSession(String username) {
        // VULNERABLE: Predictable session ID
        String sessionId = username + "_" + System.currentTimeMillis();
        return sessionId;
    }
    
    /**
     * SECURITY ISSUE #15: Insecure direct object reference
     */
    public String getUserById(int userId) {
        // VULNERABLE: No authorization check
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        
        try {
            conn = DriverManager.getConnection(DATABASE_URL, DATABASE_USER, DATABASE_PASSWORD);
            String query = "SELECT * FROM users WHERE id = ?";
            pstmt = conn.prepareStatement(query);
            pstmt.setInt(1, userId);
            rs = pstmt.executeQuery();
            
            if (rs.next()) {
                return rs.getString("username") + ":" + rs.getString("email");
            }
            
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            try {
                if (rs != null) rs.close();
                if (pstmt != null) pstmt.close();
                if (conn != null) conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        return null;
    }
    
    /**
     * SECURITY ISSUE #16: Cross-site request forgery (CSRF) vulnerable
     */
    public boolean processPayment(String amount, String accountNumber) {
        // VULNERABLE: No CSRF token validation
        try {
            Connection conn = DriverManager.getConnection(DATABASE_URL, DATABASE_USER, DATABASE_PASSWORD);
            String query = "INSERT INTO payments (amount, account_number, timestamp) VALUES (?, ?, NOW())";
            PreparedStatement pstmt = conn.prepareStatement(query);
            pstmt.setString(1, amount);
            pstmt.setString(2, accountNumber);
            int result = pstmt.executeUpdate();
            pstmt.close();
            conn.close();
            return result > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * SECURITY ISSUE #17: Insecure file upload
     */
    public boolean uploadFile(byte[] fileData, String filename) {
        try {
            // VULNERABLE: No file type validation
            File file = new File("/var/www/uploads/" + filename);
            FileOutputStream fos = new FileOutputStream(file);
            fos.write(fileData);
            fos.close();
            return true;
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * SECURITY ISSUE #18: Insecure cookie handling
     */
    public String createSecureCookie(String username) {
        // VULNERABLE: No secure flags, httpOnly, or proper expiration
        String cookieValue = "user=" + username + "; expires=Thu, 18 Dec 2024 12:00:00 UTC";
        return cookieValue;
    }
    
    /**
     * SECURITY ISSUE #19: Buffer overflow potential
     */
    public String processLargeData(String data) {
        // VULNERABLE: No size limits
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < data.length(); i++) {
            result.append(data.charAt(i));
        }
        return result.toString();
    }
    
    /**
     * SECURITY ISSUE #20: Race condition
     */
    private AtomicInteger counter = new AtomicInteger(0);
    
    public int incrementCounter() {
        // VULNERABLE: Race condition in multi-threaded environment
        int current = counter.get();
        counter.set(current + 1);
        return counter.get();
    }
} 