# Challenge 4: Security Vulnerabilities

## Overview

This challenge demonstrates common security vulnerabilities found in web applications, specifically in the context of a shopping cart application. A new "User Profile" page has been added with intentional security flaws for educational purposes.

## 🚨 Intentional Vulnerabilities Added

### 1. **Cross-Site Scripting (XSS)**

**Location**: `src/components/UserProfile/UserProfile.tsx`
**Vulnerability**: Direct `dangerouslySetInnerHTML` usage

```typescript
// VULNERABLE: Direct innerHTML usage
const renderUserBio = (bio: string) => {
  return { __html: bio }; // VULNERABLE: Direct innerHTML
};

// Used in JSX:
<div dangerouslySetInnerHTML={renderUserBio(userData.bio)} />;
```

**Risk**: Allows attackers to inject malicious scripts that execute in users' browsers
**Exploit**: User can enter `<script>alert('XSS')</script>` in the bio field

### 2. **SQL Injection Simulation**

**Location**: `src/components/UserProfile/UserProfile.tsx`
**Vulnerability**: Direct string concatenation in queries

```typescript
// VULNERABLE: Direct string concatenation (SQL Injection simulation)
const searchUsers = (query: string) => {
  const sqlQuery = `SELECT * FROM users WHERE name LIKE '%${query}%' OR email LIKE '%${query}%'`;
  console.log('Executing query:', sqlQuery);
  // ...
};
```

**Risk**: Allows attackers to manipulate database queries
**Exploit**: Input like `'; DROP TABLE users; --` could potentially drop tables

### 3. **Sensitive Data Exposure**

**Location**: `src/components/UserProfile/UserProfile.tsx`
**Vulnerabilities**:

- Logging sensitive data to console
- Storing credit card data in plain text
- Exposing credentials in debug information

```typescript
// VULNERABLE: Logging sensitive data
console.log('Saving user data:', JSON.stringify(userData));

// VULNERABLE: Storing in localStorage without encryption
localStorage.setItem('userData', JSON.stringify(userData));
localStorage.setItem('creditCard', userData.creditCard); // VULNERABLE: Plain text storage

// VULNERABLE: Hardcoded credentials exposed
const adminCredentials = {
  username: 'admin',
  password: 'admin123',
  apiKey: 'sk-1234567890abcdef',
  databaseUrl: 'mongodb://admin:password@localhost:27017',
};
```

### 4. **No Input Validation**

**Location**: `src/components/UserProfile/UserProfile.tsx`
**Vulnerability**: Accepting any input without validation

```typescript
// VULNERABLE: No validation
const handleInputChange = (field: string, value: string) => {
  setUserData((prev) => ({
    ...prev,
    [field]: value, // VULNERABLE: No validation
  }));
};
```

**Risk**: Allows malicious input that could cause various attacks
**Exploit**: Extremely long inputs, special characters, or script tags

### 5. **Insecure Direct Object References (IDOR)**

**Location**: `src/components/UserProfile/UserProfile.tsx`
**Vulnerability**: No authorization checks when accessing user data

```typescript
// VULNERABLE: No authorization check
const getUserById = (id: string) => {
  const user = { id, name: 'User ' + id, email: 'user' + id + '@example.com' };
  console.log('Accessing user data:', user);
  return user;
};
```

**Risk**: Users can access other users' data by changing IDs
**Exploit**: Change user ID in URL or form to access other accounts

### 6. **Hardcoded Credentials**

**Location**: `src/components/UserProfile/UserProfile.tsx`
**Vulnerability**: Credentials stored in source code

```typescript
// VULNERABLE: Hardcoded credentials (DO NOT DO THIS IN REAL APPS!)
const adminCredentials = {
  username: 'admin',
  password: 'admin123',
  apiKey: 'sk-1234567890abcdef',
  databaseUrl: 'mongodb://admin:password@localhost:27017',
};
```

**Risk**: Credentials are visible to anyone with access to source code
**Exploit**: Credentials can be extracted from client-side code

## 🔧 How to Access the Vulnerable Page

1. Start the application: `npm start`
2. Click the "🔓 User Profile (Vulnerable)" button in the navigation
3. The page contains multiple intentional security flaws for demonstration

## 🧪 Testing the Vulnerabilities

### XSS Test

1. Go to the User Profile page
2. Click "Edit Profile"
3. In the Bio field, enter: `<script>alert('XSS Attack!')</script>`
4. Save the profile
5. The script will execute when viewing the bio preview

### SQL Injection Test

1. In the "User Search" section
2. Enter: `'; DROP TABLE users; --`
3. Click Search
4. Check console to see the vulnerable query

### Sensitive Data Exposure

1. Fill in the form with any data
2. Save the profile
3. Check browser console for logged sensitive data
4. Check browser's Application tab > Local Storage to see plain text credit card

### IDOR Test

1. In the search results, click "View Details" on any user
2. Check console to see user data being accessed without authorization

## 🛡️ Security Best Practices (What Should Be Done)

### 1. **Prevent XSS**

```typescript
// SAFE: Use React's built-in escaping
<div>{userData.bio}</div>;

// Or sanitize HTML if needed
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userData.bio) }} />;
```

### 2. **Prevent SQL Injection**

```typescript
// SAFE: Use parameterized queries
const searchUsers = async (query: string) => {
  const sqlQuery = 'SELECT * FROM users WHERE name LIKE ? OR email LIKE ?';
  const params = [`%${query}%`, `%${query}%`];
  // Use database library with parameterized queries
};
```

### 3. **Protect Sensitive Data**

```typescript
// SAFE: Never log sensitive data
const saveUserData = () => {
  console.log('Saving user data...'); // Don't log the actual data

  // Encrypt sensitive data before storage
  const encryptedData = encrypt(userData);
  localStorage.setItem('userData', encryptedData);

  // Never store credit cards in localStorage
  // Use secure payment processors instead
};
```

### 4. **Input Validation**

```typescript
// SAFE: Validate all inputs
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const handleInputChange = (field: string, value: string) => {
  // Validate based on field type
  if (field === 'email' && !validateEmail(value)) {
    setError('Invalid email format');
    return;
  }

  setUserData((prev) => ({
    ...prev,
    [field]: value,
  }));
};
```

### 5. **Authorization Checks**

```typescript
// SAFE: Always check authorization
const getUserById = async (id: string) => {
  // Check if current user has permission to access this data
  if (!isAuthorized(currentUser, id)) {
    throw new Error('Unauthorized access');
  }

  const user = await fetchUserFromDatabase(id);
  return user;
};
```

### 6. **Secure Credential Management**

```typescript
// SAFE: Use environment variables and secure storage
// Never hardcode credentials in source code
const config = {
  apiKey: process.env.REACT_APP_API_KEY,
  databaseUrl: process.env.REACT_APP_DATABASE_URL,
};
```

## 📚 Additional Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Content Security Policy (CSP)**: Implement CSP headers
3. **Rate Limiting**: Prevent brute force attacks
4. **Session Management**: Secure session handling
5. **Error Handling**: Don't expose sensitive information in error messages
6. **Dependencies**: Regularly update dependencies for security patches
7. **Security Headers**: Implement security headers (HSTS, X-Frame-Options, etc.)

## 🎯 Learning Objectives

- Understand common web application vulnerabilities
- Learn how to identify security flaws in code
- Practice implementing secure coding practices
- Recognize the importance of input validation and sanitization
- Understand the risks of client-side data storage
- Learn about proper authentication and authorization

## ⚠️ Important Note

**These vulnerabilities are intentionally added for educational purposes only. Never implement these patterns in production code. Always follow security best practices and conduct regular security audits of your applications.**
