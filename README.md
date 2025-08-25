<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TLDraw File Canvas 🎨📁

Canvas interativo baseado em TLDraw que permite arrastar e soltar arquivos, visualizá‑los no canvas e organizar visualmente — com autenticação e storage via Supabase e deploy em Vercel.

## ✨ Funcionalidades

- Drag & Drop de arquivos (imagens, vídeos, PDFs, Excel/CSV, texto, áudio) e links.
- Visualização inline via componentes interativos (imagem, vídeo, PDF, texto, Excel/CSV).
- Persistência do layout por usuário no Supabase (`canvases`).
- Uploads no Supabase Storage (bucket `uploads`, path `user.id/<timestamp>-<nome>`).
- Embed seguro de páginas via proxy com whitelist e sanitização.

## 🔐 Autenticação

- Autenticação via Supabase (e‑mail/senha). Não há JWT/bcrypt próprios.
- Frontend usa `@supabase/supabase-js` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

## 🧱 Requisitos

- Node.js 18+
- Conta e projeto no Supabase (Auth + Storage habilitados)

## ⚙️ Configuração de Ambiente

Crie `.env.local` (dev) com as chaves do seu projeto Supabase:

```
VITE_SUPABASE_URL=https://<PROJECT>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>

# Backend (usado pelo server.mjs)
SUPABASE_URL=https://<PROJECT>.supabase.co
SUPABASE_ANON_KEY=<anon-key>

# Domínios permitidos para embed no proxy (opcional)
EMBED_WHITELIST=github.com,crunchyroll.com,facebook.com
```

No Supabase, crie a tabela de layout:

```sql
create table if not exists canvases (
  user_id uuid references auth.users(id) on delete cascade primary key,
  layout_data jsonb not null,
  updated_at timestamp with time zone default now()
);
```

E o bucket de storage `uploads` (público) — o app usa `getPublicUrl` para exibir arquivos.

## 🧑‍💻 Desenvolvimento (Local)

```bash
npm install
npm run dev           # Vite (5173) + backend (3000)
```

- Frontend: http://localhost:5173
- Backend (proxy/upload): http://localhost:3000

## ▲ Deploy na Vercel

1) Configure variáveis de ambiente no projeto Vercel:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- (opcional) `EMBED_WHITELIST`

2) O arquivo `vercel.json` já reescreve:
- `/api/*` e `/uploads/*` para `server.mjs` (função Node)
- demais rotas para `index.html`

3) Build/Output
- Build do frontend: `npm run build` (gera `dist/`)
- A função `server.mjs` roda no runtime Node da Vercel para `/api/*`

Nota: o fallback com `puppeteer` no proxy pode não funcionar no ambiente serverless padrão. Em Vercel, considere manter apenas a versão “sem scripts” (já padrão) ou adaptar para `@sparticuz/chromium` se necessário.

## 🔧 Comandos

```bash
npm run dev       # Frontend + backend local
npm run build     # Build do frontend
npm run preview   # Preview do Vite
npm run lint      # Lint
```

## 📁 Estrutura

```
components/        # UI + shapes TLDraw (FileCard, WebPage, viewers)
contexts/          # AuthContext + supabase client
hooks/             # useFileHandlers (drag&drop, upload, links)
services/          # uploadService (Supabase Storage)
server.mjs         # Express: /api/upload, /api/proxy, /api/proxy/info
utils/             # utilitários (ícones, formatters)
```

## 🔒 CORS & Proxy

- Em produção na Vercel, as chamadas vão para a mesma origem (rewrites), minimizando CORS.
- Em dev, `http://localhost:5173` já está liberado no `server.mjs`.

## 🧹 Notas de Manutenção

- Dependências legadas de JWT/bcrypt foram removidas.
- Porta de dev do backend: `3000` (ajuste seu `.env.local`/scripts se necessário).

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** + TypeScript
- **TLDraw 2.1.4** - Canvas interativo
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **Axios** - Cliente HTTP
- **XLSX.js** - Leitura de planilhas

### Backend
- **Node.js** + Express
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Multer** - Upload de arquivos
- **CORS** - Cross-origin requests

### Deploy
- **PM2** - Gerenciador de processos
- **Nginx** - Proxy reverso
- **Let's Encrypt** - SSL gratuito

## 🔒 Segurança em Produção

1. **Altere o JWT_SECRET** para um valor forte e único
2. **Configure HTTPS** com certificado SSL
3. **Use firewall** (UFW) para proteger portas
4. **Atualize regularmente** as dependências
5. **Monitor logs** com PM2
6. **Backup regular** do arquivo users.json

## 📝 Licença

Este projeto está licenciado sob a licença MIT.

## 🤝 Contribuições

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma [Issue](link-para-issues)
- Consulte a [documentação](link-para-docs)
