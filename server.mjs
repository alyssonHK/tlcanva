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
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

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
    // Tenta buscar a página com headers semelhantes a um browser e seguindo redirects.
    // Alguns sites (Cloudflare, bot-protection) ainda podem bloquear esse request e exigir um navegador headless.
    const response = await axios.get(targetUrl, {
      responseType: 'text',
      maxRedirects: 10,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
        // Some servers look for these fetch metadata headers; presence may help
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document'
      },
      validateStatus: status => status >= 200 && status < 400,
      // timeout: 10000,
    });

    const html = response.data;
  const $ = cheerioLoad(html);

  // Detect headers that forbid framing (Content-Security-Policy with frame-ancestors or X-Frame-Options)
  const respHeaders = response.headers || {};
  const csp = (respHeaders['content-security-policy'] || respHeaders['Content-Security-Policy'] || '').toString();
  const xframe = (respHeaders['x-frame-options'] || respHeaders['X-Frame-Options'] || '').toString();
  const frameDisallowed = /frame-ancestors\s+('none'|none)/i.test(csp) || /deny/i.test(xframe) || /sameorigin/i.test(xframe) && (new URL(targetUrl).origin !== (req.protocol + '://' + req.get('host')));
  if (frameDisallowed) {
    console.log('[proxy] framing forbidden by target headers for', targetUrl, 'csp=', csp, 'x-frame-options=', xframe);
  }

    // Remove tags que podem bloquear o iframe ou causar problemas
    $('meta[http-equiv="Content-Security-Policy"]').remove();
    $('meta[http-equiv="X-Frame-Options"]').remove();
  // Remover meta refresh que poderia redirecionar o iframe para outra origem
  $('meta[http-equiv="refresh"]').remove();
  // Decidir se mantemos scripts: se query.embed=1 e domínio está na whitelist, mantemos scripts
  const embedFlag = req.query.embed === '1';
  // Lista de domínios permitidos para embed dinâmica via .env (EX: EMBED_WHITELIST=github.com,example.com)
  // Padrões incluídos para desenvolvimento: github + crunchyroll + facebook
  const EMBED_WHITELIST = (process.env.EMBED_WHITELIST || 'github.com,crunchyroll.com,facebook.com').split(',').map(s => s.trim().replace(/^www\./, '')).filter(Boolean);
  const whitelist = EMBED_WHITELIST;
  const hostname = new URL(targetUrl).hostname.replace(/^www\./, '');
  // Only allow scripts if embed requested, domain whitelisted, and the target does not explicitly forbid framing
  const allowScripts = embedFlag && whitelist.includes(hostname) && !frameDisallowed;
  console.log('[proxy] targetUrl=', targetUrl, 'hostname=', hostname, 'embedFlag=', embedFlag, 'allowScripts=', allowScripts);
  // Remove scripts quando não permitido
  if (!allowScripts) {
    // Remover scripts para evitar que código remoto execute dentro do iframe proxied
    $('script').remove();
  }

  // Resolve baseHref a partir do target antes de operar substituições que dependem dele
  const urlObj = new URL(targetUrl);
  const baseHref = `${urlObj.protocol}//${urlObj.host}`;

  // Sempre remover referências a ferramentas de desenvolvimento locais (Vite client, qualquer porta localhost)
  // Mesmo quando allowScripts=true, esses scripts apontam para seu ambiente de dev e causam CORS / comportamento inesperado
  $('script[src*="@vite"]').remove();
  // remove scripts/links que apontam para qualquer localhost:port
  $('script[src*="localhost:"]').remove();
  $('link[href*="localhost:"]').remove();

  // Remove qualquer tag <base> existente e injeta a nova
  $('head base').remove();
  $('head').prepend(`<base href="${baseHref}">`);

  // Agora gera o HTML final a partir do DOM modificado e aplica substituições finais
  let proxiedHtml = $.html();
  try {
    // Substituir referências a http://localhost:PORT ou https://localhost:PORT
    proxiedHtml = proxiedHtml.replace(/https?:\/\/localhost:\d+/g, baseHref);
    // Remover paths do Vite dev client que possam existir
    proxiedHtml = proxiedHtml.replace(/\/@vite/g, '/');
    // Reescrever links absolutos que apontam para a mesma origem do target para passar pelo proxy
    try {
      const escapedBase = baseHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const hrefRegex = new RegExp(`href=(\\"|\\')${escapedBase}([^\\"\\']*)(\\"|\\')`, 'gi');
      proxiedHtml = proxiedHtml.replace(hrefRegex, (m, q1, path, q2) => {
        const full = baseHref + path;
        return `href=${q1}/api/proxy?url=${encodeURIComponent(full)}${q2}`;
      });
      // Também capturar location.href = 'https://base/...'
      const locRegex = new RegExp(`(location\\.(?:href|assign)\\s*=\\s*)(\\"|\\')${escapedBase}([^\\"\\']*)(\\"|\\')`, 'gi');
      proxiedHtml = proxiedHtml.replace(locRegex, (m, prefix, q1, path, q2) => {
        const full = baseHref + path;
        return `${prefix}${q1}/api/proxy?url=${encodeURIComponent(full)}${q2}`;
      });
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // se replace falhar por algum motivo, ignoramos e enviamos o html gerado pelo cheerio
  }
  
  // Reescrever links e formulários para passar pelo proxy — assim cliques dentro do iframe também serão proxied
  try {
    const EMBED_WHITELIST = (process.env.EMBED_WHITELIST || 'github.com,crunchyroll.com,facebook.com').split(',').map(s => s.trim().replace(/^www\./, '')).filter(Boolean);
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      try {
        const resolved = new URL(href, baseHref).toString();
        const linkHost = new URL(resolved).hostname.replace(/^www\./, '');
        const embedParam = EMBED_WHITELIST.includes(linkHost) ? '&embed=1' : '';
        // Preserve fragment separately
        const proxiedHref = `/api/proxy?url=${encodeURIComponent(resolved)}${embedParam}`;
        $(el).attr('href', proxiedHref);
        // Ensure links open in same iframe (not top)
        $(el).attr('target', '_self');
      } catch (e) {
        // ignore invalid URLs
      }
    });

    $('form').each((i, el) => {
      const action = $(el).attr('action') || '';
      try {
        const resolved = new URL(action || '.', baseHref).toString();
        const formHost = new URL(resolved).hostname.replace(/^www\./, '');
        const embedParam = EMBED_WHITELIST.includes(formHost) ? '&embed=1' : '';
        const proxiedAction = `/api/proxy?url=${encodeURIComponent(resolved)}${embedParam}`;
        $(el).attr('action', proxiedAction);
      } catch (e) {
        // ignore
      }
    });

    // Re-serialize after modifications
    proxiedHtml = $.html();
  } catch (e) {
    // ignore rewrite errors
  }

    // Opcional: rewrite relative src/href attributes? base should handle most cases.

    // If framing is explicitly forbidden by the target, inject a small banner explaining fallback
    if (frameDisallowed) {
      $('body').prepend('<div style="background:#ffefc2;color:#5a3e00;padding:8px;text-align:center;font-size:13px;">Este site envia políticas que impedem que seja exibido dentro de frames. Exibindo versão proxied sem scripts.</div>');
    }

      // Enviar HTML modificado como resposta (mesma origem do seu backend)
      res.set('Content-Type', 'text/html; charset=utf-8');
    console.log('[proxy] sending proxied html for', targetUrl, 'allowScripts=', allowScripts);
      res.send(proxiedHtml);
  } catch (error) {
    // Log detalhado para diagnosticar bloqueios (ex.: 403 do Cloudflare, 503, etc.)
    if (error && error.response) {
      try {
        console.error('[proxy] error response status=', error.response.status, 'headers=', error.response.headers);
        // Log a parte inicial do body para análise sem poluir o log
        const snippet = (typeof error.response.data === 'string') ? error.response.data.slice(0, 1000) : JSON.stringify(error.response.data).slice(0, 1000);
        console.error('[proxy] error response body snippet=', snippet);
      } catch (e) {
        console.error('[proxy] error while logging response', e);
      }
      // Retornar um erro claro para o frontend com sugestão
      // Antes de retornar erro, se o host está na whitelist, tentamos um fallback com Puppeteer
      try {
        const host = new URL(targetUrl).hostname.replace(/^www\./, '');
        const EMBED_WHITELIST = (process.env.EMBED_WHITELIST || 'github.com,crunchyroll.com,facebook.com').split(',').map(s => s.trim().replace(/^www\./, '')).filter(Boolean);
        if (EMBED_WHITELIST.includes(host)) {
          console.log('[proxy] attempting puppeteer fallback for', targetUrl);
          try {
            const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36');
            await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
            await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            const content = await page.content();
            await browser.close();
            const $ = cheerioLoad(content);
            // Remove tags de segurança/confusão e injetar base
            $('meta[http-equiv="Content-Security-Policy"]').remove();
            $('meta[http-equiv="X-Frame-Options"]').remove();
            $('meta[http-equiv="refresh"]').remove();
            $('head base').remove();
            const urlObj = new URL(targetUrl);
            const baseHref = `${urlObj.protocol}//${urlObj.host}`;
            $('head').prepend(`<base href="${baseHref}">`);
            let outHtml = $.html();
            outHtml = outHtml.replace(/https?:\/\/localhost:\d+/g, baseHref);
            outHtml = outHtml.replace(/\/@vite/g, '/');
            res.set('Content-Type', 'text/html; charset=utf-8');
            console.log('[proxy] puppeteer fallback served for', targetUrl);
            return res.send(outHtml);
          } catch (puppErr) {
            console.error('[proxy] puppeteer fallback failed:', puppErr && puppErr.stack ? puppErr.stack : puppErr);
            // continue to return the original proxy error below
          }
        }
      } catch (e) {
        console.error('[proxy] error while attempting puppeteer fallback check', e);
      }

      return res.status(502).send(`<h1>Impossível carregar a página (protegida ou bloqueada): ${String(targetUrl)}</h1><p>O site pode estar bloqueando acessos de proxies automatizados. Tente abrir em nova aba.</p>`);
    }

    console.error('Erro no proxy:', error && error.stack ? error.stack : (error && error.toString ? error.toString() : error));
    res.status(500).send(`<h1>Erro ao carregar a página: ${String(targetUrl)}</h1>`);
  }
});

