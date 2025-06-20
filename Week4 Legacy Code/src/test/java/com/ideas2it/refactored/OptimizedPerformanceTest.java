package com.ideas2it.refactored;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * Unit tests for OptimizedPerformance demonstrating performance improvements.
 */
@DisplayName("OptimizedPerformance Tests")
class OptimizedPerformanceTest {

    private OptimizedPerformance optimizedPerformance;

    @BeforeEach
    void setUp() {
        optimizedPerformance = new OptimizedPerformance();
    }

    @Test
    @DisplayName("Should build large string efficiently")
    void testBuildLargeString() {
        // Arrange
        List<String> items = Arrays.asList("item1", "item2", "item3", "item4", "item5");

        // Act
        String result = optimizedPerformance.buildLargeString(items);

        // Assert
        assertEquals("item1, item2, item3, item4, item5", result);
    }

    @Test
    @DisplayName("Should handle empty list in buildLargeString")
    void testBuildLargeStringEmptyList() {
        // Act
        String result = optimizedPerformance.buildLargeString(new ArrayList<>());

        // Assert
        assertEquals("", result);
    }

    @Test
    @DisplayName("Should handle null list in buildLargeString")
    void testBuildLargeStringNullList() {
        // Act
        String result = optimizedPerformance.buildLargeString(null);

        // Assert
        assertEquals("", result);
    }

    @Test
    @DisplayName("Should process data efficiently")
    void testProcessData() {
        // Arrange
        List<String> data = Arrays.asList("hello", "world", "test");

        // Act
        List<String> result = optimizedPerformance.processData(data);

        // Assert
        assertEquals(3, result.size());
        assertEquals("HELLO_processed", result.get(0));
        assertEquals("WORLD_processed", result.get(1));
        assertEquals("TEST_processed", result.get(2));
    }

