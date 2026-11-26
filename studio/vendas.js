  // Carrossel: setas, miniaturas e teclado levam ao vídeo; ao trocar, o vídeo que estava tocando pausa.
  (function () {
    var galeria = document.querySelector(".galeria");
    var filmes = Array.prototype.slice.call(galeria.querySelectorAll(".filme"));
    var fita = document.querySelector(".fita");
    var contador = document.querySelector(".contador");
    var ant = document.querySelector(".seta.ant");
    var prox = document.querySelector(".seta.prox");
    var linkExterno = document.getElementById("filme-youtube");
    var atual = 0, n = filmes.length;
    // Posição de cada vídeo conforme a distância até o do centro (d): vai para o lado, afunda e gira.
    var POSES = [
      { x: 0, z: 0, gira: 0, op: 1, luz: 1 },
      { x: 58, z: -260, gira: 42, op: .75, luz: .55 },
      { x: 92, z: -520, gira: 52, op: .35, luz: .35 },
      { x: 110, z: -700, gira: 58, op: 0, luz: .2 }
    ];

    var miniaturas = filmes.map(function (filme, i) {
      var b = document.createElement("button");
      b.type = "button";
      var capa = filme.querySelector(".player img").cloneNode();
      capa.alt = "";
      var titulo = document.createElement("small");
      titulo.textContent = filme.querySelector(".player").dataset.titulo;
      b.append(capa, titulo);
      b.addEventListener("click", function () { ir(i); });
      fita.appendChild(b);
      return b;
    });

    function marcar(i) {
      if (i !== atual) pararFilme(filmes[atual]);
      atual = i;
      linkExterno.href = filmes[i].querySelector(".player").href;
      miniaturas.forEach(function (b, j) {
        b.classList.toggle("ativo", j === i);
        b.setAttribute("aria-pressed", String(j === i));
      });
      var b = miniaturas[i]; // rola só a fita, sem mexer na página
      fita.scrollTo({ left: b.offsetLeft - (fita.clientWidth - b.offsetWidth) / 2, behavior: "smooth" });
      contador.textContent = (i + 1) + " / " + n;
      filmes.forEach(function (filme, j) {
        var d = ((j - i) % n + n + Math.floor(n / 2)) % n - Math.floor(n / 2); // em loop: o último fica à esquerda do primeiro
        var p = POSES[Math.min(Math.abs(d), POSES.length - 1)], lado = d < 0 ? -1 : 1;
        filme.style.transform = "translateX(" + (lado * p.x) + "%) translateZ(" + p.z + "px) rotateY(" + (-lado * p.gira) + "deg)";
        filme.style.opacity = p.op;
        filme.style.filter = "brightness(" + p.luz + ")";
        filme.style.zIndex = 10 - Math.abs(d);
        filme.style.visibility = p.op ? "visible" : "hidden";
        filme.classList.toggle("ativo", d === 0);
        filme.querySelector(".player").tabIndex = d === 0 ? 0 : -1;
      });
    }

    function ir(i) { marcar((i % n + n) % n); }

    function pararFilme(filme) {
      const video = filme.querySelector("video");
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
        video.remove();
      }
      filme.querySelector("iframe")?.remove();
    }

    const demo = document.querySelector(".hero-player");
    const capaDemo = demo.firstElementChild;
    function pararDemo() {
      if (demo.querySelector("iframe")) demo.replaceChildren(capaDemo);
    }
    document.querySelector(".hero-demo").addEventListener("click", () => pararFilme(filmes[atual]));
    document.getElementById("aula-dialogo").addEventListener("toggle", evento => {
      if (evento.newState === "open") {
        pararFilme(filmes[atual]);
        pararDemo();
      }
    });

    ant.addEventListener("click", function () { ir(atual - 1); });
    prox.addEventListener("click", function () { ir(atual + 1); });
    // Clicar num vídeo do lado traz ele para o centro.
    filmes.forEach(function (filme, i) {
      filme.addEventListener("click", function (evento) {
        if (i !== atual) {
          evento.preventDefault();
          ir(i);
          return;
        }
        var link = evento.target.closest(".player");
        if (!link || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
        evento.preventDefault();
        if (filme.querySelector("iframe,video")) return;
        pararDemo();
        const video = document.createElement("video");
        video.controls = true;
        video.playsInline = true;
        video.poster = link.querySelector("img").src;
        video.setAttribute("aria-label", link.dataset.titulo);
        video.addEventListener("error", () => {
          if (!video.isConnected) return;
          video.remove();
          const quadro = document.createElement("iframe");
          quadro.title = link.dataset.titulo;
          quadro.src = "https://www.youtube-nocookie.com/embed/" + link.dataset.yt + "?autoplay=1&playsinline=1&rel=0";
          quadro.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
          quadro.allowFullscreen = true;
          quadro.referrerPolicy = "strict-origin-when-cross-origin";
          filme.append(quadro);
          quadro.focus({ preventScroll: true });
        }, { once: true });
        video.src = link.dataset.filme;
        filme.append(video);
        video.play().catch(() => { /* A reprodução também pode ser iniciada pelos controles. */ });
      });
    });
    // No celular, arrastar o dedo para o lado troca de vídeo.
    var toqueX = null;
    galeria.addEventListener("touchstart", function (e) { toqueX = e.touches[0].clientX; }, { passive: true });
    galeria.addEventListener("touchend", function (e) {
      if (toqueX === null) return;
      var dx = e.changedTouches[0].clientX - toqueX;
      toqueX = null;
      if (Math.abs(dx) > 50) ir(atual + (dx < 0 ? 1 : -1));
    });
    document.getElementById("videos").addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (document.activeElement && document.activeElement.tagName === "VIDEO") return; // no player, a seta avança o vídeo
      var r = galeria.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      e.preventDefault();
      ir(atual + (e.key === "ArrowRight" ? 1 : -1));
    });
    function traduzirControles() {
      var pt = document.documentElement.lang.startsWith("pt");
      ant.setAttribute("aria-label", pt ? "Vídeo anterior" : "Previous video");
      prox.setAttribute("aria-label", pt ? "Próximo vídeo" : "Next video");
    }
    traduzirControles();
    document.addEventListener("idioma-studio", traduzirControles);
    marcar(0);
  })();

  (() => {
    const janela = document.getElementById("tela-ampliada");
    const titulo = janela.querySelector("h2");
    titulo.id = "tela-ampliada-titulo";
    janela.setAttribute("aria-labelledby", titulo.id);
    document.querySelector(".prints-studio").addEventListener("click", evento => {
      const botao = evento.target.closest(".ampliar-tela");
      if (!botao) return;
      titulo.textContent = document.getElementById(botao.getAttribute("aria-labelledby")).textContent;
      janela.querySelector("img").src = botao.querySelector("img").src;
      janela.showModal();
    });
    janela.querySelector("button").addEventListener("click", () => janela.close());
  })();