// Endpoint público para o frontend recuperar a whitelist de embed (útil para manter frontend em sincronia)
app.get('/api/embed/whitelist', (req, res) => {
  const EMBED_WHITELIST = (process.env.EMBED_WHITELIST || 'github.com,crunchyroll.com,facebook.com').split(',').map(s => s.trim().replace(/^www\./, '')).filter(Boolean);
  res.json({ ok: true, whitelist: EMBED_WHITELIST });
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
  // Detect headers that forbid framing
  const headers = response.headers || {};
  const csp = (headers['content-security-policy'] || headers['Content-Security-Policy'] || '').toString();
  const xframe = (headers['x-frame-options'] || headers['X-Frame-Options'] || '').toString();
  const frameDisallowed = /frame-ancestors\s+('none'|none)/i.test(csp) || /deny/i.test(xframe) || /sameorigin/i.test(xframe) && (new URL(finalUrl).origin !== (req.protocol + '://' + req.get('host')));
  const frameAllowed = !frameDisallowed;
  console.log('[proxy/info] resolved finalUrl=', finalUrl, 'for target=', targetUrl, 'frameAllowed=', frameAllowed);
  res.json({ ok: true, finalUrl, frameAllowed });
  } catch (error) {
    console.error('Erro no proxy info:', error && error.toString ? error.toString() : error);
    res.status(500).json({ ok: false, message: 'Erro ao consultar destino.' });
  }
});

// Se for executado diretamente (node server.mjs), inicia o listener.
const PORT = process.env.PORT || 3000;
try {
  const isMain = fileURLToPath(import.meta.url) === process.argv[1];
  if (isMain) {
    app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`));
  }
} catch (e) {
  // Ambiente que não suporta fileURLToPath/argv comparações — apenas iniciar de qualquer forma
  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`));
  }
}

export default app;
