# 🔐 Sistema Completo de Licenças - VEO3 Automator Pro

## 📋 Visão Geral

Sistema de autenticação e licenciamento Privacy-First com **3 componentes principais**:

1. **Gerador Admin** (para você criar licenças)
2. **Página de Ativação** (para clientes ativarem)
3. **Extensão Chrome** (para clientes usarem)

---

## 🔄 Fluxo Completo

### 1️⃣ **VOCÊ (Admin) Gera a Licença**

**URL:** https://nardoto.com.br/geradores/gerador-pro.html

1. Entre com a senha: `veo3admin2024`
2. Selecione o tipo de licença (Trial, Mensal, Trimestral, Anual, Vitalícia)
3. Preencha:
   - Nome do cliente
   - Email do cliente
   - Tags (opcional)
   - Notas (opcional)
4. Clique em **"Gerar Licença"**
5. **COPIE A CHAVE** gerada (ex: ABCD-1234-EFGH-5678)
6. **ENVIE PARA O CLIENTE** por email/WhatsApp

---

### 2️⃣ **CLIENTE Ativa a Licença**

**URL:** https://nardoto.com.br/ativar-licenca.html

O cliente acessa essa página e:

1. Preenche o **nome completo**
2. Preenche o **email** (mesmo que você cadastrou)
3. Cola a **chave de licença** que você enviou
4. **Cria uma senha** (mínimo 8 caracteres)
5. **Confirma a senha**
6. Clica em **"Ativar Licença"**

✅ **Licença ativada!** O cliente agora tem:
- Email
- Senha
- Licença ativa

---

### 3️⃣ **CLIENTE Usa a Extensão**

**Como instalar a extensão:**

1. Baixe a pasta `extensions/`
2. Abra Chrome → `chrome://extensions/`
3. Ative **"Modo de desenvolvedor"**
4. Clique em **"Carregar sem compactação"**
5. Selecione a pasta `extensions/`

**Como fazer login:**

1. Clique no ícone da extensão
2. Digite o **email**
3. Digite a **senha** (criada na ativação)
4. Clica em **"Entrar"**

✅ **Logado!** A extensão agora funciona em todos os sites suportados.

---

## 🗂️ Arquivos do Sistema

### **Para o Admin (Você):**
```
geradores/gerador-pro.html    → Gerar licenças
SENHA-ADMIN.md                → Instruções de senha
```

### **Para o Cliente:**
```
ativar-licenca.html           → Ativar licença
extensions/popup-novo.html    → Login na extensão
extensions/popup-novo.js      → Lógica de autenticação
```

### **Sistema Antigo (Firebase):**
```
veo3-licenses/                → Sistema antigo ainda funciona
```

---

## 🔑 Credenciais Necessárias

### **Cliente precisa de 3 coisas:**

| Item | Quando obtém | Usado onde |
|------|-------------|-----------|
| **Chave de Licença** | Enviada por você após compra | Página de ativação |
| **Email** | Cadastrado por você | Ativação + Login na extensão |
| **Senha** | Cliente cria na ativação | Login na extensão |

---

## 📊 Comparação: Sistema Antigo vs Novo

| Aspecto | Sistema Antigo | Sistema Novo |
|---------|----------------|--------------|
| **Autenticação** | Só chave | Email + Senha + Chave |
| **Ativação** | Automática | Cliente ativa com senha |
| **Segurança** | Baixa | Alta |
| **Rastreamento** | Possível | Zero (Privacy-First) |
| **Login Extensão** | Só chave | Email + Senha |

---

## 🛠️ Implementar o Novo Sistema

### **Passo 1: Substituir Popup da Extensão**

```bash
# Renomear arquivos
mv extensions/popup.html extensions/popup-OLD.html
mv extensions/popup.js extensions/popup-OLD.js

# Usar novos arquivos
mv extensions/popup-novo.html extensions/popup.html
mv extensions/popup-novo.js extensions/popup.js
```

### **Passo 2: Atualizar manifest.json**

O manifest já está correto, mas verifique se aponta para `popup.html`:

```json
"action": {
    "default_popup": "popup.html"
}
```

### **Passo 3: Testar Fluxo Completo**

1. ✅ Gere uma licença no admin
2. ✅ Ative no ativar-licenca.html
3. ✅ Faça login na extensão
4. ✅ Teste funcionalidades

---

## 🔒 Privacidade Garantida

### **O que NÃO rastreamos:**
- ❌ Quantas vezes usa as ferramentas
- ❌ Quais prompts você usa
- ❌ Quais sites você visita
- ❌ Horários de uso
- ❌ Quantidade de gerações
- ❌ IPs ou localizações

### **O que salvamos (mínimo necessário):**
- ✅ Email (para login)
- ✅ Senha hash (para validação)
- ✅ Chave de licença
- ✅ Data de expiração
- ✅ Tipo de licença

---

## 🆘 Problemas Comuns

### **Cliente não consegue ativar**
- Verifique se o email está correto
- Confirme que a chave foi gerada no admin
- Teste se a chave tem o formato: XXXX-XXXX-XXXX-XXXX

### **Cliente não consegue fazer login na extensão**
- Confirme que a licença foi ativada primeiro
- Verifique se o email está correto
- A senha é a que o cliente criou (não a do admin!)

### **Licença expirada**
- Use o gerador admin para estender
- Clique em "Estender 30 dias" na licença

---

## 📞 Suporte ao Cliente

**Template de Email para Enviar Chave:**

```
Olá [NOME],

Sua licença VEO3 Automator Pro foi ativada!

🔑 Chave de Licença: XXXX-XXXX-XXXX-XXXX

📝 Próximos passos:
1. Acesse: https://nardoto.com.br/ativar-licenca.html
2. Preencha seus dados
3. Cole a chave acima
4. Crie uma senha de acesso
5. Instale a extensão Chrome
6. Faça login com seu email e senha

💬 Dúvidas? Responda este email.

Abraço,
Tharcisio Nardoto
```

---

## 🚀 Próximas Melhorias

- [ ] Deploy da API para validação online
- [ ] Publicar extensão na Chrome Web Store
- [ ] Sistema de recuperação de senha
- [ ] 2FA (autenticação de dois fatores)
- [ ] Painel administrativo web completo
- [ ] Notificações de renovação por email

---

## 📝 Notas Importantes

1. **MUDE A SENHA DO ADMIN** em `gerador-pro.html` linha 1017
2. Os dados estão salvos localmente (localStorage)
3. Em produção, use banco de dados real (MongoDB/PostgreSQL)
4. A validação de senha é simples - para produção, use bcrypt server-side
5. Mantenha backup dos dados do localStorage

---

*Sistema criado em: 01/11/2024*
*Privacy-First: "Seus dados são seus. Ponto final."*