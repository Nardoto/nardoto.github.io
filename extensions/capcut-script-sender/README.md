# CapCut Prompt Extractor

Uma extensão simples para extrair prompts de imagens do CapCut e organizá-los para reutilização.

## Como instalar

1. **Baixe os arquivos** da extensão para uma pasta no seu computador
2. **Abra o Chrome** e vá para `chrome://extensions/`
3. **Ative o "Modo do desenvolvedor"** (Developer mode) no canto superior direito
4. **Clique em "Carregar sem compactação"** (Load unpacked)
5. **Selecione a pasta** onde estão os arquivos da extensão
6. **A extensão será instalada** e aparecerá na barra de ferramentas

## Como usar

1. **Abra o CapCut** no navegador (capcut.com)
2. **Clique no ícone da extensão** na barra de ferramentas para abrir o popup
3. **No CapCut, clique no ícone de substituir** de qualquer imagem
4. **A extensão detectará automaticamente** e extrairá o prompt
5. **Os prompts aparecerão** no popup da extensão organizados por data
6. **Use os botões** para:
   - **🔄 Ativar Detecção**: Ativa detecção automática de cliques nos botões de substituir
   - **Copiar Todos**: Copia todos os prompts para a área de transferência
   - **📄 Exportar TXT**: Baixa arquivo TXT com prompts numerados (001:, 002:, etc.)
   - **📋 Exportar JSON**: Baixa arquivo JSON com todos os prompts
   - **Limpar**: Remove todos os prompts salvos
   - **📌 Fixar**: Abre a extensão no painel lateral para uso contínuo

## Funcionalidades

### 🚀 Sistema de Extração Tripla (NOVO!)
- ✅ **Interceptação de Logs** - Captura prompts dos logs do console do CapCut
- ✅ **Interceptação de API** - Captura prompts das requisições de rede em tempo real
- ✅ **Extração Visual** - Fallback que busca prompts no modal visível
- ✅ **Garantia de 100%** - Com 3 camadas, garante que TODOS os prompts sejam capturados

### 📦 Recursos Principais
- ✅ **Extração Automática** - Clique em "Extrair Todos" e deixe a mágica acontecer
- ✅ **Detecção Manual** - Também detecta cliques manuais nos botões
- ✅ **Sem repetições** - Sistema de hash SHA-256 para evitar duplicatas
- ✅ **Formatação TXT** - Exporta com numeração sequencial customizável
- ✅ **Exportação JSON** - Mantém metadados completos
- ✅ **Juntar Arquivos TXT** - Combine múltiplos arquivos de prompts em um só
- ✅ **Filtros Inteligentes** - Remove prompts de teste automaticamente

### 🎨 Interface e Usabilidade
- ✅ Interface simples e intuitiva
- ✅ Organização por data de extração
- ✅ Copiar prompts para área de transferência
- ✅ **Fixar no painel lateral** (Side Panel) para uso contínuo
- ✅ Notificações visuais de sucesso/erro
- ✅ Barra de progresso em tempo real
- ✅ Armazenamento local dos prompts

## Arquivos da extensão

- `manifest.json` - Configuração da extensão
- `popup.html` - Interface do popup
- `popup.js` - Lógica do popup
- `content.js` - Script que roda no CapCut
- `README.md` - Este arquivo de instruções

## Dicas de uso

### 🔄 Extração Automática (Recomendado)
- **Use o botão "Extrair Todos"** para extrair todos os prompts da página automaticamente
- A extensão encontrará todos os elementos de cena e extrairá os prompts sequencialmente
- Você verá o progresso em tempo real no botão
- **Muito mais rápido** que clicar manualmente em cada imagem

### 🖱️ Extração Manual
- A extensão também detecta cliques manuais no **ícone de substituir** da imagem
- Os prompts são extraídos automaticamente quando o modal/popup do CapCut aparece
- Se não conseguir extrair um prompt, tente clicar novamente no ícone de substituir

### 💡 Dicas Gerais
- Os prompts ficam salvos mesmo se você fechar o navegador
- **Use o botão 📌 para fixar no painel lateral** - assim você pode trabalhar no CapCut e ver os prompts ao mesmo tempo
- O painel lateral fica sempre visível enquanto você navega no CapCut
- A extensão funciona melhor em páginas do CapCut com elementos de cena carregados

## Solução de problemas

**A extensão não está extraindo prompts:**
- Verifique se está no site correto (capcut.com)
- Recarregue a página do CapCut (F5) para ativar os interceptadores
- Abra o DevTools (F12) e verifique se vê mensagens `✅` ou `🔍` no console
- Tente clicar em "Extrair Todos" em vez de extração manual

**Alguns prompts não são capturados:**
- A extensão possui sistema de retry automático (2 tentativas por cena)
- Verifique sua conexão de internet
- Se persistir, recarregue a extensão em `chrome://extensions/`

**Prompts aparecem duplicados:**
- Não deve acontecer! A extensão usa hash SHA-256 para evitar duplicatas
- Se acontecer, reporte com os logs do console (F12)

**Erro ao instalar:**
- Certifique-se de que o "Modo do desenvolvedor" está ativado
- Verifique se todos os arquivos estão na mesma pasta
- Certifique-se de que os ícones PNG estão na pasta `icons/`
- Tente recarregar a extensão

## Arquivos Técnicos

- [MELHORIAS_EXTRACAO.md](MELHORIAS_EXTRACAO.md) - Documentação técnica detalhada das melhorias
- [COMO_CRIAR_ICONES.md](COMO_CRIAR_ICONES.md) - Como gerar ícones para a extensão

## Versão

**Atual**: 1.1 (Outubro 2025)
- Sistema de extração tripla
- Interceptação de logs e API
- Filtros inteligentes
- Interface melhorada com progresso em tempo real
