# 📋 URLS DO SISTEMA VEO3 AUTOMATOR

## 🔴 AÇÃO NECESSÁRIA AGORA!

**Você precisa configurar o Firebase primeiro, senão o cadastro não funciona!**

👉 Abra o arquivo: [CONFIGURAR-FIREBASE.md](CONFIGURAR-FIREBASE.md)

Leva 2 minutos. Depois volta aqui.

---

## 🎯 PARA CLIENTES (compartilhe estes links)

### Página de Cadastro
- **URL:** https://nardoto.com.br/cadastro.html
- **Quando usar:** Envie este link para clientes interessados preencherem os dados

### Página de Vendas Principal
- **URL:** https://nardoto.com.br/
- **Quando usar:** Link principal com apresentação completa das ferramentas e planos

---

## 👨‍💼 PARA VOCÊ (admin/gerenciamento)

### Painel de Leads
- **URL:** https://nardoto.com.br/painel-leads.html
- **O que faz:**
  - Ver todos os cadastros de clientes interessados
  - Estatísticas: total de leads, novos hoje, ferramenta mais popular
  - Atualiza automaticamente a cada 30 segundos

- **Ações disponíveis em cada lead:**
  - 🔑 **Gerar Trial 3 Dias** → Abre o gerador de licenças + copia email automaticamente
  - 💬 **Abrir WhatsApp** → Abre conversa com mensagem pré-pronta
  - 📋 **Copiar Dados** → Copia nome, email e telefone para área de transferência

### Gerador de Licenças
- **URL:** https://nardoto.com.br/geradores/gerador-pro.html
- **Quando usar:** Após clicar em "Gerar Trial 3 Dias" no painel de leads

---

## 🔄 FLUXO COMPLETO DO SISTEMA

```
1. Cliente preenche: https://nardoto.com.br/cadastro.html
   ↓
2. Dados salvam no Firebase automaticamente
   ↓
3. Cliente é redirecionado para seu WhatsApp
   ↓
4. Você abre: https://nardoto.com.br/painel-leads.html
   ↓
5. Vê o novo lead na lista
   ↓
6. Clica "🔑 Gerar Trial 3 Dias"
   ↓
7. Gerador abre + email já está copiado
   ↓
8. Cola email (Ctrl+V), escolhe "Trial 3 Dias", gera licença
   ↓
9. Envia licença para cliente via WhatsApp
```

---

## 🌐 SUBDOMÍNIO (OPCIONAL)

### Configurar cadastro.nardoto.com.br

**No seu provedor de domínio:**
1. Adicione registro CNAME:
   - Nome: `cadastro`
   - Valor: `nardoto.github.io`

2. Aguarde propagação DNS (30 min a 48h)

3. Depois acesse: https://cadastro.nardoto.com.br

---

## ⚙️ CONFIGURAÇÕES ADICIONAIS

### Firebase Console (para ajustar regras, ver dados)
- https://console.firebase.google.com/project/veo3automator/firestore

### GitHub Pages (para ver status do deploy)
- https://github.com/Nardoto/nardoto.github.io/settings/pages

---

## 🆘 PROBLEMAS?

**Cadastro dando erro 403?**
→ Você não configurou o Firebase ainda! Abra: [CONFIGURAR-FIREBASE.md](CONFIGURAR-FIREBASE.md)

**Mudanças não aparecem no site?**
→ Aguarde 2-3 minutos após git push
→ Limpe cache do navegador (Ctrl+Shift+Delete) ou abra em anônimo

**Painel de leads não mostra nada?**
→ Verifique se já tem cadastros no Firebase
→ Aguarde 30 segundos (auto-refresh)
