# Phase 2A Manual API Test Results: User Management & Authentication

This document records all manual API tests performed for Phase 2A (User Management & Authentication) of IdeatorPechu.

---

## 1. Health Check

### Request
```
GET /health
```

### Response
```
{
  "success": true,
  "message": "IdeatorPechu API is running",
  "timestamp": "<timestamp>",
  "environment": "development",
  "version": "1.0.0"
}
```

---

## 2. User Registration

### Request
```
POST /api/v1/auth/register
Content-Type: application/json
{
  "username": "testuser1",
  "email": "test1@example.com",
  "password": "TestPassword123!",
  "firstName": "Test",
  "lastName": "User"
}
```

### Response (Success)
```
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": { ... }
  },
  "message": "User registered successfully. Please check your email to verify your account."
}
```

### Response (Duplicate/Rate Limit)
```
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many authentication attempts, please try again later."
  }
}
```

---

## 3. User Login

### Request
```
POST /api/v1/auth/login
Content-Type: application/json
{
  "email": "test1@example.com",
  "password": "TestPassword123!"
}
```

### Response (Success)
```
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": { ... }
  },
  "message": "Login successful"
}
```

---

## 4. Forgot Password

### Request
```
POST /api/v1/auth/forgot-password
Content-Type: application/json
{
  "email": "test1@example.com"
}
```

### Response (Email Send Error)
```
{
  "success": false,
  "error": {
    "code": "EMAIL_SEND_ERROR",
    "message": "Failed to send password reset email"
  }
}
```

---

## 5. Logout

### Request
```
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

### Response
```
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 6. Refresh Token

### Request
```
POST /api/v1/auth/refresh-token
Content-Type: application/json
{
  "refreshToken": "<refresh_token>"
}
```

### Response (Invalid Token)
```
{
  "success": false,
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Invalid refresh token"
  }
}
```

---

## 7. Reset Password

### Request
```
POST /api/v1/auth/reset-password
Content-Type: application/json
{
  "token": "dummy-token",
  "newPassword": "NewPassword123!"
}
```

### Response (Invalid Token)
```
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired reset token"
  }
}
```

---

## 8. Verify Email

### Request
```
GET /api/v1/auth/verify-email?token=dummy-token
```

### Response (Invalid Token)
```
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired verification token"
  }
}
```

---

## Notes
- All tests were performed manually using curl.
- Email and password reset flows require a working email service to fully test.
- User profile endpoints are not yet implemented in Phase 2A. 