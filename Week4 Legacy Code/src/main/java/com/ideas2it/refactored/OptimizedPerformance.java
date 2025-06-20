package com.ideas2it.refactored;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Logger;
import java.util.logging.Level;
import java.text.SimpleDateFormat;

/**
 * Optimized Performance Service implementing performance best practices.
 * 
 * This class demonstrates:
 * - Efficient string operations using StringBuilder
 * - Proper collection usage (HashSet for lookups)
 * - Bounded caching with eviction policies
 * - Async operations for I/O
 * - Resource management with try-with-resources
 * - Atomic operations instead of synchronization
 * - Memory leak prevention
 */
public class OptimizedPerformance {
    
    private static final Logger logger = Logger.getLogger(OptimizedPerformance.class.getName());
    
    // Performance optimizations
    private static final int MAX_CACHE_SIZE = 1000;
    private static final int MAX_MEMORY_LIST_SIZE = 1000;
    private static final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    
    // Thread-safe counters using atomic operations
    private final AtomicInteger globalCounter = new AtomicInteger(0);
    
    // Bounded cache with LRU eviction
    private final Map<String, String> lruCache = new LinkedHashMap<String, String>(MAX_CACHE_SIZE, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, String> eldest) {
            return size() > MAX_CACHE_SIZE;
        }
    };
    
    // Bounded memory list to prevent memory leaks
    private final List<String> boundedMemoryList = new ArrayList<>();
    private final Object memoryListLock = new Object();
    
    // Thread pool for async operations
    private final ExecutorService executor = Executors.newFixedThreadPool(
        Runtime.getRuntime().availableProcessors()
    );
    
    /**
     * Efficiently builds large string using StringBuilder.
     * 
     * @param items The list of items to concatenate
     * @return Comma-separated string of items
     * @throws IllegalArgumentException if items list is null
     */
    public String buildLargeString(List<String> items) {
        if (items == null || items.isEmpty()) {
            return "";
        }
        
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < items.size(); i++) {
            result.append(items.get(i));
            if (i < items.size() - 1) {
                result.append(", ");
            }
        }
        
        logger.info("Large string built efficiently: " + result.length() + " characters");
        return result.toString();
    }
    
    /**
     * Processes data efficiently without unnecessary object creation.
     * 
     * @param data The list of data to process
     * @return Processed data list
     */
    public List<String> processData(List<String> data) {
        if (data == null || data.isEmpty()) {
            return new ArrayList<>();
        }
        
        List<String> results = new ArrayList<>(data.size());
        for (String item : data) {
            String processed = item.toUpperCase().trim() + "_processed";
            results.add(processed);
        }
        
        logger.info("Data processed efficiently: " + results.size() + " items");
        return results;
    }
    
    /**
     * Efficiently finds user using HashSet for O(1) lookup.
     * 
     * @param users The set of users to search in
     * @param targetUser The user to find
     * @return true if user is found, false otherwise
     */
    public boolean findUser(Set<String> users, String targetUser) {
        if (users == null || targetUser == null) {
            return false;
        }
        
        boolean found = users.contains(targetUser);
        logger.info("User lookup performed efficiently: " + targetUser + " found: " + found);
        return found;
    }
    
    /**
     * Adds data to bounded memory list to prevent memory leaks.
     * 
     * @param data The data to add
     */
    public void addToBoundedMemoryList(String data) {
        if (data == null) {
            return;
        }
        
        synchronized (memoryListLock) {
            if (boundedMemoryList.size() >= MAX_MEMORY_LIST_SIZE) {
                boundedMemoryList.remove(0);
            }
            boundedMemoryList.add(data);
        }
        
        logger.info("Data added to bounded memory list. Size: " + boundedMemoryList.size());
    }
    
    /**
     * Increments counter using atomic operations for thread safety.
     * 
     * @return Current counter value
     */
    public int incrementCounter() {
        int newValue = globalCounter.incrementAndGet();
        logger.info("Counter incremented atomically: " + newValue);
        return newValue;
    }
    
    /**
     * Fetches data from network asynchronously to avoid blocking.
     * 
     * @param url The URL to fetch data from
     * @return CompletableFuture containing the response
     */
    public CompletableFuture<String> fetchDataFromNetworkAsync(String url) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                java.net.URL urlObj = new java.net.URL(url);
                java.net.HttpURLConnection connection = (java.net.HttpURLConnection) urlObj.openConnection();
                connection.setRequestMethod("GET");
                
                try (java.io.BufferedReader reader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(connection.getInputStream()))) {
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    return response.toString();
                } finally {
                    connection.disconnect();
                }
            } catch (Exception e) {
                logger.log(Level.SEVERE, "Error fetching data from network", e);
                throw new RuntimeException("Failed to fetch data", e);
            }
        }, executor);
    }
    
    /**
     * Sorts numbers efficiently using built-in sorting algorithm.
     * 
     * @param numbers The list of numbers to sort
     * @return Sorted list of numbers
     */
    public List<Integer> sortNumbers(List<Integer> numbers) {
        if (numbers == null || numbers.isEmpty()) {
            return new ArrayList<>();
        }
        
        List<Integer> result = new ArrayList<>(numbers);
        Collections.sort(result);
        
        logger.info("Numbers sorted efficiently: " + result.size() + " items");
        return result;
    }
    
    /**
     * Gets users from database with proper resource management.
     * 
     * @return List of usernames
     */
    public List<String> getUsersFromDatabase() {
        List<String> users = new ArrayList<>();
        
        try (java.sql.Connection conn = getDatabaseConnection();
             java.sql.Statement stmt = conn.createStatement();
             java.sql.ResultSet rs = stmt.executeQuery("SELECT username FROM users")) {
            
            while (rs.next()) {
                users.add(rs.getString("username"));
            }
            
            logger.info("Users retrieved from database: " + users.size() + " users");
            return users;
            
        } catch (java.sql.SQLException e) {
            logger.log(Level.SEVERE, "Database error retrieving users", e);
            return users;
        }
    }
    
    /**
     * Processes large data efficiently using StringBuilder.
     * 
     * @param data The data to process
     * @return Processed data string
     */
    public String processLargeData(String data) {
        if (data == null || data.isEmpty()) {
            return "";
        }
        
        StringBuilder result = new StringBuilder(data.length());
        for (int i = 0; i < data.length(); i++) {
            result.append(Character.toUpperCase(data.charAt(i)));
        }
        
        logger.info("Large data processed efficiently: " + result.length() + " characters");
        return result.toString();
    }
    
    /**
     * Gets cached data with bounded cache to prevent memory leaks.
     * 
     * @param key The cache key
     * @return Cached data or null if not found
     */
    public String getCachedData(String key) {
        if (key == null) {
            return null;
        }
        
        synchronized (lruCache) {
            if (lruCache.containsKey(key)) {
                logger.info("Cache hit for key: " + key);
                return lruCache.get(key);
            }
        }
        
        // Fetch data asynchronously and cache it
        fetchDataFromNetworkAsync("http://api.example.com/data/" + key)
            .thenAccept(data -> {
                synchronized (lruCache) {
                    lruCache.put(key, data);
                }
                logger.info("Data cached for key: " + key);
            });
        
        logger.info("Cache miss for key: " + key + ", fetching asynchronously");
        return null;
    }
    
    /**
     * Reads large file efficiently using buffered reading.
     * 
     * @param filename The filename to read
     * @return File content as string
     */
    public String readLargeFile(String filename) {
        try (java.io.BufferedReader reader = new java.io.BufferedReader(
                new java.io.FileReader(filename))) {
            
            StringBuilder content = new StringBuilder();
            char[] buffer = new char[8192]; // 8KB buffer
            int bytesRead;
            
            while ((bytesRead = reader.read(buffer)) != -1) {
                content.append(buffer, 0, bytesRead);
            }
            
            logger.info("Large file read efficiently: " + filename + " (" + content.length() + " characters)");
            return content.toString();
            
        } catch (java.io.IOException e) {
            logger.log(Level.SEVERE, "Error reading large file", e);
            return "Error reading file";
        }
    }
    
    /**
     * Formats dates efficiently by reusing SimpleDateFormat.
     * 
     * @param dates The list of dates to format
     * @return Formatted dates string
     */
    public String formatDates(List<java.util.Date> dates) {
        if (dates == null || dates.isEmpty()) {
            return "";
        }
        
        StringBuilder result = new StringBuilder();
        for (java.util.Date date : dates) {
            result.append(DATE_FORMAT.format(date)).append(", ");
        }
        
        // Remove trailing comma and space
        if (result.length() > 2) {
            result.setLength(result.length() - 2);
        }
        
        logger.info("Dates formatted efficiently: " + dates.size() + " dates");
        return result.toString();
    }
    
    /**
     * Sums integers efficiently using stream operations.
     * 
     * @param numbers The list of numbers to sum
     * @return Sum of all numbers
     */
    public int sumIntegers(List<Integer> numbers) {
        if (numbers == null || numbers.isEmpty()) {
            return 0;
        }
        
        int sum = numbers.stream().mapToInt(Integer::intValue).sum();
        logger.info("Integers summed efficiently: " + numbers.size() + " numbers = " + sum);
        return sum;
    }
    
    /**
     * Validates email efficiently using compiled regex pattern.
     * 
     * @param email The email to validate
     * @return true if email is valid, false otherwise
     */
    public boolean validateEmail(String email) {
        boolean isValid = com.ideas2it.refactored.utils.ValidationUtils.isValidEmail(email);
        logger.info("Email validated efficiently: " + email + " = " + isValid);
        return isValid;
    }
    
    /**
     * Processes data with proper exception handling.
     * 
     * @param data The data to process
     * @return Processed data string
     */
    public String processWithExceptions(String data) {
        try {
            if (data == null || data.isEmpty()) {
                return "Empty data";
            }
            
            // Process data
            String processed = data.toUpperCase().trim();
            
            // Simulate some processing time
            Thread.sleep(10);
            
            logger.info("Data processed with proper exception handling: " + processed);
            return processed;
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.log(Level.WARNING, "Processing interrupted", e);
            return "Processing interrupted";
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error processing data", e);
            return "Error processing data";
        }
    }
    
    /**
     * Creates list with pre-allocated capacity for better performance.
     * 
     * @param size The size of the list to create
     * @return List with specified size
     */
    public List<String> createListWithCapacity(int size) {
        if (size < 0) {
            throw new IllegalArgumentException("Size cannot be negative");
        }
        
        List<String> list = new ArrayList<>(size);
        logger.info("List created with capacity: " + size);
        return list;
    }
    
    /**
     * Processes array efficiently.
     * 
     * @param array The array to process
     * @return Sum of array elements
     */
    public int processArray(int[] array) {
        if (array == null || array.length == 0) {
            return 0;
        }
        
        int sum = 0;
        for (int value : array) {
            sum += value;
        }
        
        logger.info("Array processed efficiently: " + array.length + " elements = " + sum);
        return sum;
    }
    
    /**
     * Shuts down the executor service properly.
     */
    public void shutdown() {
        executor.shutdown();
        try {
            if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
        logger.info("Executor service shut down properly");
    }
    
    // Mock method for database connection
    private java.sql.Connection getDatabaseConnection() throws java.sql.SQLException {
        // In a real application, this would return a proper database connection
        throw new java.sql.SQLException("Database connection not implemented for demo");
    }
} 