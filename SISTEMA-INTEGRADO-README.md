# 🔥 Sistema de Licenças Integrado - Firebase

## ✅ **O QUE FOI FEITO**

O **gerador-pro.html** agora está **100% integrado** com o **Firebase do sistema existente**!

Agora você pode gerar licenças com diferentes tipos (Trial, Mensal, etc.) e elas funcionam **automaticamente** na extensão VEO3 que você já tem.

---

## 🎯 **COMO FUNCIONA**

### **1. Você Gera a Licença**

**URL:** https://nardoto.com.br/geradores/gerador-pro.html

1. Entre com a senha: `veo3admin2024`
2. Escolha o tipo:
   - **Trial** - 7 dias grátis (R$ 0)
   - **Mensal** - 30 dias (R$ 197)
   - **Trimestral** - 90 dias (R$ 497)
   - **Anual** - 365 dias (R$ 1.997)
   - **Vitalícia** - 100 anos (R$ 4.997)
3. Preencha dados do cliente
4. Clique em **"Gerar Licença"**

✅ **A licença é salva automaticamente no Firebase!**

### **2. Cliente Ativa na Extensão**

O cliente usa a extensão existente em:
`C:\Users\tharc\Videos\extenções\VEO3 LOOPLESS - back up-1`

**Como ativar:**
1. Abrir a extensão Chrome
2. Clicar em "Ativar Licença"
3. Preencher:
   - **Chave de licença** (XXXX-XXXX-XXXX-XXXX)
   - **Username** (nome do cliente)
   - **Password** (senha que o cliente escolher)
4. Pronto! ✅

### **3. A Extensão Valida Automaticamente**

A extensão valida com o Firebase e:
- ✅ Verifica se a chave existe
- ✅ Verifica validade (data de expiração)
- ✅ Vincula ao computador (device fingerprint)
- ✅ Permite usar se tudo estiver OK

---

## 🔑 **TIPOS DE LICENÇA**

| Tipo | Duração | Preço | Nome no Firebase |
|------|---------|-------|------------------|
| **Trial** | 7 dias | R$ 0 | "Trial (7 dias)" |
| **Mensal** | 30 dias | R$ 197 | "Mensal" |
| **Trimestral** | 90 dias | R$ 497 | "Trimestral" |
| **Anual** | 365 dias | R$ 1.997 | "Anual" |
| **Vitalícia** | 100 anos | R$ 4.997 | "Vitalícia" |

---

## 📦 **O QUE É SALVO NO FIREBASE**

Quando você gera uma licença, isso é salvo no Firestore:

```javascript
{
  licenseKey: "ABCD-1234-EFGH-5678",
  username: "Nome do Cliente",
  name: "Nome do Cliente",
  email: "cliente@email.com",
  plan: "Mensal",  // Ou Trial, Trimestral, etc
  expiresAt: 1735689600000,  // Timestamp em milliseconds
  status: "active",
  deviceFingerprint: "",  // Preenchido quando cliente ativar
  createdAt: "2024-01-01T00:00:00Z",
  password: "",  // Preenchido quando cliente ativar
  notes: "Nota opcional",
  tag: "Tag opcional"
}
```

---

## 🛠️ **GERENCIAMENTO DE LICENÇAS**

No gerador-pro.html você pode:

### **Suspender Licença**
- Clique em "Suspender"
- A licença fica com `status: "suspended"`
- Cliente não consegue mais usar
- Atualiza no Firebase automaticamente ✅

### **Estender Licença**
- Clique em "Estender"
- Digite quantos dias adicionar
- Atualiza `expiresAt` no Firebase ✅

### **Deletar Licença**
- Clique em "Deletar"
- Remove do Firebase ✅
- Cliente perde acesso imediatamente

---

## 🔄 **COMPATIBILIDADE**

### **Funciona com:**
✅ Extensão VEO3 existente (`VEO3 LOOPLESS - back up-1`)
✅ Firebase existente (projeto: `veo3automator`)
✅ Sistema de device fingerprint
✅ Validação online e offline

### **NÃO afeta:**
❌ Licenças antigas já geradas
❌ Sistema de ativação existente
❌ Código da extensão (não precisa mudar nada!)

---

## 🔥 **FIREBASE CONFIG**

O gerador usa a mesma configuração:

```javascript
{
  projectId: "veo3automator",
  apiKey: "AIzaSyCeh-SnpsmOcpxgJHirM_volJloRuzBzC4",
  databaseURL: "https://firestore.googleapis.com/v1/projects/veo3automator/databases/(default)/documents"
}
```

---

## 📝 **TEMPLATE PARA ENVIAR AO CLIENTE**

```
Olá [NOME],

Sua licença VEO3 Automator foi gerada!

🔑 Chave: XXXX-XXXX-XXXX-XXXX
📦 Plano: [Mensal/Trimestral/Anual/Vitalícia]
⏰ Validade: [30/90/365 dias / Vitalícia]

Para ativar:
1. Instale a extensão Chrome VEO3 Automator
2. Clique no ícone da extensão
3. Clique em "Ativar Licença"
4. Cole a chave acima
5. Crie um username e senha
6. Pronto!

A extensão vai automatizar:
- VEO3 Video Generator
- Whisk Image Generator
- Suno AI Music
- E muito mais!

Dúvidas? Responda este email.

Abraço,
Tharcisio Nardoto
```

---

## ⚠️ **IMPORTANTE**

### **Senhas:**
- **Admin do gerador:** `veo3admin2024` (MUDE ISSO!)
- **Cliente na extensão:** Cliente cria a própria senha na ativação

### **Primeira Ativação:**
- Cliente ativa com chave + username + senha
- Firebase salva o **device fingerprint**
- A partir daí, licença fica vinculada àquele computador

### **Trocar de Computador:**
- Licença não funciona em outro PC
- Você precisa **deletar** a licença antiga e **gerar** uma nova
- Ou limpar o `deviceFingerprint` manualmente no Firebase

---

## 🎉 **ESTÁ PRONTO!**

Agora você tem:
✅ Gerador com 5 tipos de licença
✅ Integrado com Firebase
✅ Compatível com extensão existente
✅ Gerenciamento completo (suspender/estender/deletar)
✅ Sistema privacy-first mantido

**Bora vender licenças! 🚀**

---

## 📞 **Suporte**

**Tharcisio Nardoto**
- Site: https://nardoto.com.br
- WhatsApp: (27) 99913-2594

---

*Integração realizada em: 01/11/2024*
*"Seus dados são seus. Ponto final."*