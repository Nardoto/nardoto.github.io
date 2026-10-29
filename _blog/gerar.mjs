// Gera o blog estático em ../blog a partir dos Markdown de ./posts.
// Uso: npm run gerar (dentro de _blog). A pasta _blog não é publicada: o
// GitHub Pages ignora pastas que começam com "_".
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import MarkdownIt from 'markdown-it'
import sharp from 'sharp'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const SAIDA = path.join(AQUI, '..', 'blog')
const SITE = 'https://nardoto.com.br'
const AUTOR = 'Tharcisio Nardoto'

const slugify = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.']
const dataBR = d => { const [a, m, dia] = d.split('-'); return `${dia} ${MESES[+m - 1]} ${a}` }

// Markdown com id nos títulos (para o sumário) e links externos em nova aba.
const md = new MarkdownIt({ html: true, linkify: true, typographer: false })
md.renderer.rules.heading_open = (tokens, i, opts, env, self) => {
  const t = tokens[i]
  if (t.tag === 'h2' || t.tag === 'h3') {
    const texto = tokens[i + 1].children.map(c => c.content).join('')
    const id = slugify(texto)
    t.attrSet('id', id)
    if (t.tag === 'h2') env.toc.push({ id, texto })
  }
  return self.renderToken(tokens, i, opts)
}
const linkPadrao = md.renderer.rules.link_open || ((t, i, o, e, s) => s.renderToken(t, i, o))
md.renderer.rules.link_open = (tokens, i, opts, env, self) => {
  const href = tokens[i].attrGet('href') || ''
  if (/^https?:\/\//.test(href) && !href.startsWith(SITE)) {
    tokens[i].attrSet('target', '_blank'); tokens[i].attrSet('rel', 'noopener')
  }
  return linkPadrao(tokens, i, opts, env, self)
}
// Imagem sozinha no parágrafo vira <figure> com legenda (o título do Markdown) e abre ampliada ao clicar.
md.renderer.rules.image = (tokens, i) => {
  const t = tokens[i], src = esc(t.attrGet('src')), legenda = t.attrGet('title')
  const img = `<a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="${esc(t.content)}" loading="lazy"></a>`
  return legenda ? `<figure>${img}<figcaption>${esc(legenda)}</figcaption></figure>` : img
}
const soImagem = (tokens, i) => tokens[i + 1]?.children?.length === 1 && tokens[i + 1].children[0].type === 'image'
md.renderer.rules.paragraph_open = (t, i, o, e, s) => soImagem(t, i) ? '' : s.renderToken(t, i, o)
md.renderer.rules.paragraph_close = (t, i, o, e, s) => soImagem(t, i - 2) ? '' : s.renderToken(t, i, o)

// Frontmatter simples: chave: "texto" | chave: 2026-10-29 | chave: ["a", "b"]
function lerPost(arquivo) {
  const bruto = fs.readFileSync(path.join(AQUI, 'posts', arquivo), 'utf8').replace(/\r\n/g, '\n')
  const m = bruto.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!m) throw new Error(`Sem frontmatter: ${arquivo}`)
  const dados = {}
  for (const linha of m[1].split('\n')) {
    const kv = linha.match(/^(\w+):\s*(.*)$/)
    if (!kv) continue
    const v = kv[2].trim()
    dados[kv[1]] = v.startsWith('[') ? JSON.parse(v) : v.replace(/^"|"$/g, '')
  }
  const slug = arquivo.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '')
  const env = { toc: [] }
  const html = md.render(m[2], env)
  const palavras = m[2].split(/\s+/).filter(Boolean).length
  return { ...dados, tags: dados.tags || [], slug, html, toc: env.toc, minutos: Math.max(1, Math.round(palavras / 200)) }
}

