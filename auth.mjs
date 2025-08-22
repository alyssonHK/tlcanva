// auth.mjs

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// 1. Inicializa o cliente do Supabase
// Ele usará as variáveis de ambiente que configuramos na Vercel
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// --- FUNÇÕES MODIFICADAS PARA O SUPABASE ---

export async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single(); // .single() pega um único resultado ou retorna null

  if (error && error.code !== 'PGRST116') { // PGRST116 é o erro para "nenhuma linha encontrada"
    console.error('Error finding user by email:', error);
    return null;
  }
  return data;
}

export async function findUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error finding user by id:', error);
    return null;
  }
  return data;
}

export async function createUser(email, password, name) {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw new Error('Could not create user');
  }

  const { password: _, ...userPublic } = data;
  return userPublic;
}

export async function verifyUser(email, password) {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return null;
  }

  const { password: _, ...userPublic } = user;
  return userPublic;
}

// O restante do arquivo (generateToken, verifyToken, etc.) permanece igual.

export function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid token.',
    });
  }
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}