# 🔐 CREDENCIAIS MASTER - VEO3 AUTOMATOR
**⚠️ ARQUIVO CONFIDENCIAL - NÃO COMPARTILHAR**

---

## 🌐 URLs IMPORTANTES

### Gerador de Licenças Online
- **URL:** https://nardoto.github.io/veo3-licenses/
- **Senha de Acesso:** [ATUALIZE COM SUA SENHA ATUAL]
- **GitHub Repo:** https://github.com/Nardoto/veo3-licenses

### Firebase Console
- **URL:** https://console.firebase.google.com/project/veo3automator/firestore
- **Login:** Sua conta Google
- **Projeto:** veo3automator

### Google Labs (Para Testes)
- **URL:** https://labs.google/fx/tools/flow/

---

## 🔑 CREDENCIAIS DO SISTEMA

### Firebase Configuration
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCeh-SnpsmOcpxgJHirM_volJloRuzBzC4",
  authDomain: "veo3automator.firebaseapp.com",
  projectId: "veo3automator",
  storageBucket: "veo3automator.firebasestorage.app",
  messagingSenderId: "608381600031",
  appId: "1:608381600031:web:aafb833a80ce9752fa302a",
  measurementId: "G-QPV8SMP117"
};
```

### Senha do Gerador (index.html no GitHub)
- **Linha:** ~510
- **Variável:** `const ADMIN_PASSWORD = 'SUA_SENHA_AQUI';`
- **Como mudar:**
  1. Vá para https://github.com/Nardoto/veo3-licenses
  2. Clique em index.html
  3. Clique no lápis (editar)
  4. Procure ADMIN_PASSWORD
  5. Mude a senha
  6. Commit changes

---

## 📦 ESTRUTURA DA EXTENSÃO

### Pasta Principal
```
C:\Users\tharc\Videos\extenções\VEO3 LOOPLESS - back up-1\
```

### Arquivos Críticos do Sistema de Licenciamento
- `license-system.js` - Lógica principal de validação
- `firebase-api.js` - Comunicação com Firebase
- `device-fingerprint.js` - Geração de fingerprint único
- `license-activation.html` - Tela de ativação
- `license-activation-script.js` - Script da tela de ativação

### Arquivos da Funcionalidade VEO3
- `content.js` - Script principal
- `sidebar.html` - Interface lateral
- `sidebar.css` - Estilos da interface
- `image-automator.js` - Automação de imagens
- `prompt-organizer.js` - Organizador de prompts
- `whisk-automator.js` - Automação Whisk
- `auto-image-loader.js` - Carregador automático
- `find-replace-utils.js` - Utilitários de busca

---

## 💼 WORKFLOW DE VENDAS

### 1. Cliente Compra (Kiwify/Hotmart)
- Recebe notificação de venda
- Email do cliente
- Valor pago

### 2. Gerar Licença
- Acesse: https://nardoto.github.io/veo3-licenses/
- Digite senha de acesso
- Preencha: Nome, Email, Pacote
- Clique "Gerar Licença"
- Clique "Copiar Credenciais"

### 3. Enviar para Cliente
```
📦 Anexo: VEO3-Automator.zip
[Cole as credenciais copiadas]
```

### 4. Cliente Ativa
- Instala extensão
- Abre Google Labs Flow
- Cola credenciais
- Recarrega página
- Pronto!

---

## 🛡️ SEGURANÇA

### Proteções Implementadas
1. ✅ **Device Fingerprint** - Licença vinculada a 1 máquina
2. ✅ **Firebase Rules** - Impede alteração após ativação
3. ✅ **Senha no Gerador** - Só você gera licenças
4. ✅ **HTTPS** - Conexão segura

### O que Cliente NÃO Pode Fazer
- ❌ Usar em múltiplas máquinas
- ❌ Compartilhar licença
- ❌ Alterar dados no Firebase
- ❌ Deletar licenças

### O que Você Pode Fazer
- ✅ Ver todas licenças no Firebase
- ✅ Deletar licenças (revoga acesso)
- ✅ Ver quem ativou e quando
- ✅ Ver fingerprints vinculados

---

## 🔧 MANUTENÇÃO

### Para Revogar Licença
1. Abra Firebase Console
2. Firestore → licenses
3. Encontre a licença
4. Delete o documento
5. Cliente perde acesso imediatamente

### Para Ver Estatísticas
1. Gerador online mostra:
   - Total de licenças
   - Licenças ativas
   - Geradas hoje
2. Firebase Console mostra:
   - Detalhes de cada licença
   - Fingerprints
   - Datas de ativação

### Para Atualizar Extensão
1. Faça as mudanças necessárias
2. Teste localmente
3. Gere novo ZIP
4. Distribua para novos clientes
5. Clientes antigos continuam funcionando

---

## 📊 PRECIFICAÇÃO

### Pacotes Atuais
- **Essencial:** R$ 1.497
- **Acelerada:** R$ 2.997 (recomendado)
- **VIP:** R$ 4.997

### Para Mudar Preços
1. Edite `index.html` no GitHub
2. Procure por `<option value=`
3. Mude os valores e descrições

---

## 🆘 TROUBLESHOOTING

### Cliente não consegue ativar
- Verifique se credenciais estão corretas
- Verifique se licença existe no Firebase
- Peça para limpar cache/storage
- Verifique conexão com internet

### Licença já ativada em outro computador
- Verifique no Firebase o fingerprint
- Se for legítimo, delete a licença
- Gere nova licença para o cliente

### Esqueceu senha do gerador
1. GitHub → veo3-licenses → index.html
2. Edit → procure ADMIN_PASSWORD
3. Veja ou mude a senha

---

## 📞 SUPORTE

### Seu WhatsApp (já configurado na extensão)
- **(27) 99913-2594**
- Link direto: https://wa.me/5527999132594

### Email
- tharcisionardoto@gmail.com

---

## 🎯 CHECKLIST DIÁRIO

- [ ] Verificar vendas no Kiwify/Hotmart
- [ ] Gerar licenças para novos clientes
- [ ] Enviar credenciais + ZIP
- [ ] Verificar ativações no Firebase
- [ ] Responder suporte se necessário

---

## 🚀 COMANDOS ÚTEIS

### Limpar Storage (Console do Chrome)
```javascript
chrome.storage.local.clear().then(() => console.log("✅ Storage limpo!"));
```

### Verificar Licença Atual
```javascript
chrome.storage.local.get('veo3_license_data').then(r => console.log(r));
```

### Forçar Janela de Ativação
```javascript
window.open(chrome.runtime.getURL('license-activation.html'))
```

---

**📅 Última Atualização:** 31/10/2024
**🔥 Status:** Sistema 100% Operacional
**💰 Pronto para Vendas!**