# 🔥 CONFIGURAR FIREBASE - 2 MINUTOS

## ⚠️ Problema
Cadastro dando erro 403 - Firebase bloqueando escrita na coleção "leads"

## ✅ Solução em 4 CLIQUES:

### 1️⃣ Abrir Firebase Console (CLIQUE AQUI)
**Link direto:** https://console.firebase.google.com/project/veo3-licenses/firestore/rules

### 2️⃣ Abrir o arquivo firestore.rules
Está na mesma pasta deste arquivo (`firestore.rules`)
- Abra ele
- **Copie TODO o conteúdo** (Ctrl+A depois Ctrl+C)

### 3️⃣ Colar no Firebase
- Cole o conteúdo copiado na caixa de texto do Firebase
- **Substitua TUDO** que está lá por esse novo código

### 4️⃣ Publicar
- Clique no botão azul **Publicar** (topo da página)
- Aguarde aparecer "Regras publicadas com sucesso"

---

## ✅ Testar (após publicar)
Acesse: https://nardoto.com.br/cadastro.html
Preencha o formulário - deve funcionar agora!

---

## URLs DO SISTEMA

### Para os CLIENTES preencherem:
- **Página de Cadastro:** https://nardoto.com.br/cadastro.html
- **Subdomínio (depois de configurar CNAME):** https://cadastro.nardoto.com.br

### Para VOCÊ (admin) gerenciar os leads:
- **Painel de Leads:** https://nardoto.com.br/painel-leads.html

**No painel você pode:**
- Ver todos os leads que preencheram o cadastro
- Ver estatísticas (total de leads, novos hoje, ferramenta mais usada)
- Clicar em "🔑 Gerar Trial 3 Dias" para abrir o gerador + copiar email automaticamente
- Clicar em "💬 Abrir WhatsApp" para conversar com o lead
- Clicar em "📋 Copiar Dados" para copiar nome, email e telefone

---

## Depois de Configurar

Aguarde 2-3 minutos após publicar as regras, depois teste o cadastro novamente.

Se ainda der erro, tire um print da tela de regras do Firebase e me mostre.
