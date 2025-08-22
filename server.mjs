// server.mjs
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); // Use a Service Role Key aqui

app.use(cors({ origin: '*' })); // Simplificado para o exemplo
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Middleware para validar o token do Supabase
const authenticateSupabaseToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(403).json({ message: 'Invalid token' });

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
