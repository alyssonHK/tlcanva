// server.mjs
//teste
import express from 'express';
import dotenv from 'dotenv';

// Carrega variáveis do arquivo .env.local em desenvolvimento
dotenv.config({ path: '.env.local' });
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import { load as cheerioLoad } from 'cheerio';
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

// ROTA DE PROXY PARA PÁGINAS WEB
app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).send('<h1>URL de destino não fornecida.</h1>');
  }

  try {
    const response = await axios.get(targetUrl, {
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      // timeout: 10000,
    });

    const html = response.data;
  const $ = cheerioLoad(html);

    // Remove tags que podem bloquear o iframe ou causar problemas
    $('meta[http-equiv="Content-Security-Policy"]').remove();
    $('meta[http-equiv="X-Frame-Options"]').remove();
  // Remover meta refresh que poderia redirecionar o iframe para outra origem
  $('meta[http-equiv="refresh"]').remove();
  // Decidir se mantemos scripts: se query.embed=1 e domínio está na whitelist, mantemos scripts
  const embedFlag = req.query.embed === '1';
  const whitelist = ['github.com'];
  const hostname = new URL(targetUrl).hostname.replace(/^www\./, '');
  const allowScripts = embedFlag && whitelist.includes(hostname);
  if (!allowScripts) {
    // Remover scripts para evitar que código remoto execute dentro do iframe proxied
    $('script').remove();
  }
    // Remove qualquer tag <base> existente e injeta a nova
    const urlObj = new URL(targetUrl);
    const baseHref = `${urlObj.protocol}//${urlObj.host}`;
    $('head base').remove();
    $('head').prepend(`<base href="${baseHref}">`);

    // Opcional: rewrite relative src/href attributes? base should handle most cases.

    // Enviar HTML modificado como resposta (mesma origem do seu backend)
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send($.html());
  } catch (error) {
    console.error('Erro no proxy:', error && error.toString ? error.toString() : error);
    res.status(500).send(`<h1>Erro ao carregar a página: ${String(targetUrl)}</h1>`);
  }
});

// ROTA QUE RETORNA INFORMAÇÕES SOBRE O DESTINO (útil para detectar redirects que apontam para a mesma origem)
app.get('/api/proxy/info', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({ ok: false, message: 'URL de destino não fornecida.' });
  }

  try {
    // Faz um GET simples (seguindo redirects) e retorna a URL final observada pelo request
    const response = await axios.get(targetUrl, {
      responseType: 'text',
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      // timeout: 5000,
    });

    // Tenta extrair a URL final (após redirects). Nem sempre disponível, então fallback para a URL fornecida.
    const finalUrl = (response.request && response.request.res && response.request.res.responseUrl) || targetUrl;
    res.json({ ok: true, finalUrl });
  } catch (error) {
    console.error('Erro no proxy info:', error && error.toString ? error.toString() : error);
    res.status(500).json({ ok: false, message: 'Erro ao consultar destino.' });
  }
});

export default app;
