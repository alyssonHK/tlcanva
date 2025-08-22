// server.mjs
//teste
import express from 'express';
import dotenv from 'dotenv';

// Carrega variáveis do arquivo .env.local em desenvolvimento
dotenv.config({ path: '.env.local' });
import cors from 'cors';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

const app = express();
// Use o ANON KEY por padrão em desenvolvimento. Se precisar de privilégios administrativos
// (upload sem contexto do usuário, gerenciamento de buckets etc.), configure a
// SUPABASE_SERVICE_ROLE_KEY em produção e use com cuidado (não commitá-la).
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

// CORS seguro para produção: ajuste os domínios conforme necessário
const allowedOrigins = [
  'https://tlcanva.vercel.app',
  'https://www.tlcanva.vercel.app',
  'http://localhost:5173', // para dev local
];
app.use(cors({
  origin: function (origin, callback) {
    // Permite requests sem origin (ex: mobile, curl) ou de origens permitidas
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
}));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Middleware para validar o token do Supabase
const authenticateSupabaseToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Authorization header:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    console.error('Supabase getUser error:', error);
    return res.status(403).json({ message: 'Invalid token' });
  }

  req.user = user;
  next();
};

// Rota de Upload
app.post('/api/upload', authenticateSupabaseToken, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const sanitizedOriginalName = req.file.originalname.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9.\-_]/g, '-');
    const fileName = `${req.user.id}/${Date.now()}-${sanitizedOriginalName}`;
    const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

    if (error) return res.status(500).json({ message: error.message });

    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path);

    res.json({ success: true, url: publicUrl, name: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size });
});

export default app;