// Capa em SVG gerada do título: sem depender de imagem por post.
function capaSvg(titulo, tag) {
  const linhas = []; let atual = ''
  for (const p of titulo.split(' ')) {
    if ((atual + ' ' + p).trim().length > 26) { linhas.push(atual.trim()); atual = p } else atual += ' ' + p
  }
  linhas.push(atual.trim())
  const ys = linhas.slice(0, 4).map((l, i) => `<text x="80" y="${300 - (linhas.length - 1) * 38 + i * 76}" font-family="DM Serif Display, Georgia, serif" font-size="64" fill="#fff">${esc(l)}</text>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
<defs><radialGradient id="g" cx="85%" cy="0%" r="90%"><stop offset="0" stop-color="#E85A2A" stop-opacity=".55"/><stop offset="1" stop-color="#0A0A0A" stop-opacity="0"/></radialGradient></defs>
<rect width="1200" height="630" fill="#0A0A0A"/><rect width="1200" height="630" fill="url(#g)"/>
<text x="80" y="110" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="4" fill="#E85A2A">${esc((tag || 'nardoto studio').toUpperCase())}</text>
${ys}
<text x="80" y="560" font-family="Inter, Arial, sans-serif" font-size="26" fill="#9CA3AF">nardoto.com.br/blog</text></svg>`
}

const CSS = `
:root{--primary:#E85A2A;--primary-light:#F07040;--bg:#0A0A0A;--bg-alt:#111;--card:#141414;--card-2:#1A1A1A;--txt:#fff;--txt2:#B4B9C2;--muted:#6B7280}
*{box-sizing:border-box}html{scroll-padding-top:90px}
body{margin:0;background:var(--bg);color:var(--txt);font:16px/1.7 Inter,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}.wrap{max-width:1200px;margin:0 auto;padding:0 24px}
.serif{font-family:'DM Serif Display',serif;font-weight:400}
header.topo{position:sticky;top:0;z-index:10;background:rgba(10,10,10,.85);backdrop-filter:blur(12px)}
header.topo .wrap{display:flex;align-items:center;justify-content:space-between;height:68px}
.marca{display:flex;align-items:center;gap:10px;font-weight:700}.marca img{width:28px;height:28px;border-radius:7px}
.nav{display:flex;gap:26px;font-size:14px;color:var(--txt2)}.nav a:hover,.nav a.on{color:var(--txt)}
.hero{padding:72px 0 40px}.eyebrow{color:var(--primary);font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
.hero h1{font-family:'DM Serif Display',serif;font-weight:400;font-size:clamp(38px,5vw,60px);line-height:1.08;margin:12px 0 14px}
.hero p{color:var(--txt2);font-size:18px;max-width:720px;margin:0}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin:28px 0 0}
.tag{background:var(--card-2);color:var(--txt2);padding:5px 12px;border-radius:999px;font-size:13px}.tag:hover,.tag.on{background:var(--primary);color:#fff}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:24px;padding:24px 0 96px}
.card{background:var(--card);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;transition:.2s}
.card:hover{transform:translateY(-3px);background:var(--card-2)}.card img{width:100%;height:auto;aspect-ratio:1200/630;display:block}
.card .corpo{padding:20px 22px 22px;display:flex;flex-direction:column;gap:8px;flex:1}
.meta{color:var(--muted);font-size:13px}.card h2{font-size:20px;line-height:1.3;margin:0;font-weight:700}
.card p{color:var(--txt2);font-size:15px;margin:0;flex:1}.ler{color:var(--primary);font-weight:600;font-size:14px}
article .cab{padding:56px 0 28px;max-width:860px}
article .cab h1{font-family:'DM Serif Display',serif;font-weight:400;font-size:clamp(34px,4.6vw,54px);line-height:1.1;margin:14px 0}
article .cab .lead{color:var(--txt2);font-size:19px;margin:0 0 18px}
.capa{width:100%;height:auto;max-width:1200px;border-radius:18px;display:block}
.corpo-post{display:grid;grid-template-columns:200px minmax(0,1fr);gap:48px;padding:48px 0 80px}
.prose>*{max-width:760px}.prose>figure,.prose>pre{max-width:none}
.prose figure{margin:36px 0}.prose figure img{width:100%;height:auto;display:block;border-radius:14px}
.prose figcaption{color:var(--muted);font-size:14px;margin-top:10px;max-width:760px}
.prose>a:has(>img){display:block;margin:28px 0}.prose>a>img{width:100%;height:auto;display:block;border-radius:14px}
.toc{position:sticky;top:96px;align-self:start;display:flex;flex-direction:column;gap:8px;font-size:14px}
.toc strong{color:var(--txt);font-size:13px;text-transform:uppercase;letter-spacing:.06em}.toc a{color:var(--muted)}.toc a:hover{color:var(--primary)}
.prose{font-size:17px;color:#E5E7EB}.prose h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:32px;line-height:1.2;margin:48px 0 14px;color:#fff}
.prose h3{font-size:20px;margin:32px 0 8px;color:#fff}.prose p{margin:0 0 18px}.prose a{color:var(--primary-light);text-decoration:underline;text-underline-offset:3px}
.prose ul,.prose ol{padding-left:22px;margin:0 0 18px}.prose li{margin:6px 0}
.prose blockquote{margin:24px 0;padding:18px 22px;background:var(--card);border-radius:12px;color:var(--txt2)}.prose blockquote p:last-child{margin:0}
.prose code{font-family:'JetBrains Mono',Consolas,monospace;font-size:.88em;background:var(--card-2);padding:2px 6px;border-radius:6px}
.prose pre{background:var(--card);padding:18px 20px;border-radius:12px;overflow-x:auto;font-size:14px;line-height:1.55}.prose pre code{background:none;padding:0}
.prose table{width:100%;border-collapse:collapse;margin:24px 0;font-size:15px}.prose th{text-align:left;color:#fff;background:var(--card-2)}
.prose th,.prose td{padding:10px 12px}.prose tr:nth-child(even) td{background:var(--card)}
.prose img{max-width:100%;border-radius:12px}.assina{color:var(--muted);font-size:14px;margin-top:40px}
.relacionados{background:var(--bg-alt);padding:64px 0}.relacionados h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:34px;margin:0}
footer{padding:48px 0;color:var(--muted);font-size:14px}footer .wrap{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}
.prose code{overflow-wrap:anywhere}
@media(max-width:900px){.corpo-post{grid-template-columns:minmax(0,1fr)}.toc{display:none}.nav{gap:16px}}`

const pagina = ({ titulo, descricao, url, imagem, corpo, tipo = 'website', extraHead = '' }) => `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<script>if(!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)){var g=document.createElement('script');g.async=true;g.src='https://www.googletagmanager.com/gtag/js?id=G-WSY9CWHH19';document.head.appendChild(g);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','G-WSY9CWHH19')}</script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(titulo)}</title><meta name="description" content="${esc(descricao)}">
<link rel="canonical" href="${SITE}${url}"><meta property="og:type" content="${tipo}"><meta property="og:url" content="${SITE}${url}">
<meta property="og:title" content="${esc(titulo)}"><meta property="og:description" content="${esc(descricao)}"><meta property="og:image" content="${SITE}${imagem || '/favicon.png'}">
<link rel="icon" type="image/png" href="/favicon.png"><meta name="theme-color" content="#E85A2A">
<link rel="alternate" type="application/rss+xml" title="Blog do Nardoto" href="/blog/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/blog/blog.css">${extraHead}</head><body>
<header class="topo"><div class="wrap"><a class="marca" href="/"><img src="/favicon.png" alt="">Nardoto</a>
<nav class="nav"><a href="/">Apps</a><a href="/studio/">Studio</a><a href="/blog/" class="on">Blog</a></nav></div></header>
${corpo}
<footer><div class="wrap"><span>Blog do Nardoto Studio. Escrito por ${AUTOR}.</span><span><a href="/">nardoto.com.br</a> · <a href="/blog/feed.xml">RSS</a></span></div></footer>
</body></html>`

const card = p => `<a class="card" href="/blog/${p.slug}/"><img src="/blog/${p.slug}/${p.capa}" alt="" loading="lazy" width="1200" height="630">
<div class="corpo"><span class="meta">${dataBR(p.date)} · ${p.minutos} min de leitura</span><h2>${esc(p.title)}</h2><p>${esc(p.description)}</p><span class="ler">Ler artigo &rarr;</span></div></a>`

const escrever = (rel, conteudo) => {
  const destino = path.join(SAIDA, rel)
  fs.mkdirSync(path.dirname(destino), { recursive: true })
  fs.writeFileSync(destino, conteudo)
}

// ---- Geração ----
const posts = fs.readdirSync(path.join(AQUI, 'posts')).filter(f => f.endsWith('.md') && !f.startsWith('_'))
  .map(lerPost).filter(p => p.draft !== 'true').sort((a, b) => b.date.localeCompare(a.date))
const todasTags = [...new Set(posts.flatMap(p => p.tags))].sort()

fs.rmSync(SAIDA, { recursive: true, force: true })
escrever('blog.css', CSS.trim())

// Capa ilustrada (ilustracoes/<slug>.png, feita com IA) vira um JPEG leve de 1200x630, que serve
// ao cartão, ao topo do post e à prévia de compartilhamento. Sem ela, cai na capa SVG do título.
for (const p of posts) {
  const foto = path.join(AQUI, 'ilustracoes', `${p.slug}.png`)
  p.capa = fs.existsSync(foto) ? 'capa.jpg' : 'capa.svg'
  if (p.capa === 'capa.jpg') {
    fs.mkdirSync(path.join(SAIDA, p.slug), { recursive: true })
    await sharp(foto).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(SAIDA, p.slug, 'capa.jpg'))
  }
}

