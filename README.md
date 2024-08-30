# Task Management System

A comprehensive task management system with distinct functionalities for users and administrators. This system allows users to register, log in, solve tasks, and view results, while administrators manage tasks, evaluate candidates, and oversee task solutions. Built with Node.js, Express, and MongoDB, the system also includes several security features such as authentication, rate limiting, and input validation.

## Features

### 🛡️ Authentication and Security
- **User Registration and Login**: Users can register and log in with secure, rate-limited attempts to prevent brute-force attacks.
- **Session Management**: Secure session handling with HTTP-only cookies using `express-session`.
- **Security Middleware**: Protection with `helmet`, `csurf`, and content security policies.

### 👤 User Functionality
- **Profile Management**: Users can update profile data, including avatar uploads.
- **Task Management**: View task information, submit solutions, and add comments.
- **Result Viewing**: Check task results and download reports.

### 🛠️ Admin Functionality
- **Candidate and Task Management**: View and assign tasks to candidates, edit tasks, and manage solutions.
- **Evaluation and Feedback**: Evaluate submissions, provide comments, and generate performance reports.
- **Statistics and Insights**: Access key statistics and insights for users and tasks.

## 🛠️ Technologies Used

- **Node.js**: Backend runtime environment.
- **Express.js**: Web framework for handling HTTP requests.
- **MongoDB**: NoSQL database for storing user and task data.
- **Mongoose**: ODM for MongoDB, used for modeling and interacting with the database.
- **Bcrypt**: Secure password hashing for user authentication.
- **Multer**: Middleware for handling file uploads like avatars.
- **Helmet**: Secures HTTP headers.
- **Csurf**: Provides CSRF protection.
- **Rate-Limit**: Protects against brute-force attacks by limiting login attempts.
- **Express-Session**: Secure session management.
- **Dotenv**: Manages environment variables.
- **Cookie-Parser**: Parses cookies, mainly for CSRF protection.

## 🚀 Project Setup

### Prerequisites

- **Node.js** installed
- **MongoDB** installed and running
- A `.env` file containing:
  - `DB_URL`: MongoDB connection string
  - `SESSION_SECRET`: Secret key for session management

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <repository-folder>
