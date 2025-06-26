import React, { useState, useEffect } from 'react';
import * as S from './style';

// Intentional Security Vulnerabilities:
// 1. XSS - Direct innerHTML usage
// 2. SQL Injection simulation
// 3. Sensitive data exposure
// 4. No input validation
// 5. Hardcoded credentials
// 6. Insecure direct object references

interface User {
  id: number;
  name: string;
  email: string;
}

const UserProfile = () => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    address: '',
    creditCard: '',
    password: '',
    bio: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);

  // VULNERABILITY 1: Hardcoded credentials (DO NOT DO THIS IN REAL APPS!)
  const adminCredentials = {
    username: 'admin',
    password: 'admin123',
    apiKey: 'sk-1234567890abcdef',
    databaseUrl: 'mongodb://admin:password@localhost:27017'
  };

  // VULNERABILITY 2: Simulated SQL Injection
  const searchUsers = (query: string) => {
    // VULNERABLE: Direct string concatenation (SQL Injection simulation)
    const sqlQuery = `SELECT * FROM users WHERE name LIKE '%${query}%' OR email LIKE '%${query}%'`;
    console.log('Executing query:', sqlQuery);
    
    // Simulate search results
    const mockResults = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
    ];
    setSearchResults(mockResults);
  };

  // VULNERABILITY 3: XSS - Direct innerHTML usage
  const renderUserBio = (bio: string) => {
    return { __html: bio }; // VULNERABLE: Direct innerHTML
  };

  // VULNERABILITY 4: Sensitive data exposure
  const saveUserData = () => {
    // VULNERABLE: Logging sensitive data
    console.log('Saving user data:', JSON.stringify(userData));
    
    // VULNERABLE: Storing in localStorage without encryption
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('creditCard', userData.creditCard); // VULNERABLE: Plain text storage
    
    alert('Profile saved!');
    setIsEditing(false);
  };

  // VULNERABILITY 5: No input validation
  const handleInputChange = (field: string, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value // VULNERABLE: No validation
    }));
  };

  // VULNERABILITY 6: Insecure direct object references
  const getUserById = (id: string) => {
    // VULNERABLE: No authorization check
    const user = { id, name: 'User ' + id, email: 'user' + id + '@example.com' };
    console.log('Accessing user data:', user);
    return user;
  };

  useEffect(() => {
    // VULNERABLE: Loading sensitive data from localStorage
    const savedData = localStorage.getItem('userData');
    if (savedData) {
      setUserData(JSON.parse(savedData));
    }
  }, []);

  return (
    <S.Container>
      <S.Header>
        <h1>User Profile</h1>
        <button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </S.Header>

      <S.Content>
        <S.Section>
          <h2>Personal Information</h2>
          <S.Form>
            <S.FormGroup>
              <label>Name:</label>
              <input
                type="text"
                value={userData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your name"
              />
            </S.FormGroup>

            <S.FormGroup>
              <label>Email:</label>
              <input
                type="email"
                value={userData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your email"
              />
            </S.FormGroup>

            <S.FormGroup>
              <label>Address:</label>
              <textarea
                value={userData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your address"
              />
            </S.FormGroup>

            <S.FormGroup>
              <label>Credit Card:</label>
              <input
                type="text"
                value={userData.creditCard}
                onChange={(e) => handleInputChange('creditCard', e.target.value)}
                disabled={!isEditing}
                placeholder="1234-5678-9012-3456"
              />
            </S.FormGroup>

            <S.FormGroup>
              <label>Password:</label>
              <input
                type="password"
                value={userData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your password"
              />
            </S.FormGroup>

            <S.FormGroup>
              <label>Bio:</label>
              <textarea
                value={userData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                disabled={!isEditing}
                placeholder="Tell us about yourself"
              />
            </S.FormGroup>

            {isEditing && (
              <S.Button onClick={saveUserData}>
                Save Profile
              </S.Button>
            )}
          </S.Form>
        </S.Section>

        <S.Section>
          <h2>Bio Preview</h2>
          <div 
            dangerouslySetInnerHTML={renderUserBio(userData.bio)}
            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </S.Section>

        <S.Section>
          <h2>User Search (Vulnerable)</h2>
          <S.FormGroup>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
            />
            <button onClick={() => searchUsers(searchQuery)}>
              Search
            </button>
          </S.FormGroup>
          
          {searchResults.length > 0 && (
            <div>
              <h3>Search Results:</h3>
              <ul>
                {searchResults.map((user: any) => (
                  <li key={user.id}>
                    {user.name} - {user.email}
                    <button onClick={() => getUserById(user.id)}>
                      View Details
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </S.Section>

        <S.Section>
          <h2>Debug Information (Vulnerable)</h2>
          <details>
            <summary>Click to view debug info</summary>
            <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
              {JSON.stringify({
                userData,
                adminCredentials, // VULNERABLE: Exposing credentials
                localStorage: {
                  userData: localStorage.getItem('userData'),
                  creditCard: localStorage.getItem('creditCard')
                }
              }, null, 2)}
            </pre>
          </details>
        </S.Section>
      </S.Content>
    </S.Container>
  );
};

export default UserProfile; 