const indice = (titulo, sub, lista, tagAtiva) => `<main class="wrap"><section class="hero"><span class="eyebrow">Blog / Diário de construção</span>
<h1>${titulo}</h1><p>${sub}</p>
<div class="tags"><a class="tag${tagAtiva ? '' : ' on'}" href="/blog/">todos</a>${todasTags.map(t => `<a class="tag${t === tagAtiva ? ' on' : ''}" href="/blog/tags/${slugify(t)}/">${esc(t)}</a>`).join('')}</div></section>
<section class="grid">${lista.map(card).join('')}</section></main>`

const SUB = 'O que eu aprendi construindo o Nardoto Studio com IA: render de vídeo, MCP, agentes, bugs que só aparecem no cliente. Com os números do git e os erros junto.'
escrever('index.html', pagina({ titulo: 'Blog do Nardoto Studio', descricao: SUB, url: '/blog/', corpo: indice('Construindo com IA, <span style="color:var(--primary)">na prática.</span>', SUB, posts) }))

for (const t of todasTags) {
  const lista = posts.filter(p => p.tags.includes(t))
  escrever(`tags/${slugify(t)}/index.html`, pagina({ titulo: `${t} | Blog do Nardoto Studio`, descricao: `Artigos sobre ${t} no blog do Nardoto Studio.`, url: `/blog/tags/${slugify(t)}/`, corpo: indice(`Artigos: ${esc(t)}`, SUB, lista, t) }))
}

