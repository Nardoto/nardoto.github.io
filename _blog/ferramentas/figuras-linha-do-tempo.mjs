// Gera as figuras da linha do tempo a partir dos números medidos no git do Studio (29/10/2026).
// Uso: node ferramentas/figuras-linha-do-tempo.mjs (dentro de _blog).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SAIDA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'posts', 'linha-do-tempo-do-nardoto-studio')
fs.mkdirSync(SAIDA, { recursive: true })
const FONTE = `font-family="Inter,'Segoe UI',Arial,sans-serif"`
const cabeca = (h, titulo, aria) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 ${h}" ${FONTE} role="img" aria-labelledby="t">
<title id="t">${aria}</title>
<rect width="1200" height="${h}" rx="18" fill="#141414"/>
<text x="40" y="54" fill="#E85A2A" font-size="16" font-weight="700" letter-spacing="2">${titulo}</text>
`
const gravar = (nome, conteudo) => fs.writeFileSync(path.join(SAIDA, nome), conteudo)

// 1. Commits por mês
{
  const meses = [['dez', 32], ['jan', 169], ['fev', 159], ['mar', 204], ['abr', 54], ['mai', 270], ['jun', 112], ['jul', 198], ['ago', 118], ['set', 208], ['out', 123]]
  const base = 450, esc = 1.15
  let s = cabeca(540, 'COMMITS POR MÊS, DEZ/2025 A OUT/2026', 'Gráfico de barras com os commits por mês, de dezembro de 2025 a outubro de 2026; maio tem o pico com 270')
  s += `<line x1="40" y1="${base}" x2="1160" y2="${base}" stroke="#2A2A2A" stroke-width="2"/>\n`
  meses.forEach(([m, v], i) => {
    const x = 62 + i * 98, h = Math.round(v * esc), pico = m === 'mai'
    s += `<rect x="${x}" y="${base - h}" width="64" height="${h}" rx="8" fill="${pico ? '#E85A2A' : '#7A3419'}"/>`
    s += `<text x="${x + 32}" y="${base - h - 12}" fill="#fff" font-size="20" font-weight="700" text-anchor="middle">${v}</text>`
    s += `<text x="${x + 32}" y="${base + 30}" fill="${pico ? '#fff' : '#B4B9C2'}" font-size="19" ${pico ? 'font-weight="700"' : ''} text-anchor="middle">${m}</text>\n`
  })
  s += `<text x="40" y="510" fill="#9CA3AF" font-size="17">Dezembro começa no dia 20 e outubro vai até o dia 29. Em 27/05 foram 67 commits num dia só.</text>\n</svg>\n`
  gravar('fig-commits-mes.svg', s)
}

// 2. Tipos de commit
{
  const tipos = [['feat (funcionalidade nova)', 672], ['fix (correção)', 533], ['release (versão publicada)', 114], ['docs (documentação)', 97], ['chore (manutenção)', 95], ['outros (merge e afins)', 66], ['refactor (reorganização)', 28], ['perf (desempenho)', 27], ['test (testes)', 15]]
  const esc = 0.78, x0 = 360, linha = 42
  let s = cabeca(100 + tipos.length * linha + 34, 'O QUE OS 1.647 COMMITS FIZERAM', 'Gráfico de barras: 672 commits de funcionalidade, 533 de correção, 114 de release e o resto em menor número')
  tipos.forEach(([nome, n], i) => {
    const y = 96 + i * linha, w = Math.max(10, Math.round(n * esc)), d = i < 2
    s += `<text x="40" y="${y + 20}" fill="${d ? '#fff' : '#B4B9C2'}" font-size="19" ${d ? 'font-weight="700"' : ''}>${nome}</text><rect x="${x0}" y="${y}" width="${w}" height="26" rx="6" fill="${d ? '#E85A2A' : '#7A3419'}"/><text x="${x0 + w + 12}" y="${y + 21}" fill="#fff" font-size="19" font-weight="700">${n}</text>\n`
  })
  gravar('fig-tipos-commits.svg', s + '</svg>\n')
}

// 3. Linha do tempo das versões
{
  const dia0 = Date.UTC(2025, 11, 20), x0 = 70, px = 1060 / 313
  const marcos = [
    ['v3.6', '23/12', 'CapCut Sync Pro', 'Electron + Python', [2025, 11, 23]],
    ['v4.4', '14/02', 'Storyboard e', 'Modo Diretor', [2026, 1, 14]],
    ['v5.5', '09/03', 'Chat com skills', 'e assistentes', [2026, 2, 9]],
    ['v6.0', '02/04', 'Assembler', 'CapCut', [2026, 3, 2]],
    ['v7.0', '10/05', 'Histórico Ctrl+Z', 'e 6 temas', [2026, 4, 10]],
    ['v8.0', '18/06', 'Complementos e', 'Loja de Skills', [2026, 5, 18]],
    ['v9.9', '26/07', 'O chat pilota', 'o Studio', [2026, 6, 26]],
    ['v10.0', '03/09', 'Barra de tarefas', 'e vídeo no chat', [2026, 8, 3]],
    ['v11.0', '09/10', 'Geração de vídeo', 'nova e Lite', [2026, 9, 9]],
    ['v11.2', '26/10', 'Fila e celular', '(Beta)', [2026, 9, 26]],
  ]
  let s = cabeca(470, 'AS VERSÕES QUE MARCARAM O CAMINHO', 'Linha do tempo com dez marcos de versão, da v3.6 em dezembro de 2025 à v11.2 em outubro de 2026')
  s += `<line x1="40" y1="235" x2="1160" y2="235" stroke="#3A3A3A" stroke-width="3"/>\n`
  marcos.forEach(([v, data, l1, l2, [a, m, d]], i) => {
    const x = Math.round(x0 + (Date.UTC(a, m, d) - dia0) / 86400000 * px), cima = i % 2 === 0
    const ya = cima ? 160 : 320
    s += `<line x1="${x}" y1="${cima ? 212 : 235}" x2="${x}" y2="${cima ? 235 : 280}" stroke="#E85A2A" stroke-width="2"/><circle cx="${x}" cy="235" r="9" fill="#E85A2A"/>\n`
    const anc = x < 140 ? 'start' : x > 1080 ? 'end' : 'middle'
    const tx = anc === 'start' ? x - 6 : anc === 'end' ? x + 6 : x
    s += cima
      ? `<text x="${tx}" y="${ya - 32}" fill="#FF8A5C" font-size="22" font-weight="700" text-anchor="${anc}">${v}</text><text x="${tx}" y="${ya - 8}" fill="#9CA3AF" font-size="17" text-anchor="${anc}">${data}</text><text x="${tx}" y="${ya + 16}" fill="#fff" font-size="17" text-anchor="${anc}">${l1}</text><text x="${tx}" y="${ya + 38}" fill="#fff" font-size="17" text-anchor="${anc}">${l2}</text>\n`
      : `<text x="${tx}" y="${ya + 18}" fill="#FF8A5C" font-size="22" font-weight="700" text-anchor="${anc}">${v}</text><text x="${tx}" y="${ya + 42}" fill="#9CA3AF" font-size="17" text-anchor="${anc}">${data}</text><text x="${tx}" y="${ya + 66}" fill="#fff" font-size="17" text-anchor="${anc}">${l1}</text><text x="${tx}" y="${ya + 88}" fill="#fff" font-size="17" text-anchor="${anc}">${l2}</text>\n`
  })
  gravar('fig-versoes.svg', s + '</svg>\n')
}

// 4. Mapa das nove fases
{
  const fases = [
    ['1', 'dez a fev', 'O CapCut Sync Pro', 'vira o Studio', 360, 8],
    ['2', 'mar', 'O chat com IA', 'chega ao app', 204, 10],
    ['3', 'abr', 'Kanban e explorador', 'de arquivos', 54, 10],
    ['4', 'mai', 'Multi-janelas, MCP', 'e histórico', 270, 23],
    ['5', 'jun', 'Complementos, Loja', 'de Skills e Maestro', 112, 10],
    ['6', 'jul', 'O chat pilota', 'o Studio', 198, 11],
    ['7', 'ago', 'O chat vira', 'um time', 118, 11],
    ['8', 'set', 'Nuvem, Drive e o', 'Editor no Studio', 208, 19],
    ['9', 'out', 'Vídeo novo, Lite', 'e celular', 123, 9],
  ]
  let s = cabeca(620, 'NOVE FASES EM DEZ MESES', 'Mapa com as nove fases do projeto, cada uma com o período, o tema, os commits e as versões')
  fases.forEach(([n, per, l1, l2, c, v], i) => {
    const x = 30 + (i % 3) * 385, y = 84 + Math.floor(i / 3) * 172
    s += `<rect x="${x}" y="${y}" width="370" height="156" rx="14" fill="${n === '4' ? '#2A1710' : '#1A1A1A'}"/>`
    s += `<text x="${x + 24}" y="${y + 38}" fill="#E85A2A" font-size="17" font-weight="700" letter-spacing="1.5">FASE ${n} · ${per.toUpperCase()}</text>`
    s += `<text x="${x + 24}" y="${y + 76}" fill="#fff" font-size="22" font-weight="700">${l1}</text><text x="${x + 24}" y="${y + 104}" fill="#fff" font-size="22" font-weight="700">${l2}</text>`
    s += `<text x="${x + 24}" y="${y + 138}" fill="#B4B9C2" font-size="18">${c} commits · ${v} versões</text>\n`
  })
  gravar('fig-fases.svg', s + '</svg>\n')
}
console.log('figuras geradas em', SAIDA)
