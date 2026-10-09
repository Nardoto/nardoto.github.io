// Efeitos leves das páginas do Editor e do Studio Lite: itens surgindo ao rolar e prints que inclinam com o mouse.
(function () {
  var calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Itens surgem ao entrar na tela, um pouco depois do vizinho anterior.
  var alvos = document.querySelectorAll(".titulo-secao, .print, .passo, .so, .item, .faq details, .studio, .promessas, .aviso");
  if (!calmo && "IntersectionObserver" in window) {
    var olho = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("visivel");
        olho.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    alvos.forEach(function (el) {
      var irmaos = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty("--atraso", Math.min(irmaos, 6) * 0.08 + "s");
      el.classList.add("revelar");
      olho.observe(el);
    });
  }

  // Prints inclinam de leve na direção do mouse.
  if (calmo) return;
  document.querySelectorAll(".print").forEach(function (p) {
    p.addEventListener("mousemove", function (e) {
      var r = p.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      p.style.setProperty("--ry", (x * 6).toFixed(2) + "deg");
      p.style.setProperty("--rx", (-y * 6).toFixed(2) + "deg");
    });
    p.addEventListener("mouseleave", function () {
      p.style.removeProperty("--rx");
      p.style.removeProperty("--ry");
    });
  });
})();
