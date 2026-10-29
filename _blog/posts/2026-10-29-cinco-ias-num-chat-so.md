---
title: "Cinco IAs num chat só: o protocolo de cada CLI por dentro"
description: "Como o chat do Nardoto Studio conversa com Claude Code, Codex, agy e Grok pelo CLI de cada um: o protocolo, o que mudou de um para outro e o que quebrou."
date: 2026-10-29
tags: ["agentes", "arquitetura", "claude-code"]
---

O chat do Nardoto Studio não chama a API de nenhum modelo. Ele abre o CLI que a pessoa já instalou e logou (Claude Code, Codex, Antigravity ou Grok) e conversa com ele como um terminal sem tela. Cada um traz ferramentas, sessões e MCP próprios, e o app não reimplementa agente nenhum.

O problema é que não existe "o protocolo dos CLIs". Cada um fala um dialeto, e cada dialeto quebra de um jeito. Este post é o mapa deles e do que me custou tempo. Completa o [post sobre MCP](/blog/chat-de-ia-pilotando-o-app-com-mcp/), que conta o outro lado: a IA pilotando o app.

> **O que o código diz hoje (29/10/2026)**
>
> * Quatro serviços (Claude, Codex, agy e Grok) somam **6.644 linhas**, mais 1.035 nos pools de processo que os mantêm vivos.
> * Eles têm **205 commits** desde 20/01/2026.
> * **49 arquivos de teste** unitário cobrem essas pontes e o que gira em volta: login, atualização e cota.

## Cinco nomes, quatro protocolos

Chegou a haver cinco serviços ao mesmo tempo: Claude Code, Gemini, Codex, agy e Grok. O Gemini CLI saiu do código em 24/07/2026, com 1.447 linhas. O agy é o sucessor dele, e o nome `gemini` guardado numa configuração antiga hoje roda pelo agy. Por isso o título diz cinco IAs e o código tem quatro protocolos.

![Mapa dos quatro CLIs com o processo, o protocolo e o ponto onde entra o MCP de cada um.](fig-mapa-clis.svg "Figura 1. Um chat, quatro dialetos. A coluna do meio é o que muda o código.")

O lado do app é igual para todos: a aba gera um `streamId`, chama o canal IPC `prompt-stream` do CLI, o serviço monta os argumentos e entrega o prompt a um processo vivo, e os eventos voltam até um `result`.

## Processo vivo em vez de processo por mensagem

A primeira versão subia um processo por mensagem. Cada boot refaz autenticação, leitura da sessão e, o que mais pesa, a subida de todos os MCPs. Hoje cada CLI tem um pool: Claude e agy mantêm um processo por aba (o pool do agy é a mesma classe do Claude), o Codex mantém um `app-server` para todas as abas e o Grok mantém um agente por par de modelo e esforço.

![Três linhas comparando o tempo de um turno com processo novo e com processo vivo em Claude, Codex e agy.](fig-processo-vivo.svg "Figura 2. Os números vêm dos comentários de medição no código de cada pool. A métrica difere por linha.")

O preço é que as garantias do processo por turno não viajam junto. Processo morto avisa que morreu. Processo vivo pode estar mudo, com a thread esquecida ou com um turno que ele mesmo começou. Quase todos os bugs abaixo são variações disso.

## Claude Code: JSON nos dois sentidos

