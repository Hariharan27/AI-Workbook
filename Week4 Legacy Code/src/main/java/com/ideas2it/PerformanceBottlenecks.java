package com.ideas2it;

import java.util.*;
import java.io.*;
import java.net.*;
import java.sql.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.text.SimpleDateFormat;

/**
 * LEGACY CODE - Performance Bottlenecks for Week 4 Analysis
 * 
 * This class contains intentional performance issues:
 * - Inefficient string concatenation
 * - Memory leaks
 * - Poor collection usage
 * - Blocking I/O operations
 * - Resource leaks
 * - Inefficient algorithms
 * - Excessive synchronization
 * - Poor caching strategies
 */
public class PerformanceBottlenecks {
    
    // PERFORMANCE ISSUE #1: Memory leak - static list that grows indefinitely
    private static final List<String> memoryLeakList = new ArrayList<>();
    
    // PERFORMANCE ISSUE #2: Inefficient synchronization
    private static final Object globalLock = new Object();
    private static int globalCounter = 0;
    
    // PERFORMANCE ISSUE #3: Poor caching strategy
    private Map<String, String> cache = new HashMap<>();
    
    // PERFORMANCE ISSUE #4: Thread pool exhaustion
    private ExecutorService executor = Executors.newFixedThreadPool(1); // Too small thread pool
    
    /**
     * PERFORMANCE ISSUE #5: Inefficient string concatenation in loops
     */
    public String buildLargeString(List<String> items) {
        String result = "";
        for (String item : items) {
            // VULNERABLE: Creates new String object in each iteration
            result += item + ", ";
        }
        return result;
    }
    
    /**
     * PERFORMANCE ISSUE #6: Unnecessary object creation in loops
     */
    public List<String> processData(List<String> data) {
        List<String> results = new ArrayList<>();
        for (String item : data) {
            // VULNERABLE: Creates new objects unnecessarily
            String processed = new String(item.toUpperCase());
            String trimmed = new String(processed.trim());
            String finalResult = new String(trimmed + "_processed");
            results.add(finalResult);
        }
        return results;
    }
    
