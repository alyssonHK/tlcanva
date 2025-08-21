<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TLDraw File Canvas 🎨📁

Um canvas interativo baseado no TLDraw que permite arrastar e soltar arquivos, visualizá-los diretamente no canvas e organizá-los visualmente. Com sistema completo de autenticação JWT.

## ✨ Funcionalidades

### 🎯 Canvas Interativo
- **Drag & Drop** de arquivos de qualquer tipo
- **Visualização inline** de imagens, vídeos, PDFs, Excel, texto e áudio
- **Redimensionamento** e organização visual dos arquivos
- **Cartões interativos** com informações detalhadas

### 📊 Tipos de Arquivo Suportados
- **Imagens**: JPG, PNG, GIF, SVG, WebP
- **Vídeos**: MP4, WebM, OGV  
- **Documentos**: PDF
- **Planilhas**: Excel (.xlsx, .xls), CSV
- **Áudio**: MP3, WAV, OGG
- **Texto**: TXT, JSON, CSV, MD
- **Links**: URLs com embed automático

### 🔐 Sistema de Autenticação
- **Login/Registro** com JWT
- **Autenticação segura** com bcrypt
- **Proteção de rotas** de upload
- **Gerenciamento de sessão** persistente
- **Interface responsiva** de login

### 🛡️ Segurança
- **Tokens JWT** com expiração
- **Hash de senhas** com bcryptjs
- **Middleware de autenticação** para APIs
- **Validação** de entrada de dados
- **CORS** configurado para produção

## 🚀 Instalação e Desenvolvimento

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd tldraw-file-canvas
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure variáveis de ambiente
```bash
cp .env.local.example .env.local
```

Edite o arquivo `.env.local`:
```env
GEMINI_API_KEY=PLACEHOLDER_API_KEY
VITE_BACKEND_URL=http://localhost:3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

### 4. Execute em desenvolvimento
```bash
# Executar frontend e backend simultaneamente
npm run dev

# Ou separadamente:
npm run dev:frontend  # Porta 5173
npm run dev:backend   # Porta 3001
```

### 5. Acesse a aplicação
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api/health

## 🌐 Deploy no Ubuntu Server

### 1. Execute o script de instalação
```bash
# Faça upload do script e torne-o executável
chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh
```

### 2. Configure o projeto
```bash
# Navegue para o diretório
cd /var/www/tldraw-file-canvas

# Instale dependências
npm install --production

# Configure variáveis de ambiente
cp .env.production.example .env.production
nano .env.production
```

### 3. Build da aplicação
```bash
npm run build
```

### 4. Inicie com PM2
```bash
# Usando configuração do ecosystem
pm2 start ecosystem.config.json

# Ou comando direto
pm2 start server.mjs --name tldraw-api

# Salvar configuração para reinicialização automática
pm2 save
pm2 startup
```

### 5. Configure o Nginx
```bash
# Copie a configuração
sudo cp nginx.conf /etc/nginx/sites-available/tldraw-file-canvas

# Habilite o site
sudo ln -s /etc/nginx/sites-available/tldraw-file-canvas /etc/nginx/sites-enabled/

# Teste e recarregue
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Configure SSL (Let's Encrypt)
```bash
# Instale certbot
sudo apt install certbot python3-certbot-nginx

# Obtenha certificado SSL
sudo certbot --nginx -d seu-dominio.com
```

## 🔧 Comandos Úteis

### Desenvolvimento
```bash
npm run dev          # Frontend + Backend
npm run dev:frontend # Apenas frontend  
npm run dev:backend  # Apenas backend
npm run build        # Build para produção
npm run lint         # Verificar código
```

### Produção (PM2)
```bash
pm2 list             # Listar processos
pm2 logs tldraw-api  # Ver logs
pm2 restart tldraw-api # Reiniciar
pm2 stop tldraw-api  # Parar
pm2 delete tldraw-api # Remover
```

## 📁 Estrutura do Projeto

```
tldraw-file-canvas/
├── components/           # Componentes React
│   ├── auth/            # Componentes de autenticação
│   ├── Canvas.tsx       # Canvas principal
│   ├── FileCard.tsx     # Cartão de arquivo
│   └── Header.tsx       # Cabeçalho com usuário
├── contexts/            # Contextos React
│   └── AuthContext.tsx  # Contexto de autenticação
├── hooks/               # Hooks personalizados
│   └── useFileHandlers.ts # Lógica de arquivo
├── services/            # Serviços
│   └── uploadService.ts # Upload de arquivos
├── utils/               # Utilitários
│   └── files.ts         # Manipulação de arquivos
├── server.mjs           # Servidor Express
├── auth.mjs             # Sistema de autenticação
├── users.json           # Banco de dados de usuários
└── uploads/             # Arquivos enviados
```

## 🔐 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Obter usuário atual
- `POST /api/auth/logout` - Logout

### Upload
- `POST /api/upload` - Upload de arquivo (protegido)

### Sistema  
- `GET /api/health` - Verificação de saúde
- `GET /uploads/:filename` - Servir arquivos

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