O Claude sobe com `--input-format stream-json --output-format stream-json` e `--permission-prompt-tool stdio` [1](https://code.claude.com/docs/en/headless). Cada mensagem é uma linha JSON no stdin. Cada pedido de permissão chega no stdout como `control_request`, e a resposta do card de aprovação volta pelo stdin.

Duas surpresas, achadas olhando o fio e não a documentação:

* **Result que não é fim de turno.** O CLI manda `result` também como confirmação de uma mensagem que ele mesmo injetou, num `--resume` com agente em segundo plano: `num_turns` 0 e texto vazio. Quem fecha o turno ali joga fora o resto, inclusive os pedidos de aprovação. Hoje esse caso é ignorado.
* **Tool result como mensagem user.** O serviço só lia `tool_result` dentro de `stream_event`, mas o CLI o entrega como mensagem `user`. Sem esse `case`, nenhuma ação do Claude mostrava saída no chat.

![Barras com a fração de chamadas de ferramenta que mostram a saída no chat: Claude antes e depois da correção, e Codex.](fig-tool-result.svg "Figura 3. Medi de novo nos históricos locais: de 10 em 1.188 para 97 em 103 chamadas.")

O tool result foi o que mais me ensinou: ninguém reclama de um chat que parece normal. Só apareceu quando contei no histórico, com o Claude quase sem saídas e o Codex com todas. A correção entrou em 19/08/2026.

## Codex: um servidor para todas as abas

O `codex app-server` fala JSON-RPC 2.0 por linha [2](https://www.jsonrpc.org/specification): cada aba é uma `thread` e cada mensagem um `turn/start` [3](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md). O CLI gera o schema dos próprios eventos (`generate-json-schema`), o que acabou com o meu chute sobre o formato das edições de arquivo.

Três coisas doeram:

* **MCP só no app-server.** Em 16/08/2026 provei que o `codex exec` não carrega MCP nenhum, mesmo com o `config.toml` certo. Isso colide com variável de ambiente por turno, porque o servidor é global e fixa o ambiente no boot. Turno com ambiente próprio vai para o `exec` legado.
* **Config lido só no boot.** Ligar um MCP na interface não valia até reabrir o app. Hoje o serviço compara o hash do `config.toml` e reinicia o servidor quando ninguém está em turno.
* **Timeout que não viajou.** O servidor aceitava o `turn/start` e emudecia, e a Promise do IPC ficava pendurada. Agora um vigia dá 3 minutos por toque, e 3 toques sem sinal interrompem a thread (20 se houver ferramenta rodando, para não matar um build longo).

## agy: o prompt entra pelo stdin

O agy começou como `agy --print "<prompt>"`, com o prompt na linha de comando, e o Windows corta essa linha perto de 32 mil caracteres. Hoje, acima de 20 mil, o prompt vai para um arquivo temporário. No processo vivo ele sobe pelo stdin com `--input-format stream-json`, uma linha por turno, e o limite deixa de existir. O mesmo erro já tinha custado 5 de 15 janelas numa live de quase 5 horas no app de cortes.

O agy também mostrou o risco de integrar um CLI que se atualiza sozinho. A versão 1.1.16 trocou a chave `type` por `event` nessa linha, e todo turno virou faixa vermelha. Agora, se o CLI recusa a linha, o serviço refaz o turno uma vez pelo caminho antigo. O `--print-timeout` de 5 minutos encerrava o turno sem avisar, e o chat mostrava o último erro que passou, de uma ferramenta qualquer. O app agora manda 24 horas.

Uma nota minha de maio dizia que o agy não suportava MCP. Hoje o serviço regrava o `mcp_config.json` global antes de cada spawn: a nota envelheceu.

## Grok: o limite dos sete

O Grok usa o ACP, o Agent Client Protocol, JSON-RPC por stdio [4](https://agentclientprotocol.com/): `session/new` por aba e `session/prompt` por mensagem. Em 18/09/2026 um "oi" levava de 30 a 66 segundos. A causa, medida: o Grok sobe todos os MCPs de todas as configurações, e com mais de uns 7 servidores stdio juntos o handshake de todos trava até o tempo limite. Com 7 foi 1,1 s, com 9 foram 70 s. Hoje o construtor não manda extensões stdio, e o mesmo "oi" caiu para 8,6 s.

## Login e atualização: o CLI não é seu

O `claude mcp login` verifica `stdin.isTTY` e sai com erro se recebe pipes, então o login roda num PTY oculto. O link do Codex tem uns 450 caracteres e quebra em 3 linhas no terminal, então o assistente o mostra inteiro, com botão de copiar.

Atualizar também tem armadilha: a máquina tem várias cópias do binário, e `npm install -g` atualizava a que o PATH nunca executa. O app classifica a instalação pelo primeiro caminho resolvido e usa o `<bin> update` embutido, depois de checar se o binário está em uso. Trocar a pasta debaixo de um `app-server` vivo o derrubou com `0xC0000409` em 20/08/2026.

## O turno que ninguém esperava

![Cinco etapas do caminho de um turno e, abaixo de cada uma, a falha que já aconteceu ali.](fig-turno.svg "Figura 4. O caminho de um turno e onde cada falha apareceu.")

O pior bug foi o turno obsoleto. Depois de uma sessão longa com o Codex, troquei para o Claude na mesma conversa e a resposta veio rotulada como Codex. O vigia do Codex disparou "9 min sem sinal" e resolveu a chamada de um turno velho. O código depois do `await` lia as referências globais da aba e fechava o turno novo com o provedor errado. A correção é uma guarda por `streamId` em três pontos do `useCLIChat.ts`. O diagnóstico saiu do histórico: achei 5 pares de pedido e resposta com provedor trocado em 7 dias.

O oposto também acontece: o Claude volta sozinho. Agente em segundo plano e agendamento fazem o CLI responder sem prompt, e meu serviço largava o leitor no fim do turno. Hoje a aba adota esse turno espontâneo.

| CLI | O que quebrou | Causa | Data |
| :--- | :--- | :--- | :--- |
| Claude | Saída das ferramentas sumida | `tool_result` vem como `user` | 19/08/2026 |
| Codex | Chamada pendurada | Servidor aceita o turno e emudece | 11/08/2026 |
| Codex | MCP invisível | Só o app-server carrega MCP | 16/08/2026 |
| agy | Prompt grande falha | Linha de comando corta em 32 mil | 02/10/2026 |
| Grok | Turno de 30 a 66 s | Mais de 7 MCPs stdio | 18/09/2026 |
| Todos | Provedor errado na resposta | Turno obsoleto sem guarda | 09/09/2026 |

## O que eu levaria para qualquer projeto

* **Olhe o fio, não a documentação.** Captura ao vivo achou o `result` vazio e o tool result como `user`.
* **Processo vivo troca um problema por outro.** Ganha-se 4 segundos por turno e perde-se o timeout e a certeza de que a thread existe.
* **Todo `await` precisa saber se ainda é o turno certo.** Resposta atrasada é o jeito mais barato de corromper estado.
* **Bug sem reclamação ainda é bug.** Conte no histórico real.
* **Anote o diagnóstico com o comando que confirma.** Cada item acima virou uma nota com sintoma e causa.

## Referências

1. [Claude Code, executar programaticamente (stream-json)](https://code.claude.com/docs/en/headless)
2. [Especificação JSON-RPC 2.0](https://www.jsonrpc.org/specification)
3. [Codex app-server, README oficial](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md)
4. [Agent Client Protocol](https://agentclientprotocol.com/)
