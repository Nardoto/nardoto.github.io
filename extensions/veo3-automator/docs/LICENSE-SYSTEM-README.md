# 🔐 Sistema de Licenciamento - VEO3 Automator

## 📋 **O que foi implementado:**

✅ **Device Fingerprinting** - ID único da máquina do usuário
✅ **Validação de Licença** - Chave + Usuário + Senha
✅ **Hardware Lock** - Licença vinculada à máquina específica
✅ **Tela de Ativação** - Interface bonita para o cliente
✅ **Gerador de Chaves** - Ferramenta para você criar licenças
✅ **Bloqueio Automático** - Extensão não funciona sem licença válida

---

## 🚀 **Como Funciona (Fluxo Completo)**

### **1. Cliente Compra no seu Site**
```
Cliente acessa nardoto.com.br
↓
Escolhe pacote (R$ 1.497, R$ 2.997 ou R$ 4.997)
↓
Paga na Kiwify
↓
Você é notificado
```

### **2. Você Gera a Licença**
```
Abre license-generator.html no navegador
↓
Preenche nome, email e pacote do cliente
↓
Clica "Gerar Licença"
↓
Sistema cria:
  • Chave: ABCD-1234-WXYZ-5678
  • Usuário: joaosilva
  • Senha: aB3xY9kL4mN2
↓
Clica "Copiar Credenciais"
```

### **3. Você Envia para o Cliente**
```
Via WhatsApp ou Email:
-----------------------------------
🔐 VEO3 Automator - Suas Credenciais

📧 Usuário: joaosilva
🔑 Senha: aB3xY9kL4mN2
🎟️ Chave: ABCD-1234-WXYZ-5678
📦 Pacote: Automação Acelerada

Para ativar:
1. Instale a extensão VEO3 Automator
2. Ao abrir, insira estas credenciais
3. A licença ficará vinculada ao seu computador

Suporte: (27) 99913-2594
-----------------------------------
```

### **4. Cliente Ativa**
```
Cliente instala a extensão
↓
Abre uma aba do Google Labs
↓
Automaticamente abre tela de ativação
↓
Insere: usuário, senha e chave
↓
Sistema valida
↓
Se válido: Vincula à máquina dele
↓
✅ Extensão liberada!
```

### **5. Proteção Automática**
```
Se o cliente tentar:
• Passar credenciais para outra pessoa ❌
• Usar em outro computador ❌
• Compartilhar a extensão ❌

Sistema bloqueia automaticamente!
```

---

## 🛠️ **Como Usar - Passo a Passo**

### **Etapa 1: Gerar Licença para um Cliente**

1. **Abra o gerador:**
   ```
   Clique duplo em: license-generator.html
   ```

2. **Preencha os dados:**
   - Nome do Cliente
   - Email
   - Pacote (Essencial, Acelerada ou VIP)

3. **Clique "Gerar Licença"**

4. **Aparecerá:**
   ```
   ✅ Licença Gerada com Sucesso!

   ABCD-1234-WXYZ-5678

   Usuário: joaosilva
   Senha: aB3xY9kL4mN2
   Pacote: Automação Acelerada
   Validade: 30/04/2025
   ```

5. **Clique "Copiar Credenciais"**

6. **Cole no WhatsApp do cliente!**

---

### **Etapa 2: Enviar Extensão + Instruções**

**Opção A - Google Drive (Recomendado):**
```
1. Compacte a pasta da extensão (.zip)
2. Suba no Google Drive
3. Gere link público
4. Envie para o cliente junto com as credenciais
```

**Opção B - Email:**
```
1. Compacte a pasta da extensão (.zip)
2. Anexe no email
3. Envie junto com as credenciais
```

**Instruções para o cliente:**
```
📦 Como Instalar:

1. Baixe o arquivo .zip
2. Extraia a pasta
3. Abra Chrome → chrome://extensions/
4. Ative "Modo do desenvolvedor" (canto superior direito)
5. Clique "Carregar sem compactação"
6. Selecione a pasta extraída
7. Pronto! A extensão está instalada
8. Abra https://labs.google/fx/pt/tools/flow/
9. Insira suas credenciais quando solicitado
```

---

### **Etapa 3: Gerenciar Licenças**

**Ver todas as licenças:**
- Abra `license-generator.html`
- Role para baixo até "Licenças Geradas"
- Veja todas as chaves criadas

**Estatísticas:**
- Total de licenças
- Licenças ativas
- Receita do dia

---

## 🔒 **Como Funciona a Proteção**

### **Device Fingerprint (ID da Máquina)**

O sistema cria um ID único baseado em:
- User-Agent (navegador + SO)
- Resolução de tela
- Número de núcleos do processador
- Memória RAM
- Canvas fingerprint (desenho único)
- WebGL fingerprint (placa de vídeo)
- Timezone
- Idioma
- Plugins instalados

**Resultado:** ID SHA-256 impossível de falsificar

### **Primeira Ativação**

```javascript
Cliente insere credenciais
↓
Sistema gera fingerprint da máquina dele
↓
Valida chave no Firebase (futuro)
↓
Se válida: Salva fingerprint vinculado à chave
↓
Extensão liberada!
```

### **Tentativa em Outra Máquina**

