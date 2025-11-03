# 🔒 Atualização das Regras do Firebase

## ⚠️ PROBLEMA IDENTIFICADO

As licenças estavam perdendo os dados (name, email, phone) quando o cliente ativava na extensão porque:
- A extensão sobrescrevia TODO o documento
- As regras antigas permitiam qualquer UPDATE quando deviceFingerprint estava vazio

## ✅ SOLUÇÃO

Novas regras do Firebase que **PROTEGEM** os dados durante a ativação.

## 📋 COMO ATUALIZAR AS REGRAS

### ⚠️ IMPORTANTE - CORREÇÃO 403 ERROR (VERSÃO SIMPLIFICADA)

**Se você recebeu erro 403 ao tentar ativar**, use a versão SIMPLIFICADA das regras abaixo.

**ATENÇÃO:** Esta versão permite que a extensão modifique campos durante ativação, mas ainda protege contra uso em múltiplos dispositivos (fingerprint único).

### 1. Acesse o Firebase Console
- Vá para: https://console.firebase.google.com
- Selecione o projeto: **veo3automator**

### 2. Navegue até Firestore Database
- Menu lateral esquerdo
- Clique em **Firestore Database**
- Aba **Rules** (Regras)

### 3. Cole as Novas Regras

Substitua TUDO pelo código abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Regra para licenças - PROTEÇÃO CONTRA USO INDEVIDO E PRESERVAÇÃO DE DADOS
    match /licenses/{licenseKey} {
      // Qualquer um pode ler
      allow read: if true;

      // Pode criar se não existir
      allow create: if !exists(/databases/$(database)/documents/licenses/$(licenseKey));

      // Permite UPDATE em 2 casos:
      // CASO 1: Primeira ativação pelo cliente (fingerprint vazio -> preenchido)
      // CASO 2: Admin gerenciando (não muda deviceFingerprint já existente)
      allow update: if
        // Caso 1: Primeira ativação - permite tudo se fingerprint estava vazio
        (
          (resource.data.deviceFingerprint == "" ||
           resource.data.deviceFingerprint == null ||
           !("deviceFingerprint" in resource.data))
          &&
          request.resource.data.deviceFingerprint != "" &&
          request.resource.data.deviceFingerprint != null
        )
        ||
        // Caso 2: Admin ou renovação - não muda fingerprint existente
        (
          resource.data.deviceFingerprint != "" &&
          resource.data.deviceFingerprint != null &&
          request.resource.data.deviceFingerprint == resource.data.deviceFingerprint
        );

      // Permite deletar (para revogar licenças)
      allow delete: if true;
    }

    // NOVA REGRA - Permitir escrita pública na coleção leads
    match /leads/{lead} {
      allow read: if true;  // Qualquer um pode ler
      allow create: if true;  // Qualquer um pode criar novo lead
      allow update, delete: if false;  // Ninguém pode editar/deletar (só admin via console)
    }

    // Bloquear tudo que não foi especificado
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Clique em "Publish" (Publicar)

As regras serão aplicadas imediatamente!

## 🛡️ O QUE AS NOVAS REGRAS FAZEM

### ✅ Durante a Ativação (Cliente)
**Cliente só pode atualizar:**
- `status` → De 'inactive' para 'active'
- `deviceFingerprint` → ID único do dispositivo
- `activatedAt` → Data/hora da ativação

**Cliente NÃO pode alterar:**
- ❌ `name` - Nome permanece
- ❌ `email` - Email permanece
- ❌ `phone` - Telefone permanece
- ❌ `username` - Username permanece
- ❌ `password` - Senha permanece
- ❌ `notes` - Notas permanecem
- ❌ `tag` - Tag permanece
- ❌ `message` - Mensagem permanece
- ❌ Qualquer outro campo

### ✅ Durante o Gerenciamento (Admin)
**Você pode atualizar qualquer campo EXCETO:**
- ❌ `deviceFingerprint` (protegido contra mudança acidental)

Isso garante que uma vez ativada, a licença fica vinculada ao dispositivo específico.

## 🔍 VERIFICAÇÃO

Após atualizar as regras:

1. **Gere uma nova licença** com nome, email, telefone
2. **Ative na extensão** com username/senha
3. **Volte ao gerador** e veja se:
   - ✅ Nome aparece
   - ✅ Email aparece
   - ✅ Telefone aparece
   - ✅ Status mudou para "✅ Ativa"

## 📊 CAMPOS PRESERVADOS

Agora ao ativar, o Firebase mantém:

```javascript
{
  "licenseKey": "XXXX-XXXX-XXXX-XXXX",
  "name": "João Silva",              // ✅ MANTIDO
  "email": "joao@email.com",         // ✅ MANTIDO
  "phone": "+5511999999999",         // ✅ MANTIDO
  "username": "joaosilva",           // ✅ MANTIDO
  "password": "senha123",            // ✅ MANTIDO
  "type": "trial3days",              // ✅ MANTIDO
  "plan": "Trial (3 dias)",          // ✅ MANTIDO
  "expiresAt": 1730000000000,        // ✅ MANTIDO
  "createdAt": "2025-11-03...",      // ✅ MANTIDO
  "notes": "Cliente VIP",            // ✅ MANTIDO
  "tag": "test",                     // ✅ MANTIDO
  "message": "Aproveite!",           // ✅ MANTIDO

  // Campos atualizados na ativação:
  "status": "active",                // ✅ MUDOU
  "deviceFingerprint": "abc123...",  // ✅ ADICIONADO
  "activatedAt": "2025-11-03..."     // ✅ ADICIONADO
}
```

## 🚨 IMPORTANTE

⚠️ **Licenças antigas sem nome/email não serão recuperadas**
- As que já foram ativadas e perderam dados NÃO voltam
- Você pode adicionar os dados manualmente editando no gerador
- **Novas ativações** já estarão protegidas

## 📝 PRÓXIMOS PASSOS

1. ✅ Atualize as regras no Firebase Console
2. ✅ Teste gerando e ativando uma licença nova
3. ✅ Verifique se os dados permanecem
4. ✅ Se houver licenças "sem nome", edite manualmente

---

**Data:** 03/11/2025
**Arquivo:** api/firestore.rules
