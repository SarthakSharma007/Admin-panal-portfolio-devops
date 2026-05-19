# 📊 AdminPanel - Portfolio Management System

A full-stack admin dashboard for managing a DevOps portfolio website. The AdminPanel allows administrators to create, edit, and manage portfolio content including projects, skills, certifications, experience, education, and messages. This content is then displayed on the public portfolio website.

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [How It Works](#how-it-works)
4. [AdminPanel vs Public Portal](#adminpanel-vs-public-portal)
5. [Features](#features)
6. [Technology Stack](#technology-stack)
7. [Installation & Setup](#installation--setup)
8. [Environment Configuration](#environment-configuration)
9. [Running the Application](#running-the-application)
10. [API Routes](#api-routes)
11. [Authentication & Security](#authentication--security)
12. [Database Schema](#database-schema)
13. [Troubleshooting](#troubleshooting)

---

## Overview

The **AdminPanel** is a secure administrative interface for managing portfolio content. It features:

- 🔐 **Secure Authentication** - JWT-based login system
- 📝 **Content Management** - Create, update, and delete portfolio items
- 🖼️ **Media Management** - Upload and manage images
- 📧 **Message Handling** - View and manage visitor messages
- 🎨 **Dark/Light Theme** - Theme switcher for comfortable viewing
- 🔒 **Protected Routes** - Only authenticated users can access admin features
- 📱 **Responsive Design** - Works on desktop and tablet devices

---

## Project Structure

```
Adminpanal/
│
├── client/                          # Frontend React Application
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── uploads/                 # Image upload directory
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminPanel.js        # Main admin dashboard component
│   │   │   ├── Login.js             # Login authentication component
│   │   │   ├── ProtectedRoute.js    # Route protection wrapper
│   │   │   ├── ThemeToggle.js       # Dark/Light theme switcher
│   │   │   ├── AdminPanel.css
│   │   │   ├── Login.css
│   │   │   └── ThemeToggle.css
│   │   │
│   │   ├── contexts/
│   │   │   └── ThemeContext.js      # Global theme state management
│   │   │
│   │   ├── services/
│   │   │   └── api.js               # API client with axios configuration
│   │   │
│   │   ├── data/                    # Static data constants
│   │   │
│   │   ├── assets/
│   │   │   └── profile/             # Profile images and assets
│   │   │
│   │   ├── App.js                   # Main app router
│   │   ├── App.css
│   │   ├── index.js                 # React entry point
│   │   └── index.css
│   │
│   ├── package.json
│   └── package-lock.json
│
├── server/                          # Backend Node.js/Express Server
│   ├── config/
│   │   ├── db.js                    # MySQL database connection
│   │   └── email.js                 # Email configuration (Nodemailer)
│   │
│   ├── middleware/
│   │   └── auth.js                  # JWT authentication middleware
│   │
│   ├── routes/
│   │   ├── auth.js                  # Authentication endpoints (/login, /register)
│   │   ├── projects.js              # Project CRUD endpoints
│   │   ├── skills.js                # Skills CRUD endpoints
│   │   ├── certifications.js        # Certifications CRUD endpoints
│   │   ├── experiences.js           # Experience CRUD endpoints
│   │   ├── education.js             # Education CRUD endpoints
│   │   ├── messages.js              # Message management endpoints
│   │   └── personalInfo.js          # Personal info endpoints
│   │
│   ├── uploads/                     # Server-side file uploads storage
│   │
│   ├── server.js                    # Express server setup & initialization
│   ├── package.json
│   └── package-lock.json
│
└── README.md                        # This file
```

---

## How It Works

### Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN PANEL FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User Opens AdminPanel → http://localhost:3002              │
│                ↓                                               │
│  2. ProtectedRoute checks authentication token                 │
│                ↓                                               │
│  3. If no token → Redirect to /login                          │
│                ↓                                               │
│  4. User enters credentials → Backend validates (auth.js)     │
│                ↓                                               │
│  5. Backend returns JWT token                                 │
│                ↓                                               │
│  6. Token stored in localStorage (browser)                    │
│                ↓                                               │
│  7. User accesses AdminPanel Dashboard                        │
│                ↓                                               │
│  8. Admin performs CRUD operations on portfolio items         │
│                ↓                                               │
│  9. API requests include JWT token in header                  │
│                ↓                                               │
│  10. Backend verifies token → auth middleware (auth.js)       │
│                ↓                                               │
│  11. Backend processes request → Updates database             │
│                ↓                                               │
│  12. Response sent back to frontend                           │
│                ↓                                               │
│  13. Public Portal fetches updated content automatically      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌──────────────────────┐
│   AdminPanel UI      │
│  (React - Port 3002) │
└──────────┬───────────┘
           │ HTTP/CORS
           │
┌──────────▼─────────────────────────┐
│  Express Backend API Server        │
│  (Port 5001)                       │
│  ├─ Authentication Routes          │
│  ├─ Project Management Routes      │
│  ├─ Skills Management Routes       │
│  ├─ Certification Routes           │
│  └─ Experience/Education Routes    │
└──────────┬────────────────────────┬┘
           │                        │
           │ Database              │ File Storage
           │ Queries               │
     ┌─────▼──────────┐      ┌────▼──────────┐
     │  MySQL Database│      │ Uploads Folder│
     │  portfolio_db  │      │ (Images/Files)│
     └────────────────┘      └───────────────┘
```

---

## AdminPanel vs Public Portal

### AdminPanel Features ✅
- **Create** - Add new portfolio items (projects, skills, etc.)
- **Read** - View all portfolio items in dashboard
- **Update** - Edit existing portfolio items
- **Delete** - Remove portfolio items
- **Upload Images** - Add project images, profile photos
- **Manage Messages** - View and respond to contact form messages
- **Admin Controls** - Full control over all content

### Public Portal Features 📖
- **Display Only** - Shows portfolio items created by admin
- **Read-Only** - Visitors cannot edit or delete content
- **View Projects** - Browse all projects with images and links
- **View Skills & Experience** - See skills, certifications, education
- **Contact Form** - Send messages (stored in AdminPanel inbox)
- **Responsive Design** - Accessible on all devices

### Data Connection 🔗

```
AdminPanel (Creates/Edits Data)
         ↓
   MySQL Database
         ↓
Public Portal (Fetches & Displays Data)
```

When you create or update content in AdminPanel:
1. Data is saved to MySQL database
2. Public Portal fetches this data via API
3. Content appears on public website automatically
4. No manual deployment needed for content updates

---

## Features

### 🔐 Authentication & Security
- **Login System** - Email/password authentication
- **JWT Tokens** - Secure token-based authentication
- **Protected Routes** - Only authenticated users can access admin panel
- **Rate Limiting** - Protects against brute force attacks
- **Helmet Middleware** - HTTP security headers
- **CORS Configuration** - Allows requests only from authorized domains

### 📊 Dashboard Management
- **Tabbed Interface** - Switch between different content types
- **Home Tab** - Personal info and profile management
- **Skills Tab** - Add/edit/delete technical skills
- **Projects Tab** - Manage portfolio projects with images
- **Certifications Tab** - Track certifications and credentials
- **Experience Tab** - Manage work experience entries
- **Education Tab** - Track educational background
- **Inbox Tab** - View messages from portfolio visitors

### 📁 Content Management
- **CRUD Operations** - Create, Read, Update, Delete
- **Image Uploads** - Upload project and profile images
- **Real-time Updates** - Changes reflect immediately
- **Form Validation** - Client-side and server-side validation
- **Error Handling** - User-friendly error messages

### 🎨 User Interface
- **Dark/Light Theme** - Toggle theme preference
- **Responsive Design** - Mobile-friendly interface
- **Bootstrap UI** - Professional styled components
- **Icons** - React Icons for intuitive navigation
- **Animations** - Smooth transitions with Framer Motion
- **Modal Dialogs** - Confirmation for delete operations

### 🛡️ Performance & Optimization
- **Rate Limiting** - 1000 requests per 15 minutes
- **File Size Limits** - Max 10MB for uploads
- **Connection Pooling** - Optimized database connections
- **CORS Caching** - Reduced unnecessary requests
- **Error Recovery** - Graceful error handling

---

## Technology Stack

### Frontend (Client)
- **React 18.2.0** - UI library
- **React Router DOM 6.20.1** - Client-side routing
- **Bootstrap 5.3.8** - CSS framework
- **React Bootstrap 2.10.10** - Bootstrap components
- **Axios 1.6.2** - HTTP client
- **Framer Motion 10.18.0** - Animation library
- **React Icons 4.12.0** - Icon library

### Backend (Server)
- **Node.js/Express 4.18.2** - Web framework
- **MySQL2 3.6.5** - Database driver
- **JWT (jsonwebtoken 9.0.2)** - Authentication
- **Bcrypt 6.0.0** - Password hashing
- **Multer 1.4.5** - File uploads
- **Nodemailer 8.0.1** - Email sending
- **Helmet 7.1.0** - Security headers
- **CORS 2.8.5** - Cross-Origin Resource Sharing
- **Express Rate Limit 7.1.5** - Rate limiting

### Database
- **MySQL** - Relational database for storing portfolio data

---

## Installation & Setup

### Prerequisites
Before starting, ensure you have installed:
- **Node.js** (v14.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MySQL** (v5.7 or higher) - [Download](https://www.mysql.com/downloads/)
- **Git** (optional)

### Step 1: Clone or Download Project

```bash
# Navigate to project directory
cd Adminpanal
```

### Step 2: Setup Backend Server

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file in server directory
touch .env
# On Windows:
type nul > .env
```

### Step 3: Setup Frontend Client

```bash
# Navigate to client directory
cd ../client

# Install dependencies
npm install
```

### Step 4: Database Setup

1. Open MySQL and create database:
```sql
CREATE DATABASE portfolio_db;
USE portfolio_db;
```

2. Create tables (you may need to create schema based on your database structure):
```sql
-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Skills table
CREATE TABLE skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  level VARCHAR(50),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  tech_stack VARCHAR(255),
  github_link VARCHAR(255),
  demo_link VARCHAR(255),
  image_url VARCHAR(255),
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certifications table
CREATE TABLE certifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  issuing_organization VARCHAR(255),
  issue_date DATE,
  credential_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Experience table
CREATE TABLE experiences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  company VARCHAR(255),
  location VARCHAR(255),
  start_date DATE,
  end_date DATE,
  current BOOLEAN DEFAULT false,
  description TEXT,
  technologies VARCHAR(255),
  type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Education table
CREATE TABLE education (
  id INT PRIMARY KEY AUTO_INCREMENT,
  degree VARCHAR(100),
  institution VARCHAR(255),
  location VARCHAR(255),
  start_date DATE,
  end_date DATE,
  current BOOLEAN DEFAULT false,
  gpa VARCHAR(10),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  email VARCHAR(255),
  message TEXT,
  status VARCHAR(50) DEFAULT 'unread',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personal Info table
CREATE TABLE personal_info (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  title VARCHAR(255),
  bio TEXT,
  profile_image VARCHAR(255),
  resume_link VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  github_link VARCHAR(255),
  linkedin_link VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Environment Configuration

### Backend (.env file)

Create a `.env` file in the `server/` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=portfolio_db

# Server Configuration
ADMIN_PORT=5001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# CORS Configuration
FRONTEND_URL=http://localhost:3002

# Email Configuration (Optional - for Nodemailer)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

### Frontend (.env file - Optional)

Create a `.env` file in the `client/` directory:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5001/api
PORT=3002
```

### Important Security Notes ⚠️

1. **Change JWT_SECRET** - Use a strong, random secret in production
2. **Database Password** - Use a secure password, not the default
3. **Email Password** - Use app-specific passwords for Gmail, not your actual password
4. **Never commit .env files** - Add to .gitignore
5. **HTTPS in Production** - Always use HTTPS for secure connections

---

## Running the Application

### Terminal 1: Start Backend Server

```bash
# Navigate to server directory
cd server

# Install dependencies (first time only)
npm install

# Start in development mode with auto-reload
npm run dev

# Or start in production mode
npm start
```

Expected output:
```
✅ Database connected successfully
Server is running on port 5001
Admin Panel API: http://localhost:5001/api
```

### Terminal 2: Start Frontend Client

```bash
# Navigate to client directory
cd client

# Install dependencies (first time only)
npm install

# Start development server
npm start
```

The application will automatically open at: **http://localhost:3002**

### Default Login Credentials

```
Email: admin@portfolio.com
Password: Admin@123
```

⚠️ **Change these credentials immediately in production!**

### Default Admin Account Setup

If you need to create a new admin account:

```sql
-- Hash password "Admin@123" using bcrypt
-- Then insert into database:
INSERT INTO users (email, password) 
VALUES ('admin@portfolio.com', '$2a$10$...');  -- Use bcrypt hashed password
```

---

## API Routes

### Authentication Routes `/api/auth`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/login` | Login with credentials | ❌ |
| POST | `/register` | Create new admin account | ❌ |
| POST | `/logout` | Logout current session | ✅ |
| GET | `/verify` | Verify token validity | ✅ |

### Skills Routes `/api/skills`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all skills | ✅ |
| POST | `/` | Create new skill | ✅ |
| PUT | `/:id` | Update skill | ✅ |
| DELETE | `/:id` | Delete skill | ✅ |

### Projects Routes `/api/projects`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all projects | ✅ |
| POST | `/` | Create new project | ✅ |
| PUT | `/:id` | Update project | ✅ |
| DELETE | `/:id` | Delete project | ✅ |
| POST | `/upload` | Upload project image | ✅ |

### Certifications Routes `/api/certifications`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all certifications | ✅ |
| POST | `/` | Create new certification | ✅ |
| PUT | `/:id` | Update certification | ✅ |
| DELETE | `/:id` | Delete certification | ✅ |

### Experience Routes `/api/experiences`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all experiences | ✅ |
| POST | `/` | Create new experience | ✅ |
| PUT | `/:id` | Update experience | ✅ |
| DELETE | `/:id` | Delete experience | ✅ |

### Education Routes `/api/education`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all education | ✅ |
| POST | `/` | Create new education | ✅ |
| PUT | `/:id` | Update education | ✅ |
| DELETE | `/:id` | Delete education | ✅ |

### Messages Routes `/api/messages`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all messages | ✅ |
| GET | `/:id` | Get specific message | ✅ |
| PUT | `/:id` | Update message status | ✅ |
| DELETE | `/:id` | Delete message | ✅ |

### Personal Info Routes `/api/personalInfo`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get personal info | ✅ |
| PUT | `/` | Update personal info | ✅ |
| POST | `/upload` | Upload profile image | ✅ |

---

## Authentication & Security

### JWT Authentication Flow

```
1. User Logs In
   ↓
2. Server validates credentials
   ↓
3. If valid, generate JWT token
   ↓
4. Token sent to client
   ↓
5. Client stores token in localStorage
   ↓
6. Client includes token in every request header:
   Header: "x-auth-token: eyJhbGciOiJIUzI1NiIs..."
   ↓
7. Server verifies token with auth middleware
   ↓
8. If valid → Process request
   If invalid → Return 401 Unauthorized
```

### Security Features

✅ **Password Hashing** - Bcrypt with salt rounds
✅ **JWT Tokens** - Secure token-based sessions
✅ **CORS** - Restricted to allowed domains
✅ **Helmet Middleware** - Security headers
✅ **Rate Limiting** - Prevents brute force attacks
✅ **Protected Routes** - Frontend route protection
✅ **Server-side Validation** - Input validation on all routes
✅ **HTTPS Support** - Ready for production HTTPS

### Best Practices

1. **Change Default Credentials** - Set strong admin password
2. **Use Environment Variables** - Never hardcode secrets
3. **Keep Dependencies Updated** - Regularly update npm packages
4. **Monitor Access Logs** - Track API requests
5. **Use HTTPS in Production** - Always encrypt traffic
6. **Backup Database Regularly** - Protect your data
7. **Set Strong JWT_SECRET** - Use cryptographically secure random string

---

## Database Schema

### Users Table
```sql
users
├── id (INT, PRIMARY KEY)
├── email (VARCHAR, UNIQUE)
├── password (VARCHAR, hashed)
└── created_at (TIMESTAMP)
```

### Skills Table
```sql
skills
├── id (INT, PRIMARY KEY)
├── name (VARCHAR)
├── level (VARCHAR - Beginner, Intermediate, Expert)
├── category (VARCHAR - Frontend, Backend, DevOps, etc.)
└── created_at (TIMESTAMP)
```

### Projects Table
```sql
projects
├── id (INT, PRIMARY KEY)
├── title (VARCHAR)
├── description (TEXT)
├── tech_stack (VARCHAR)
├── github_link (VARCHAR)
├── demo_link (VARCHAR)
├── image_url (VARCHAR)
├── featured (BOOLEAN)
└── created_at (TIMESTAMP)
```

### Additional Tables
- **certifications** - Certifications and credentials
- **experiences** - Work experience history
- **education** - Educational background
- **messages** - Contact form messages
- **personal_info** - Profile and personal information

---

## Troubleshooting

### 🔴 "Cannot Connect to Database"

**Problem:** `Database connection error: ECONNREFUSED`

**Solutions:**
1. Verify MySQL is running:
   ```bash
   # Windows
   net start MySQL80
   
   # Or check Services in Control Panel
   ```

2. Check database credentials in `.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=correct_password
   DB_NAME=portfolio_db
   ```

3. Verify database exists:
   ```sql
   SHOW DATABASES;
   ```

### 🔴 "Cannot Login / Invalid Credentials"

**Problem:** Login always fails even with correct password

**Solutions:**
1. Verify admin user exists in database:
   ```sql
   SELECT * FROM users WHERE email='admin@portfolio.com';
   ```

2. If user doesn't exist, create one with hashed password
3. Check JWT_SECRET in `.env` is set
4. Check browser console for detailed error messages

### 🔴 "CORS Error / Cannot Connect Frontend to Backend"

**Problem:** `Cross-Origin Request Blocked`

**Solutions:**
1. Ensure backend is running on port 5001
2. Verify CORS configuration in server.js
3. Check proxy in client package.json:
   ```json
   "proxy": "http://localhost:5001"
   ```

4. Verify frontend is accessing: `http://localhost:3002`

### 🔴 "Images Not Uploading"

**Problem:** Image upload returns error or 404

**Solutions:**
1. Check uploads folder exists:
   ```bash
   # Create if missing
   mkdir server/uploads
   ```

2. Verify file permissions are correct
3. Check MAX_FILE_SIZE in `.env`
4. Check multer configuration in route files

### 🔴 "Port Already in Use"

**Problem:** `EADDRINUSE: address already in use :::5001`

**Solutions:**
```bash
# Find process using port 5001
netstat -ano | findstr :5001

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or change port in server.js
const PORT = process.env.ADMIN_PORT || 5002;
```

### 🔴 "Dependencies Install Fails"

**Problem:** `npm ERR! code ERESOLVE unable to resolve dependency tree`

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -r node_modules package-lock.json

# Reinstall with legacy peer deps flag
npm install --legacy-peer-deps
```

### 🔴 "Blank White Screen"

**Problem:** Frontend shows blank screen, no errors

**Solutions:**
1. Check browser console (F12) for errors
2. Verify React is properly mounted in index.js
3. Check that backend API is running and accessible
4. Clear browser cache (Ctrl+Shift+Delete)
5. Try hard refresh (Ctrl+Shift+R)

---

## Common Tasks

### Adding a New Portfolio Item

#### 1. Via Admin Panel UI
- Open AdminPanel at http://localhost:3002
- Log in with admin credentials
- Navigate to appropriate tab (Projects, Skills, etc.)
- Click "Add New" button
- Fill in the form
- Click "Save"

#### 2. Item appears on Public Portal
- No additional action needed
- Public portal fetches data from database automatically
- Changes are live within seconds

### Uploading Images

1. Click image upload button in form
2. Select image file from your computer
3. Image is uploaded to `server/uploads/` folder
4. Image URL is stored in database
5. Public portal displays the image

### Deleting Content

1. Find the item in AdminPanel
2. Click the delete icon (trash can)
3. Confirm deletion in dialog
4. Item is removed from database
5. Disappears from public portal immediately

### Changing Personal Information

1. Go to Home tab in AdminPanel
2. Edit your name, title, bio, links
3. Upload profile image if needed
4. Save changes
5. Updates appear on public portfolio header

---

## Performance Tips

1. **Compress Images** - Compress before uploading for faster loading
2. **Optimize Database** - Add indexes to frequently queried columns
3. **Cache Content** - Implement caching for public portal
4. **CDN for Images** - Use CDN for image delivery in production
5. **Lazy Loading** - Implement lazy loading on public portal
6. **Minify Code** - Run `npm run build` for production

---

## Deployment

### Preparing for Production

1. Create production `.env` file with:
   - Strong JWT_SECRET
   - Secure database credentials
   - Production database name
   - Production frontend URL
   - HTTPS URLs

2. Build frontend:
   ```bash
   cd client
   npm run build
   ```

3. Set `NODE_ENV=production` in backend `.env`

4. Use process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "admin-panel"
   pm2 save
   pm2 startup
   ```

### Hosting Options

- **Backend:** Heroku, AWS EC2, DigitalOcean, Render
- **Frontend:** Vercel, Netlify, AWS S3 + CloudFront
- **Database:** AWS RDS, DigitalOcean Managed MySQL

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Commit with clear messages
6. Push to your fork
7. Create a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Support & Contact

For issues, questions, or suggestions:
- Check the Troubleshooting section above
- Review error messages in browser console (F12)
- Check backend logs in terminal
- Contact the development team

---

## Changelog

### Version 1.0.0 - Initial Release
- ✅ Admin authentication system
- ✅ Project management
- ✅ Skills management
- ✅ Certifications management
- ✅ Experience management
- ✅ Education management
- ✅ Message inbox
- ✅ Image upload functionality
- ✅ Dark/Light theme
- ✅ Responsive design

---

**Last Updated:** May 2024
**Maintained by:** Portfolio Development Team

---

## Quick Start Guide

Follow these simple steps to start the Admin Panel on your local machine:

**Step 1: Start the Backend Server**
1. Open a new terminal.
2. Navigate to the backend folder: `cd Adminpanal/server` (or `cd server` if you are already in the Adminpanal directory).
3. Install dependencies (first time only): `npm install`
4. Start the server: `npm run dev`
   *(It will run on port 5001 by default)*

**Step 2: Start the Frontend Client**
1. Open a second new terminal.
2. Navigate to the frontend folder: `cd Adminpanal/client` (or `cd client` if you are already in the Adminpanal directory).
3. Install dependencies (first time only): `npm install`
4. Start the React application: `npm start`
   *(It will automatically open your browser to http://localhost:3002)*

**Step 3: Log In**
- Use the default credentials to access the admin dashboard:
  - **Email:** `admin@portfolio.com`
  - **Password:** `Admin@123`