    @Test
    @DisplayName("Should handle empty data in processData")
    void testProcessDataEmpty() {
        // Act
        List<String> result = optimizedPerformance.processData(new ArrayList<>());

        // Assert
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should find user efficiently using HashSet")
    void testFindUser() {
        // Arrange
        Set<String> users = new HashSet<>(Arrays.asList("user1", "user2", "user3"));

        // Act & Assert
        assertTrue(optimizedPerformance.findUser(users, "user1"));
        assertTrue(optimizedPerformance.findUser(users, "user2"));
        assertFalse(optimizedPerformance.findUser(users, "nonexistent"));
        assertFalse(optimizedPerformance.findUser(users, null));
        assertFalse(optimizedPerformance.findUser(null, "user1"));
    }

    @Test
    @DisplayName("Should add data to bounded memory list")
    void testAddToBoundedMemoryList() {
        // Act
        optimizedPerformance.addToBoundedMemoryList("test data");

        // Assert - should not throw exception
        assertDoesNotThrow(() -> optimizedPerformance.addToBoundedMemoryList("more data"));
    }

    @Test
    @DisplayName("Should handle null data in bounded memory list")
    void testAddToBoundedMemoryListNull() {
        // Act & Assert - should not throw exception
        assertDoesNotThrow(() -> optimizedPerformance.addToBoundedMemoryList(null));
    }

    @Test
    @DisplayName("Should increment counter atomically")
    void testIncrementCounter() {
        // Act
        int first = optimizedPerformance.incrementCounter();
        int second = optimizedPerformance.incrementCounter();
        int third = optimizedPerformance.incrementCounter();

        // Assert
        assertEquals(1, first);
        assertEquals(2, second);
        assertEquals(3, third);
    }

    @Test
    @DisplayName("Should sort numbers efficiently")
    void testSortNumbers() {
        // Arrange
        List<Integer> numbers = Arrays.asList(3, 1, 4, 1, 5, 9, 2, 6);

        // Act
        List<Integer> result = optimizedPerformance.sortNumbers(numbers);

        // Assert
        assertEquals(Arrays.asList(1, 1, 2, 3, 4, 5, 6, 9), result);
    }

    @Test
    @DisplayName("Should handle empty numbers in sortNumbers")
    void testSortNumbersEmpty() {
        // Act
        List<Integer> result = optimizedPerformance.sortNumbers(new ArrayList<>());

        // Assert
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should handle null numbers in sortNumbers")
    void testSortNumbersNull() {
        // Act
        List<Integer> result = optimizedPerformance.sortNumbers(null);

        // Assert
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should process large data efficiently")
    void testProcessLargeData() {
        // Arrange
        String data = "hello world";

        // Act
        String result = optimizedPerformance.processLargeData(data);

        // Assert
        assertEquals("HELLO WORLD", result);
    }

    @Test
    @DisplayName("Should handle empty data in processLargeData")
    void testProcessLargeDataEmpty() {
        // Act
        String result = optimizedPerformance.processLargeData("");

        // Assert
        assertEquals("", result);
    }

    @Test
    @DisplayName("Should handle null data in processLargeData")
    void testProcessLargeDataNull() {
        // Act
        String result = optimizedPerformance.processLargeData(null);

        // Assert
        assertEquals("", result);
    }

    @Test
    @DisplayName("Should get cached data")
    void testGetCachedData() {
        // Act
        String result = optimizedPerformance.getCachedData("test-key");

        // Assert - cache miss returns null, but method should not throw exception
        assertNull(result); // Cache miss returns null
    }

    @Test
    @DisplayName("Should format dates efficiently")
    void testFormatDates() {
        // Arrange
        List<Date> dates = Arrays.asList(
            new Date(1000000000000L), // 2001-09-09
            new Date(1100000000000L)  // 2004-11-10
        );

        // Act
        String result = optimizedPerformance.formatDates(dates);

        // Assert
        assertNotNull(result);
        assertTrue(result.contains("2001"));
        assertTrue(result.contains("2004"));
    }

    @Test
    @DisplayName("Should handle empty dates in formatDates")
    void testFormatDatesEmpty() {
        // Act
        String result = optimizedPerformance.formatDates(new ArrayList<>());

        // Assert
        assertEquals("", result);
    }

    @Test
    @DisplayName("Should sum integers efficiently")
    void testSumIntegers() {
        // Arrange
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

        // Act
        int result = optimizedPerformance.sumIntegers(numbers);

        // Assert
        assertEquals(15, result);
    }

    @Test
    @DisplayName("Should handle empty numbers in sumIntegers")
    void testSumIntegersEmpty() {
        // Act
        int result = optimizedPerformance.sumIntegers(new ArrayList<>());

        // Assert
        assertEquals(0, result);
    }

    @Test
    @DisplayName("Should handle null numbers in sumIntegers")
    void testSumIntegersNull() {
        // Act
        int result = optimizedPerformance.sumIntegers(null);

        // Assert
        assertEquals(0, result);
    }

    @Test
    @DisplayName("Should validate email efficiently")
    void testValidateEmail() {
        // Valid emails
        assertTrue(optimizedPerformance.validateEmail("test@example.com"));
        assertTrue(optimizedPerformance.validateEmail("user.name@domain.co.uk"));
        
        // Invalid emails
        assertFalse(optimizedPerformance.validateEmail("invalid-email"));
        assertFalse(optimizedPerformance.validateEmail("test@"));
        assertFalse(optimizedPerformance.validateEmail("@example.com"));
    }

    @Test
    @DisplayName("Should process data with exceptions")
    void testProcessWithExceptions() {
        // Act
        String result = optimizedPerformance.processWithExceptions("test data");

        // Assert
        assertEquals("TEST DATA", result);
    }

    @Test
    @DisplayName("Should handle empty data in processWithExceptions")
    void testProcessWithExceptionsEmpty() {
        // Act
        String result = optimizedPerformance.processWithExceptions("");

        // Assert
        assertEquals("Empty data", result);
    }

    @Test
    @DisplayName("Should handle null data in processWithExceptions")
    void testProcessWithExceptionsNull() {
        // Act
        String result = optimizedPerformance.processWithExceptions(null);

        // Assert
        assertEquals("Empty data", result);
    }

    @Test
    @DisplayName("Should create list with capacity")
    void testCreateListWithCapacity() {
        // Act
        List<String> result = optimizedPerformance.createListWithCapacity(10);

        // Assert
        assertNotNull(result);
        assertEquals(0, result.size());
    }

    @Test
    @DisplayName("Should throw exception for negative capacity")
    void testCreateListWithNegativeCapacity() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            optimizedPerformance.createListWithCapacity(-1);
        });
    }

    @Test
    @DisplayName("Should process array efficiently")
    void testProcessArray() {
        // Arrange
        int[] array = {1, 2, 3, 4, 5};

        // Act
        int result = optimizedPerformance.processArray(array);

        // Assert
        assertEquals(15, result);
    }

    @Test
    @DisplayName("Should handle empty array in processArray")
    void testProcessArrayEmpty() {
        // Act
        int result = optimizedPerformance.processArray(new int[0]);

        // Assert
        assertEquals(0, result);
    }

    @Test
    @DisplayName("Should handle null array in processArray")
    void testProcessArrayNull() {
        // Act
        int result = optimizedPerformance.processArray(null);

        // Assert
        assertEquals(0, result);
    }

    @Test
    @DisplayName("Should shutdown executor service properly")
    void testShutdown() {
        // Act & Assert - should not throw exception
        assertDoesNotThrow(() -> optimizedPerformance.shutdown());
    }
} 