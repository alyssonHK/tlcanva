import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const USERS_FILE = path.join(__dirname, 'users.json');

// Read users from JSON file
export function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

// Write users to JSON file
export function writeUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
  }
}

// Find user by email
export function findUserByEmail(email) {
  const users = readUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

// Find user by ID
export function findUserById(id) {
  const users = readUsers();
  return users.find(user => user.id === id);
}

// Create new user
export async function createUser(email, password, name) {
  const users = readUsers();
  
  // Check if user already exists
  if (findUserByEmail(email)) {
    throw new Error('User already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Create new user
  const newUser = {
    id: generateId(),
    email: email.toLowerCase(),
    password: hashedPassword,
    name,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeUsers(users);

  // Return user without password
  const { password: _, ...userPublic } = newUser;
  return userPublic;
}

// Verify user credentials
export async function verifyUser(email, password) {
  const user = findUserByEmail(email);
  if (!user) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return null;
  }

  // Return user without password
  const { password: _, ...userPublic } = user;
  return userPublic;
}

// Generate JWT token
export function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Middleware to authenticate requests
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
}

// Generate unique ID
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}
