# 🧪 Teste do Sistema de Licenciamento com Firebase

## ✅ O que foi implementado:

1. ✅ Firebase configurado com sucesso
2. ✅ Integração via REST API (compatível com Chrome Extensions)
3. ✅ Validação de licença contra banco de dados online
4. ✅ Bloqueio por device fingerprint (vincula licença ao computador)
5. ✅ Fallback offline (se Firebase falhar, usa validação local)

---

## 🧪 Como Testar:

### **Teste 1: Primeira Ativação (Máquina Principal)**

1. **Recarregue a extensão:**
   - Abra `chrome://extensions`
   - Clique no ícone de **recarregar** (🔄) na extensão VEO3

2. **Limpe dados antigos (IMPORTANTE!):**
   - Abra `https://labs.google/fx/tools/flow/`
   - Pressione **F12** (abre console)
   - Cole e execute:
   ```javascript
   chrome.storage.local.clear().then(() => console.log("✅ Storage limpo!"));
   ```
   - Recarregue a página (F5)

3. **Janela de ativação deve abrir**
   - Se não abrir, force: `window.open(chrome.runtime.getURL('license-activation.html'))`

4. **Gere credenciais de teste:**
   - Abra o gerador de licenças: `C:\Users\tharc\Videos\AUTOMAÇÕES\index.html`
   - Senha: `nardoto2024`
   - Gere uma licença com seu nome

5. **Ative a licença:**
   - Cole usuário, senha e chave na janela de ativação
   - Clique em "Ativar Licença"
   - Aguarde mensagem: "✅ Licença ativada!"

6. **Verifique no console (F12):**
   ```
   🔍 Validando e ativando licença com Firebase:
   ✅ Primeira ativação desta licença - registrando no Firebase
   ✅ Licença registrada no Firebase: XXXX-XXXX-XXXX-XXXX
   ```

7. **Recarregue a página (F5)**
   - Extensão deve funcionar normalmente
   - Botão VEO3 deve aparecer

8. **Verifique no Firebase:**
   - Abra: https://console.firebase.google.com/project/veo3automator/firestore
   - Clique em "Dados"
   - Deve aparecer uma coleção "licenses"
   - Dentro dela, seu documento com a chave da licença
   - Verifique se o `deviceFingerprint` está salvo

---

### **Teste 2: Reativação na Mesma Máquina (Deve Funcionar)**

1. **Limpe storage local:**
   ```javascript
   chrome.storage.local.clear().then(() => console.log("✅ Storage limpo!"));
   ```

2. **Recarregue página (F5)**

3. **Ative novamente com AS MESMAS credenciais**

4. **Deve funcionar!**
   - Console mostrará: "✅ Licença sendo reativada no mesmo dispositivo"

---

### **Teste 3: Tentar Usar em Outra Máquina (Deve Bloquear!)**

⚠️ **Este é o teste mais importante!**

**Opção A - Simulando com perfil diferente do Chrome:**

1. **Abra Chrome em modo Anônimo (Ctrl+Shift+N)**
2. **Instale a extensão no modo anônimo:**
   - chrome://extensions
   - Ative "Permitir no modo anônimo" na extensão VEO3
3. **Tente ativar com as MESMAS credenciais**
4. **DEVE BLOQUEAR:**
   ```
   🚫 Licença já vinculada a outro dispositivo!
   ❌ Esta licença já está ativada em outro computador. Cada licença só funciona em 1 máquina.
   ```

**Opção B - Usando outro computador/notebook:**

1. Envie a extensão para outra máquina (ou peça pro seu testador tentar novamente)
2. Tente ativar com as mesmas credenciais
3. **DEVE BLOQUEAR!**

---

## 📊 O que Verificar no Firebase Console:

1. **Acesse:** https://console.firebase.google.com/project/veo3automator/firestore
2. **Clique em "Dados"**
3. **Deve ver:**
   - Coleção: `licenses`
   - Documento: `[SUA-CHAVE-DE-LICENÇA]`
   - Campos:
     - `licenseKey`: "XXXX-XXXX-XXXX-XXXX"
     - `username`: "seunome"
     - `deviceFingerprint`: "abc123..." (64 caracteres)
     - `plan`: "Automação Acelerada"
     - `expiresAt`: timestamp futuro
     - `status`: "active"
     - `activatedAt`: data/hora da ativação

---

## 🐛 Troubleshooting:

### ❌ "Erro ao conectar com servidor"

**Causa:** Sem internet ou Firebase bloqueado

**Solução:**
1. Verifique conexão com internet
2. Verifique se Firebase Console abre: https://console.firebase.google.com
3. Verifique no console (F12) se há erros de CORS ou permissão

### ❌ "Missing or insufficient permissions"

**Causa:** Regras de segurança do Firebase bloqueando

**Solução:**
1. Abra Firebase Console → Firestore → Regras
2. Verifique se as regras estão corretas (veja FIREBASE-SETUP-GUIDE.md)
3. Clique em "Publicar" novamente

### ❌ Extensão não inicializa após ativar

**Causa:** Página não foi recarregada

**Solução:**
1. Após ativação, SEMPRE recarregue a página (F5)
2. Verifique no console se aparece: "✅ Licença válida! Inicializando extensão..."

---

## ✅ Resultado Esperado:

**Funcionando perfeitamente quando:**

1. ✅ Primeira ativação registra licença no Firebase
2. ✅ Mesma máquina pode reativar quantas vezes quiser
3. ✅ Máquina diferente é BLOQUEADA
4. ✅ Mensagem clara de erro aparece ao tentar usar em outra máquina
5. ✅ Dados aparecem corretamente no Firebase Console

---

## 🎉 Próximos Passos (Após Testar):

1. **Se funcionar:** Distribua para clientes!
2. **Monitoramento:** Acompanhe licenças ativas no Firebase Console
3. **Revogar licença:** Delete o documento no Firestore (cliente perde acesso)
4. **Futuro:** Adicionar painel admin para gerenciar licenças online
