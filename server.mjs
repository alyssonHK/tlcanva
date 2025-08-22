// server.mjs

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { 
  createUser, 
  verifyUser, 
  generateToken, 
  authenticateToken,
  findUserById
} from './auth.mjs';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();

// --- INICIALIZAÇÃO DO SUPABASE ---
// (Adicione esta seção)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// --- CONFIGURAÇÃO DO EXPRESS E CORS ---
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tlcanva.vercel.app'] // Garanta que não há uma barra no final
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());


// --- CONFIGURAÇÃO DO MULTER PARA MEMORY STORAGE ---
// (Alterado de diskStorage para memoryStorage)
const upload = multer({ 
  storage: multer.memoryStorage(), // Usa a memória, não o disco
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// ==================== ROTAS DE AUTENTICAÇÃO ====================
// (As rotas de autenticação permanecem as mesmas)

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    const user = await createUser(email, password, name);
    const token = generateToken(user);
    res.json({ success: true, message: 'User registered successfully', user, token });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const user = await verifyUser(email, password);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const token = generateToken(user);
    res.json({ success: true, message: 'Login successful', user, token });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get current user endpoint
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const { password: _, ...userPublic } = user;
    res.json({ success: true, user: userPublic });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==================== ROTAS DE ARQUIVOS (MODIFICADAS) ====================

// Upload endpoint (agora com Supabase Storage)
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const file = req.file;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = `${uniqueSuffix}-${file.originalname}`;

    // Fazendo o upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads') // Nome do seu bucket
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Obtendo a URL pública do arquivo
    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(data.path);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      url: publicUrlData.publicUrl, // URL pública do Supabase
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      filename: fileName // Nome do arquivo no bucket
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during upload' });
  }
});

// Delete file endpoint (agora com Supabase Storage)
app.delete('/api/files/:filename', authenticateToken, async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Deletando o arquivo do Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .remove([filename]);

    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      message: 'File deleted successfully',
      filename: filename
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during file deletion' });
  }
});


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

export default app;