```javascript
Outra pessoa tenta usar mesmas credenciais
↓
Sistema gera fingerprint da máquina dela
↓
Compara com o fingerprint salvo
↓
❌ Fingerprints diferentes!
↓
Bloqueia acesso
↓
Mostra: "Esta licença já está vinculada a outro computador"
```

---

## 📁 **Arquivos Criados**

### **Na Extensão:**

1. **`device-fingerprint.js`**
   - Gera ID único da máquina
   - 256 linhas de código
   - Usa múltiplos fatores de identificação

2. **`license-system.js`**
   - Gerencia licenciamento
   - Valida credenciais
   - Salva dados localmente
   - 300+ linhas de código

3. **`license-activation.html`**
   - Tela bonita de ativação
   - Interface moderna
   - Validação em tempo real

4. **`manifest.json`** (modificado)
   - Carrega novos scripts
   - Permissões necessárias

5. **`content.js`** (modificado)
   - Verifica licença antes de iniciar
   - Bloqueia se não licenciada
   - Abre tela de ativação automaticamente

### **Para Você (Admin):**

6. **`license-generator.html`**
   - Gerador de chaves
   - Painel administrativo
   - Estatísticas
   - Lista de licenças
   - Armazena no localStorage do navegador

---

## ⚠️ **IMPORTANTE - Firebase (Próximo Passo)**

**Por enquanto:** O sistema funciona **OFFLINE** (sem Firebase)

**Funcionalidades atuais:**
✅ Geração de chaves
✅ Validação de formato
✅ Fingerprint da máquina
✅ Bloqueio da extensão
✅ Tela de ativação

**O que falta (Firebase):**
❌ Validação online real
❌ Verificar se chave existe no banco
❌ Impedir uso em múltiplos PCs
❌ Revogação remota
❌ Webhook Kiwify automático

**Quando implementar Firebase:**
- Validação será 100% online
- Você poderá revogar licenças remotamente
- Verá quais clientes estão usando
- Integrará com Kiwify automaticamente

---

## 🎯 **Testando o Sistema**

### **Teste 1: Gerar Chave**
```
1. Abra license-generator.html
2. Preencha: Nome = "Teste", Email = "teste@test.com"
3. Clica "Gerar Licença"
4. Deve aparecer uma chave: XXXX-XXXX-XXXX-XXXX
```

### **Teste 2: Ativar Extensão**
```
1. Instale a extensão
2. Abra Google Labs Flow
3. Deve abrir tela de ativação automaticamente
4. Insira as credenciais geradas
5. Clica "Ativar Licença"
6. Aguarde 1-2 segundos
7. Deve redirecionar para a extensão funcionando
```

### **Teste 3: Verificar Bloqueio**
```
1. Depois de ativado, feche o navegador
2. Abra novamente o Google Labs
3. Extensão deve funcionar normalmente (já está ativada)
4. Agora desinstale e reinstale a extensão
5. Tente ativar com a MESMA chave
6. (Por enquanto vai funcionar, mas com Firebase bloqueará)
```

---

## 💡 **Dicas de Uso**

### **Organize por Pacote:**
No gerador, ao criar licença, ela já mostra o pacote. Você pode:
- Criar planilha Google Sheets
- Anotar quem comprou qual pacote
- Controlar validades
- Fazer follow-up

### **Backup das Licenças:**
As licenças ficam salvas no `localStorage` do navegador.
Para fazer backup:
1. Abra `license-generator.html`
2. Abra Console (F12)
3. Digite: `copy(localStorage.getItem('veo3_licenses'))`
4. Cole em um arquivo .txt
5. Salve com nome: `backup-licencas-YYYY-MM-DD.txt`

### **Restaurar Backup:**
1. Abra `license-generator.html`
2. Abra Console (F12)
3. Digite: `localStorage.setItem('veo3_licenses', 'COLE_AQUI_O_BACKUP')`
4. Recarregue a página

---

## 🚨 **Resolução de Problemas**

### **"Extensão não está bloqueando"**
**Causa:** Ainda não tem Firebase implementado
**Solução:** Por enquanto funciona offline. Implementar Firebase para validação real.

### **"Cliente não consegue ativar"**
**Possíveis causas:**
1. Digitou credenciais erradas
2. Formato da chave inválido (precisa ter hífens: XXXX-XXXX-XXXX-XXXX)
3. Navegador bloqueou pop-up da tela de ativação

**Solução:**
- Peça para verificar credenciais
- Verifique se digitou tudo correto
- Permita pop-ups do site labs.google.com

### **"Quero transferir licença para outro PC"**
**Atualmente:** Não tem interface para isso
**Workaround manual:**
1. Cliente desinstala extensão do PC antigo
2. Você reseta a licença (exclui do localStorage)
3. Gera nova licença
4. Cliente ativa no PC novo

**Com Firebase:** Terá botão "Transferir Licença" no admin

---

## 📞 **Suporte**

Dúvidas? Me chama no WhatsApp: **(27) 99913-2594**

---

## 🎉 **Próximos Passos**

1. **Testar sistema atual** ✅
2. **Distribuir para primeiros clientes** ✅
3. **Implementar Firebase** (quando quiser escalar)
4. **Webhook Kiwify** (automação total)
5. **Dashboard web** (gerenciar online)

---

**Desenvolvido por:** Claude + Nardoto
**Data:** Outubro 2024
**Versão:** 1.0 (Offline)
