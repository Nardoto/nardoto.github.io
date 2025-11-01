# 🚀 Deploy da API de Licenças Privacy-First

## 📋 Pré-requisitos

- Node.js 14+ instalado
- Conta em serviço de hospedagem (Vercel, Netlify, Heroku, etc)
- MongoDB ou PostgreSQL (opcional, para produção)

## 🛠️ Instalação Local

```bash
# Entre na pasta da API
cd api/

# Instale as dependências
npm install

# Crie arquivo .env
echo "ADMIN_KEY=sua_chave_secreta_aqui" > .env

# Rode localmente
npm start

# Ou em modo desenvolvimento
npm run dev
```

## 🌐 Deploy na Vercel (Recomendado)

### 1. Prepare o projeto

Crie `api/vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "license-api.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "license-api.js"
    }
  ]
}
```

### 2. Deploy

```bash
# Instale Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configure variáveis de ambiente
vercel env add ADMIN_KEY
```

## 🔥 Deploy no Netlify Functions

### 1. Converta para Netlify Function

Crie `netlify/functions/license-api.js`:
```javascript
const { createServer } = require('http');
const app = require('../../api/license-api');

exports.handler = async (event, context) => {
  // Converte para formato Netlify
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "API running" })
  };
};
```

### 2. Configure netlify.toml

```toml
[build]
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"
```

## 🐘 Deploy no Heroku

### 1. Adicione Procfile

```
web: node api/license-api.js
```

### 2. Deploy

```bash
# Login no Heroku
heroku login

# Crie app
heroku create veo3-license-api

# Configure variáveis
heroku config:set ADMIN_KEY=sua_chave_secreta

# Deploy
git push heroku main
```

## 🗄️ Configuração do Banco de Dados (Produção)

### MongoDB Atlas (Grátis)

1. Crie conta em mongodb.com/atlas
2. Crie cluster gratuito
3. Adicione connection string ao .env:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/veo3
```

### PostgreSQL (Supabase - Grátis)

1. Crie conta em supabase.com
2. Crie novo projeto
3. Use connection string fornecida:
```
DATABASE_URL=postgresql://user:pass@host/database
```

## 🔐 Segurança

### Variáveis de Ambiente Necessárias

```env
# Chave administrativa para criar licenças
ADMIN_KEY=uma_chave_muito_secreta_123

# URL do banco (opcional para desenvolvimento)
DATABASE_URL=sua_connection_string

# Porta (opcional)
PORT=3000

# Ambiente
NODE_ENV=production
```

### Headers CORS Recomendados

```javascript
app.use(cors({
  origin: [
    'https://nardoto.com.br',
    'chrome-extension://seu_extension_id'
  ],
  credentials: true
}));
```

## 🧪 Testando a API

### Health Check
```bash
curl https://sua-api.vercel.app/api/health
```

### Verificar Licença
```bash
curl -X POST https://sua-api.vercel.app/api/verify-license \
  -H "Content-Type: application/json" \
  -d '{"key":"XXXX-XXXX-XXXX-XXXX"}'
```

### Criar Licença (Admin)
```bash
curl -X POST https://sua-api.vercel.app/api/admin/create-license \
  -H "Content-Type: application/json" \
  -d '{
    "adminKey":"sua_chave_secreta",
    "type":"monthly",
    "email":"cliente@example.com"
  }'
```

## 📊 Monitoramento (Opcional)

### Uptime Robot (Grátis)
- Monitora se API está online
- Envia alertas se cair
- uptimerobot.com

### Better Uptime
- Monitoramento mais detalhado
- Status page pública
- betteruptime.com

## 🔒 Política de Privacidade

**LEMBRE-SE: Este sistema é Privacy-First!**

✅ **PERMITIDO:**
- Salvar chave e email
- Verificar validade
- Retornar status

❌ **NÃO FAZER:**
- Logs de IP
- Analytics
- Rastreamento de uso
- Salvar user-agent
- Contar verificações
- Monitorar horários

## 📞 Suporte

**Tharcisio Nardoto**
- Site: https://nardoto.com.br
- WhatsApp: (27) 99913-2594

---

*"Seus dados são seus. Ponto final."*