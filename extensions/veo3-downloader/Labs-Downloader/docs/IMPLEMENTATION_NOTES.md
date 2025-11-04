# Notas de Implementação (placeholder)

Este arquivo é um guia de alto nível para implementar a extensão de simulação de cliques no veo3.

- Objetivo: simular cliques de forma controlada para acionar downloads de vídeos.
- Limite: apenas estrutura — não contém código.

Considerações legais e técnicas:
- Respeite os Termos de Serviço do veo3.
- Garantir atraso entre cliques e limites de taxa para evitar bloqueios.
- Adicionar opções de autorização e consentimento do usuário.

Sugestões de próximos passos:
1. Implementar seletores robustos no `src/content.js`.
2. Adicionar sistema de fila e backoff no `src/background.js`.
3. Criar UI mínima em `src/popup.html` para controlar a operação.
4. Escrever testes em `tests/` para simulação e mocking da DOM.