# Registration & Login API

## Registration Endpoint

**POST** `/api/auth/register`

### Request Body:
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "yourpassword123",
  "confirmPassword": "yourpassword123"
}
```

### Response (Success - 201):
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "role": "USER",
    "is_assignee": false
  }
}
```

### Response (Error - 400):
```json
{
  "error": "All fields are required"
}
// or
{
  "error": "Passwords do not match"
}
// or
{
  "error": "Password must be at least 6 characters long"
}
// or
{
  "error": "User with this email already exists"
}
// or
{
  "error": "Invalid email format"
}
```

## Login with Password Endpoint

**POST** `/api/auth/login/password`

### Request Body:
```json
{
  "email": "john@example.com",
  "password": "yourpassword123"
}
```

### Response (Success - 200):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "role": "USER",
    "is_assignee": false
  }
}
```

### Response (Error - 401):
```json
{
  "error": "Invalid email or password"
}
// or
{
  "error": "Please use Google sign-in for this account"
}
```

## Frontend Integration Example

```javascript
// Registration
async function register(fullName, email, password, confirmPassword) {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fullName,
      email,
      password,
      confirmPassword
    })
  });

  const data = await response.json();
  
  if (response.ok) {
    // Store token in localStorage or cookies
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  } else {
    throw new Error(data.error);
  }
}

// Login
async function login(email, password) {
  const response = await fetch('http://localhost:3000/api/auth/login/password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  } else {
    throw new Error(data.error);
  }
}
```

## Data Flow

1. **Frontend** sends registration data to backend
2. **Backend** validates data and checks if email exists
3. **Backend** hashes password with bcrypt
4. **Backend** saves user to **Supabase PostgreSQL database**
5. **Backend** generates JWT token
6. **Backend** returns token + user data to frontend
7. **Frontend** stores token for authenticated requests

## Security Features

- ✅ Password hashing with bcryptjs (salt rounds: 10)
- ✅ Email validation
- ✅ Password minimum length (6 characters)
- ✅ Password confirmation matching
- ✅ Duplicate email check
- ✅ JWT token authentication
- ✅ Data stored in Supabase PostgreSQL database

## Notes

- All passwords are hashed before storing in Supabase
- OAuth users (Google sign-in) have `password: null`
- Token expires in 24 hours
- Use the token in Authorization header for protected routes: `Authorization: Bearer <token>`
