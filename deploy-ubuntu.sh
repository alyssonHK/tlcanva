#!/bin/bash

# Script de deploy para Ubuntu
# Execute este script no servidor Ubuntu

echo "🚀 Iniciando deploy do TLDraw File Canvas..."

# 1. Atualizar o sistema
echo "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js (se não estiver instalado)
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 3. Instalar PM2 globalmente (para gerenciar processos)
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    sudo npm install -g pm2
fi

# 4. Instalar Nginx (se não estiver instalado)
if ! command -v nginx &> /dev/null; then
    echo "📦 Instalando Nginx..."
    sudo apt install -y nginx
fi

# 5. Criar diretório do projeto
PROJECT_DIR="/var/www/tldraw-file-canvas"
if [ ! -d "$PROJECT_DIR" ]; then
    echo "📁 Criando diretório do projeto..."
    sudo mkdir -p $PROJECT_DIR
    sudo chown $USER:$USER $PROJECT_DIR
fi

echo "✅ Dependências instaladas!"
echo ""
echo "📋 Próximos passos manuais:"
echo "1. Faça upload dos arquivos do projeto para: $PROJECT_DIR"
echo "2. Configure o arquivo .env.production com suas variáveis"
echo "3. Execute: cd $PROJECT_DIR && npm install"
echo "4. Execute: npm run build"
echo "5. Execute: pm2 start server.mjs --name tldraw-api"
echo "6. Configure o Nginx (veja o arquivo nginx.conf)"
echo "7. Execute: pm2 save && pm2 startup"
echo ""
echo "🔧 Comandos úteis:"
echo "- Ver logs: pm2 logs tldraw-api"
echo "- Reiniciar: pm2 restart tldraw-api"
echo "- Parar: pm2 stop tldraw-api"