for (const p of posts) {
  escrever(`${p.slug}/capa.svg`, capaSvg(p.title, p.tags[0]))
  const assets = path.join(AQUI, 'posts', p.slug) // figuras e prints do post, na pasta com o nome do slug
  if (fs.existsSync(assets)) fs.cpSync(assets, path.join(SAIDA, p.slug), { recursive: true })
  const relacionados = posts.filter(o => o !== p && o.tags.some(t => p.tags.includes(t))).slice(0, 3)
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.date, author: { '@type': 'Person', name: AUTOR }, mainEntityOfPage: `${SITE}/blog/${p.slug}/` })
  const corpo = `<main><article><div class="wrap"><div class="cab"><a class="eyebrow" href="/blog/">Blog / Diário de construção</a>
<h1>${esc(p.title)}</h1><p class="lead">${esc(p.description)}</p>
<div class="meta">${AUTOR} · ${dataBR(p.date)} · ${p.minutos} min de leitura</div>
<div class="tags">${p.tags.map(t => `<a class="tag" href="/blog/tags/${slugify(t)}/">${esc(t)}</a>`).join('')}</div></div>
<img class="capa" src="/blog/${p.slug}/${p.capa}" alt="" width="1200" height="630">
<div class="corpo-post"><nav class="toc"><strong>Neste artigo</strong>${p.toc.map(h => `<a href="#${h.id}">${esc(h.texto)}</a>`).join('')}</nav>
<div class="prose">${p.html}<p class="assina">Escrito por ${AUTOR}, engenheiro civil e criador do <a href="/studio/">Nardoto Studio</a>.</p></div></div></div></article>
${relacionados.length ? `<section class="relacionados"><div class="wrap"><h2>Continue a leitura.</h2><div class="grid" style="padding-bottom:0">${relacionados.map(card).join('')}</div></div></section>` : ''}</main>`
  escrever(`${p.slug}/index.html`, pagina({ titulo: `${p.title} | Blog do Nardoto Studio`, descricao: p.description, url: `/blog/${p.slug}/`, imagem: `/blog/${p.slug}/${p.capa}`, tipo: 'article', corpo, extraHead: `<script type="application/ld+json">${ld}</script>` }))
}

escrever('feed.xml', `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Blog do Nardoto Studio</title><link>${SITE}/blog/</link><description>${esc(SUB)}</description>
${posts.map(p => `<item><title>${esc(p.title)}</title><link>${SITE}/blog/${p.slug}/</link><guid>${SITE}/blog/${p.slug}/</guid><pubDate>${new Date(p.date + 'T12:00:00Z').toUTCString()}</pubDate><description>${esc(p.description)}</description></item>`).join('\n')}
</channel></rss>`)

console.log(`Blog gerado: ${posts.length} post(s), ${todasTags.length} tag(s) em ${SAIDA}`)
