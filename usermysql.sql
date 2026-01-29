-- Step 1: Create the users table first
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    displayName VARCHAR(255),
    theme VARCHAR(20) DEFAULT 'system',
    language VARCHAR(10) DEFAULT 'en',
    profileImageUrl TEXT,
    phone VARCHAR(20),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    isActive BOOLEAN DEFAULT TRUE,
    lastLogin TIMESTAMP
);

-- Step 2: Now create the notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    category VARCHAR(100),
    relatedEntityType VARCHAR(100),
    relatedEntityId VARCHAR(255),
    isRead BOOLEAN DEFAULT FALSE,
    actionUrl VARCHAR(255),
    priority VARCHAR(50),
    expiresAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    readAt TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);