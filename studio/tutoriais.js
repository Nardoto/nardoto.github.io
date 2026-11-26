(() => {
  const textos = {
    pt: {
      menu: 'Tutoriais',
      titulo: 'Veja como usar o Nardoto Studio',
      introducao: 'Escolha uma aula e acompanhe a tela do Studio antes de instalar.',
      catalogo: total => `Ver todas as ${total} aulas`,
      galeria: 'Galeria de aulas',
      assuntos: 'Todos os assuntos',
      filtrar: 'Filtrar por assunto',
      ampliar: titulo => `Ampliar capa de ${titulo}`,
      assistir: 'Assistir à aula',
      voltar: 'Voltar à galeria',
      fechar: 'Fechar',
      anterior: 'Anterior',
      proxima: 'Próxima aula',
      todas: 'Todas as aulas',
      falha: 'O vídeo não carregou. Escolha a aula novamente para tentar outra vez.',
      legenda: 'Português',
      destaques: [
        ['28', 'Produção de vídeo', 'Do Radar ao vídeo pronto'],
        ['26', 'Pesquisa de nichos', 'Como analisar um canal no Radar'],
        ['27', 'Chat com IA', 'Como trabalhar com a IA no chat']
      ]
    },
    en: {
      menu: 'Tutorials',
      titulo: 'See how to use Nardoto Studio',
      introducao: 'Pick a lesson and follow along on screen before you install Studio.',
      catalogo: total => `Browse all ${total} lessons`,
      galeria: 'Lesson gallery',
      assuntos: 'All topics',
      filtrar: 'Filter by topic',
      ampliar: titulo => `Enlarge cover for ${titulo}`,
      assistir: 'Watch lesson',
      voltar: 'Back to gallery',
      fechar: 'Close',
      anterior: 'Previous',
      proxima: 'Next lesson',
      todas: 'All lessons',
      falha: 'The video could not load. Select the lesson again to retry.',
      legenda: 'English',
      destaques: [
        ['28', 'Video production', 'From niche research to a finished video'],
        ['26', 'Niche research', 'How to analyze a channel in Niche Radar'],
        ['27', 'AI chat', 'How to work with AI in chat']
      ]
    }
  };
  const secao = document.getElementById('tutoriais');
  const dialogo = document.getElementById('aula-dialogo');
  const player = document.getElementById('aula-player');
  const fechar = document.getElementById('aula-fechar');
  const anterior = document.getElementById('aula-anterior');
  const proxima = document.getElementById('aula-proxima');
  const listaPlayer = document.getElementById('aula-lista');
  const erro = document.getElementById('aula-erro');
  const catalogo = JSON.parse(document.getElementById('catalogo-tutoriais').textContent);
  const galeria = document.getElementById('galeria-aulas');
  const abrirGaleria = secao.querySelector('.abrir-galeria');
  const filtro = document.getElementById('assunto-aulas');
  const tituloGaleria = document.getElementById('titulo-galeria-aulas');
  const rolagem = galeria.querySelector('.galeria-rolagem');
  const detalhe = galeria.querySelector('.galeria-capa');
  const voltar = document.getElementById('voltar-galeria');
  const verAula = document.getElementById('assistir-capa');
  const fecharGaleria = document.getElementById('fechar-galeria');
  const modelo = document.getElementById('modelo-aula-galeria');
  let origemCapa = null;
  let idioma;
  let indiceAtual = -1;

  function elemento(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto) el.textContent = texto;
    return el;
  }

  function miniatura(aula) {
    const capa = elemento('img');
    capa.alt = '';
    capa.loading = 'lazy';
    capa.decoding = 'async';
    capa.width = 1280;
    capa.height = 720;
    capa.src = aula.capa;
    return capa;
  }

  function cartao(aula, tema, titulo) {
    const botao = elemento('button', 'aula-cartao');
    botao.type = 'button';
    botao.dataset.aula = aula.id;
    const imagem = elemento('span', 'aula-imagem');
    imagem.append(miniatura(aula), elemento('span', 'aula-play'), elemento('span', 'aula-tempo', duracao(aula)));
    botao.append(imagem, elemento('span', 'aula-tema', tema), elemento('strong', 'aula-titulo', titulo));
    return botao;
  }

  function duracao(aula) {
    const minutos = Math.floor(aula.duracao / 60);
    const segundos = Math.floor(aula.duracao % 60).toString().padStart(2, '0');
    return `${minutos}:${segundos}`;
  }

  function montarGaleria() {
    const grade = galeria.querySelector('.galeria-grade');
    const itens = [];
    for (const aula of catalogo[idioma]) {
      if (filtro.value && filtro.value !== aula.grupo) continue;
      const item = modelo.content.firstElementChild.cloneNode(true);
      const ampliar = item.querySelector('.galeria-miniatura');
      ampliar.dataset.capa = aula.id;
      ampliar.setAttribute('aria-label', textos[idioma].ampliar(aula.titulo));
      ampliar.title = ampliar.getAttribute('aria-label');
      ampliar.prepend(miniatura(aula));
      item.querySelector('.aula-tempo').textContent = duracao(aula);
      const reproduzir = item.querySelector('.galeria-reproduzir');
      reproduzir.dataset.aula = aula.id;
      reproduzir.setAttribute('aria-label', textos[idioma].assistir + ' · ' + aula.titulo);
      reproduzir.querySelector('span').textContent = aula.titulo;
      itens.push(item);
    }
    grade.replaceChildren(...itens);
    rolagem.scrollTop = 0;
  }

  function mostrarGrade() {
    detalhe.hidden = true;
    rolagem.hidden = false;
    filtro.hidden = false;
    tituloGaleria.textContent = textos[idioma].galeria;
    if (galeria.open) origemCapa?.focus({ preventScroll: true });
    origemCapa = null;
  }

  function atualizar() {
    idioma = document.documentElement.lang.startsWith('pt') ? 'pt' : 'en';
    const t = textos[idioma];
    const aulas = catalogo[idioma];
    document.querySelector('.nav-tutoriais').textContent = t.menu;
    secao.querySelector('.section-label').textContent = t.menu;
    secao.querySelector('h2').textContent = t.titulo;
    secao.querySelector('.tutoriais-intro').textContent = t.introducao;
    abrirGaleria.textContent = t.catalogo(aulas.length);
    fecharGaleria.setAttribute('aria-label', t.fechar);
    filtro.setAttribute('aria-label', t.filtrar);
    verAula.textContent = t.assistir;
    voltar.textContent = t.voltar;
    mostrarGrade();
    fechar.textContent = t.fechar;
    anterior.textContent = t.anterior;
    proxima.textContent = t.proxima;
    document.getElementById('aula-indice-titulo').textContent = t.todas;
    erro.textContent = t.falha;
    const destaques = t.destaques.map(([id, tema, titulo]) => cartao(aulas.find(a => a.id === id), tema, titulo));
    secao.querySelector('.aulas-destaque').replaceChildren(...destaques);
    const grupos = new Map();
    for (const aula of aulas) {
      if (!grupos.has(aula.grupo)) grupos.set(aula.grupo, []);
      grupos.get(aula.grupo).push(aula);
    }
    const colunas = [];
    for (const [nome, grupo] of grupos) {
      const coluna = elemento('div');
      const lista = elemento('ul');
      for (const aula of grupo) {
        const botao = elemento('button');
        botao.type = 'button';
        botao.dataset.aula = aula.id;
        botao.append(miniatura(aula), elemento('span', '', aula.titulo));
        const item = elemento('li');
        item.append(botao);
        lista.append(item);
      }
      coluna.append(elemento('h3', '', nome), lista);
      colunas.push(coluna);
    }
    listaPlayer.replaceChildren(...colunas);
    filtro.replaceChildren(new Option(t.assuntos, ''), ...Array.from(grupos.keys(), nome => new Option(nome, nome)));
    montarGaleria();
  }

  function liberarVideo() {
    const video = player.querySelector('video');
    if (!video) return;
    video.pause();
    video.removeAttribute('src');
    video.load();
    player.replaceChildren();
  }

  function assistir(indice) {
    const aulas = catalogo[idioma];
    const aula = aulas[indice];
    if (!aula) return;
    if (dialogo.open && indice === indiceAtual && !player.querySelector('video')?.error) return;
    const modoLegenda = player.querySelector('video')?.textTracks[0]?.mode;
    liberarVideo();
    indiceAtual = indice;
    const video = elemento('video');
    video.controls = true;
    video.playsInline = true;
    video.poster = aula.capa;
    video.src = aula.video;
    video.setAttribute('aria-label', aula.titulo);
    const legendas = video.addTextTrack('captions', textos[idioma].legenda, idioma);
    legendas.mode = modoLegenda || 'hidden';
    for (const [inicio, fim, fala] of aula.cues) legendas.addCue(new VTTCue(inicio, fim, fala));
    video.addEventListener('error', () => { if (video.isConnected) erro.hidden = false; });
    erro.hidden = true;
    document.getElementById('aula-titulo-player').textContent = aula.titulo;
    player.replaceChildren(video);
    anterior.disabled = indice === 0;
    proxima.disabled = indice === aulas.length - 1;
    listaPlayer.querySelector('[aria-current]')?.removeAttribute('aria-current');
    const selecionada = listaPlayer.querySelector(`[data-aula="${aula.id}"]`);
    selecionada.setAttribute('aria-current', 'true');
    if (!dialogo.open) dialogo.showModal();
    const limites = listaPlayer.getBoundingClientRect();
    const linha = selecionada.getBoundingClientRect();
    if (linha.top < limites.top || linha.bottom > limites.bottom) {
      listaPlayer.scrollTop += linha.top - limites.top - (limites.height - linha.height) / 2;
    }
    video.play().catch(() => { /* Os controles permitem iniciar manualmente. */ });
  }

  secao.addEventListener('click', event => {
    const botao = event.target.closest('[data-aula]');
    if (botao) assistir(catalogo[idioma].findIndex(aula => aula.id === botao.dataset.aula));
  });
  abrirGaleria.addEventListener('click', evento => {
    if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
    evento.preventDefault();
    galeria.showModal();
  });
  fecharGaleria.addEventListener('click', () => galeria.close());
  filtro.addEventListener('change', montarGaleria);
  galeria.addEventListener('click', evento => {
    const botao = evento.target.closest('[data-capa]');
    if (!botao) return;
    const aula = catalogo[idioma].find(item => item.id === botao.dataset.capa);
    origemCapa = botao;
    tituloGaleria.textContent = aula.titulo;
    detalhe.querySelector('img').src = aula.capa;
    verAula.dataset.aula = aula.id;
    rolagem.hidden = true;
    filtro.hidden = true;
    detalhe.hidden = false;
    voltar.focus({ preventScroll: true });
  });
  voltar.addEventListener('click', mostrarGrade);
  galeria.addEventListener('cancel', evento => {
    if (detalhe.hidden) return;
    evento.preventDefault();
    mostrarGrade();
  });
  galeria.addEventListener('close', () => {
    mostrarGrade();
    if (location.hash === '#galeria-aulas') {
      history.replaceState(null, '', '#tutoriais');
      abrirGaleria.focus({ preventScroll: true });
    }
  });
  anterior.addEventListener('click', () => assistir(indiceAtual - 1));
  proxima.addEventListener('click', () => assistir(indiceAtual + 1));
  fechar.addEventListener('click', () => dialogo.close());
  dialogo.addEventListener('close', () => {
    if (dialogo.open) return;
    liberarVideo();
    indiceAtual = -1;
  });
  atualizar();
  function abrirPeloEndereco() {
    if (location.hash === '#galeria-aulas' && !galeria.open) {
      secao.scrollIntoView({ behavior: 'instant', block: 'start' });
      galeria.showModal();
    }
  }
  abrirPeloEndereco();
  window.addEventListener('hashchange', abrirPeloEndereco);
  document.addEventListener('idioma-studio', atualizar);
})();