    /**
     * PERFORMANCE ISSUE #7: Poor collection usage - using ArrayList for frequent lookups
     */
    public boolean findUser(List<String> users, String targetUser) {
        // VULNERABLE: O(n) lookup instead of O(1) with HashSet
        for (String user : users) {
            if (user.equals(targetUser)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * PERFORMANCE ISSUE #8: Memory leak - adding to static list without bounds
     */
    public void addToMemoryLeak(String data) {
        // VULNERABLE: Static list grows indefinitely
        memoryLeakList.add(data);
        System.out.println("Added to memory leak list. Size: " + memoryLeakList.size());
    }
    
    /**
     * PERFORMANCE ISSUE #9: Excessive synchronization
     */
    public int incrementCounter() {
        synchronized (globalLock) {
            // VULNERABLE: Synchronizing entire method when only increment is needed
            globalCounter++;
            return globalCounter;
        }
    }
    
    /**
     * PERFORMANCE ISSUE #10: Blocking I/O in main thread
     */
    public String fetchDataFromNetwork(String url) {
        try {
            // VULNERABLE: Blocking I/O operation
            URL urlObj = new URL(url);
            HttpURLConnection connection = (HttpURLConnection) urlObj.openConnection();
            connection.setRequestMethod("GET");
            
            BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();
            connection.disconnect();
            
            return response.toString();
        } catch (IOException e) {
            e.printStackTrace();
            return "Error";
        }
    }
    
    /**
     * PERFORMANCE ISSUE #11: Inefficient algorithm - O(n²) instead of O(n log n)
     */
    public List<Integer> sortNumbers(List<Integer> numbers) {
        // VULNERABLE: Bubble sort instead of efficient sorting
        List<Integer> result = new ArrayList<>(numbers);
        for (int i = 0; i < result.size(); i++) {
            for (int j = 0; j < result.size() - 1; j++) {
                if (result.get(j) > result.get(j + 1)) {
                    int temp = result.get(j);
                    result.set(j, result.get(j + 1));
                    result.set(j + 1, temp);
                }
            }
        }
        return result;
    }
    
    /**
     * PERFORMANCE ISSUE #12: Resource leak - not closing database connections
     */
    public List<String> getUsersFromDatabase() {
        List<String> users = new ArrayList<>();
        Connection conn = null;
        Statement stmt = null;
        ResultSet rs = null;
        
        try {
            conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/test", "user", "pass");
            stmt = conn.createStatement();
            rs = stmt.executeQuery("SELECT username FROM users");
            
            while (rs.next()) {
                users.add(rs.getString("username"));
            }
            
            // VULNERABLE: Not closing resources in finally block
            return users;
            
        } catch (SQLException e) {
            e.printStackTrace();
            return users;
        }
    }
    
    /**
     * PERFORMANCE ISSUE #13: Excessive garbage collection due to temporary objects
     */
    public String processLargeData(String data) {
        String result = "";
        for (int i = 0; i < data.length(); i++) {
            // VULNERABLE: Creates many temporary String objects
            String temp = data.substring(i, i + 1);
            result += temp.toUpperCase();
        }
        return result;
    }
    
    /**
     * PERFORMANCE ISSUE #14: Poor caching strategy
     */
    public String getCachedData(String key) {
        // VULNERABLE: Cache grows indefinitely without eviction
        if (cache.containsKey(key)) {
            return cache.get(key);
        }
        
        String data = fetchDataFromNetwork("http://api.example.com/data/" + key);
        cache.put(key, data);
        return data;
    }
    
    /**
     * PERFORMANCE ISSUE #15: Inefficient file reading
     */
    public String readLargeFile(String filename) {
        try {
            // VULNERABLE: Reading entire file into memory
            File file = new File(filename);
            byte[] fileContent = new byte[(int) file.length()];
            FileInputStream fis = new FileInputStream(file);
            fis.read(fileContent);
            fis.close();
            return new String(fileContent);
        } catch (IOException e) {
            e.printStackTrace();
            return "";
        }
    }
    
    /**
     * PERFORMANCE ISSUE #16: Thread pool exhaustion
     */
    public void processTasks(List<Runnable> tasks) {
        // VULNERABLE: Small thread pool with many tasks
        for (Runnable task : tasks) {
            executor.submit(task);
        }
    }
    
    /**
     * PERFORMANCE ISSUE #17: Inefficient date/time operations
     */
    public String formatDates(List<java.util.Date> dates) {
        StringBuilder result = new StringBuilder();
        for (java.util.Date date : dates) {
            // VULNERABLE: Creating new SimpleDateFormat for each date
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            result.append(sdf.format(date)).append("\n");
        }
        return result.toString();
    }
    
    /**
     * PERFORMANCE ISSUE #18: Unnecessary boxing/unboxing
     */
    public int sumIntegers(List<Integer> numbers) {
        int sum = 0;
        for (Integer number : numbers) {
            // VULNERABLE: Unnecessary boxing/unboxing
            sum += number.intValue();
        }
        return sum;
    }
    
    /**
     * PERFORMANCE ISSUE #19: Inefficient regex usage
     */
    public boolean validateEmail(String email) {
        // VULNERABLE: Compiling regex pattern repeatedly
        String pattern = "^[A-Za-z0-9+_.-]+@(.+)$";
        return email.matches(pattern);
    }
    
    /**
     * PERFORMANCE ISSUE #20: Poor exception handling affecting performance
     */
    public String processWithExceptions(String data) {
        try {
            // VULNERABLE: Exception handling in performance-critical path
            if (data == null) {
                throw new IllegalArgumentException("Data cannot be null");
            }
            if (data.isEmpty()) {
                throw new IllegalArgumentException("Data cannot be empty");
            }
            if (data.length() < 5) {
                throw new IllegalArgumentException("Data too short");
            }
            return data.toUpperCase();
        } catch (IllegalArgumentException e) {
            // VULNERABLE: Expensive exception handling
            e.printStackTrace();
            return "Error: " + e.getMessage();
        }
    }
    
    /**
     * PERFORMANCE ISSUE #21: Inefficient reflection usage
     */
    public Object createInstance(String className) {
        try {
            // VULNERABLE: Using reflection for simple object creation
            Class<?> clazz = Class.forName(className);
            return clazz.newInstance();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * PERFORMANCE ISSUE #22: Memory-intensive operations without bounds
     */
    public List<String> generateLargeList(int size) {
        List<String> list = new ArrayList<>();
        // VULNERABLE: No bounds checking
        for (int i = 0; i < size; i++) {
            list.add("Item " + i + " with some additional data to consume memory");
        }
        return list;
    }
    
    /**
     * PERFORMANCE ISSUE #23: Inefficient string operations
     */
    public String concatenateStrings(List<String> strings) {
        String result = "";
        for (String str : strings) {
            // VULNERABLE: Inefficient string concatenation
            result = result + str + "\n";
        }
        return result;
    }
    
    /**
     * PERFORMANCE ISSUE #24: Poor collection initialization
     */
    public List<String> createListWithCapacity(int size) {
        // VULNERABLE: Not specifying initial capacity
        List<String> list = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            list.add("Item " + i);
        }
        return list;
    }
    
    /**
     * PERFORMANCE ISSUE #25: Inefficient iteration
     */
    public void processArray(int[] array) {
        // VULNERABLE: Using iterator instead of direct access
        List<Integer> list = new ArrayList<>();
        for (int i = 0; i < array.length; i++) {
            list.add(array[i]);
        }
        
        for (Integer value : list) {
            System.out.println(value);
        }
    }
} 