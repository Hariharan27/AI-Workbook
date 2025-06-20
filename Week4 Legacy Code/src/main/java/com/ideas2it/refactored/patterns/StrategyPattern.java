package com.ideas2it.refactored.patterns;

import com.ideas2it.refactored.utils.ParameterObjects;

/**
 * Strategy Pattern implementation for discount calculations.
 * Replaces the high cyclomatic complexity calculateUserDiscount method.
 */
public class StrategyPattern {

    /**
     * Strategy interface for discount calculations.
     */
    public interface DiscountStrategy {
        double calculateDiscount(ParameterObjects.DiscountContext context);
    }

    /**
     * Student discount strategy implementation.
     */
    public static class StudentDiscountStrategy implements DiscountStrategy {
        @Override
        public double calculateDiscount(ParameterObjects.DiscountContext context) {
            double discount = 0.0;
            
            if (context.getAge() < 18) {
                discount += 10.0;
            } else if (context.getAge() <= 25) {
                discount += 15.0;
            } else {
                discount += 5.0;
            }
            
            discount += applyIncomeBasedDiscount(context.getIncome());
            discount += applySeasonalDiscount(context.getSeason());
            discount += applyHolidayDiscount(context.isHoliday());
            discount += applyFirstTimeDiscount(context.isFirstTime());
            
            return Math.min(discount, 50.0);
        }
    }

    /**
     * Senior discount strategy implementation.
     */
    public static class SeniorDiscountStrategy implements DiscountStrategy {
        @Override
        public double calculateDiscount(ParameterObjects.DiscountContext context) {
            double discount = 0.0;
            
            if (context.getAge() >= 65) {
                discount += 20.0;
            } else if (context.getAge() >= 60) {
                discount += 15.0;
            } else {
                discount += 10.0;
            }
            
            discount += applyIncomeBasedDiscount(context.getIncome());
            discount += applySeasonalDiscount(context.getSeason());
            discount += applyHolidayDiscount(context.isHoliday());
            
            return Math.min(discount, 50.0);
        }
    }

    /**
     * Customer discount strategy implementation.
     */
    public static class CustomerDiscountStrategy implements DiscountStrategy {
        @Override
        public double calculateDiscount(ParameterObjects.DiscountContext context) {
            double discount = 0.0;
            
            if (context.getLoyaltyYears() >= 5) {
                discount += 20.0;
            } else if (context.getLoyaltyYears() >= 3) {
                discount += 15.0;
            } else if (context.getLoyaltyYears() >= 1) {
                discount += 10.0;
            } else {
                discount += 5.0;
            }
            
            discount += applyIncomeBasedDiscount(context.getIncome());
            discount += applySeasonalDiscount(context.getSeason());
            discount += applyHolidayDiscount(context.isHoliday());
            discount += applyReferralDiscount(context.hasReferral());
            discount += applyFirstTimeDiscount(context.isFirstTime());
            discount += applyPremiumDiscount(context.isPremium());
            
            return Math.min(discount, 50.0);
        }
    }

    /**
     * Factory for creating discount strategies based on user type.
     */
    public static class DiscountStrategyFactory {
        /**
         * Gets the appropriate discount strategy for a user type.
         * @param userType The type of user
         * @return Discount strategy implementation
         * @throws IllegalArgumentException if user type is not supported
         */
        public static DiscountStrategy getStrategy(ParameterObjects.UserType userType) {
            if (userType == null) {
                throw new IllegalArgumentException("User type cannot be null");
            }
            
            return switch (userType) {
                case STUDENT -> new StudentDiscountStrategy();
                case SENIOR -> new SeniorDiscountStrategy();
                case VETERAN -> new CustomerDiscountStrategy(); // Simplified for demo
                case EMPLOYEE -> new CustomerDiscountStrategy(); // Simplified for demo
                case CUSTOMER -> new CustomerDiscountStrategy();
                default -> throw new IllegalArgumentException("Unsupported user type: " + userType);
            };
        }
    }

    /**
     * Discount calculation service using strategy pattern.
     */
    public static class DiscountCalculationService {
        /**
         * Calculates user discount using strategy pattern.
         * 
         * @param context The discount calculation context
         * @return Calculated discount percentage
         */
        public double calculateUserDiscount(ParameterObjects.DiscountContext context) {
            if (context == null) {
                throw new IllegalArgumentException("Discount context cannot be null");
            }
            
            DiscountStrategy strategy = DiscountStrategyFactory.getStrategy(context.getUserType());
            return strategy.calculateDiscount(context);
        }
    }

    // Helper methods
    private static double applyIncomeBasedDiscount(double income) {
        if (income < 30000) return 5.0;
        if (income < 50000) return 3.0;
        if (income < 100000) return 1.0;
        return 0.0;
    }

    private static double applySeasonalDiscount(String season) {
        if (season == null) return 0.0;
        return switch (season.toLowerCase()) {
            case "winter" -> 5.0;
            case "summer" -> 3.0;
            case "spring", "autumn" -> 2.0;
            default -> 0.0;
        };
    }

    private static double applyHolidayDiscount(boolean isHoliday) {
        return isHoliday ? 10.0 : 0.0;
    }

    private static double applyReferralDiscount(boolean hasReferral) {
        return hasReferral ? 5.0 : 0.0;
    }

    private static double applyFirstTimeDiscount(boolean isFirstTime) {
        return isFirstTime ? 15.0 : 0.0;
    }

    private static double applyPremiumDiscount(boolean isPremium) {
        return isPremium ? 10.0 : 0.0;
    }
} 