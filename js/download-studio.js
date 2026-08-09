// Botao "Baixar o Studio" — resolve o instalador certo pro sistema de quem acessa.
//
// Como usar no HTML:
//   <a href="<fallback Windows>" data-dl-studio>Baixar o Studio (<span data-dl-os>Windows</span>)</a>
//   <span data-dl-mac-only hidden>...link do Mac Intel...</span>
//
// O href no HTML ja aponta pro instalador Windows, entao o botao funciona mesmo
// se este script nao carregar. Baixar NAO pula o cadastro: o teste de 10 dias e
// ativado dentro do app, logado, com verificacao de dispositivo (activateTrial).
(function () {
  var BASE = 'https://github.com/LoopLess-nardoto/nardoto-studio-releases/releases/latest/download/';
  // navigator.platform esta depreciado e alguns browsers ja mentem nele — olha tambem
  // o userAgentData (Chrome/Edge) e, por ultimo, o proprio userAgent.
  var uaData = navigator.userAgentData;
  var plat = (uaData && uaData.platform) || navigator.platform || '';
  var isMac = /mac/i.test(plat) || /Mac OS X|Macintosh|iPhone|iPad/i.test(navigator.userAgent || '');

  var REPO = 'LoopLess-nardoto/nardoto-studio-releases';

  function apply() {
    var href = BASE + (isMac ? 'NardotoStudio-Setup-mac.dmg' : 'NardotoStudio-Setup.exe');
    document.querySelectorAll('[data-dl-studio]').forEach(function (el) {
      el.href = href;
      // No Mac, /latest/ da 404 quando a ultima release saiu so-Windows.
      // mac-download-link.js troca o href pela release que TEM o .dmg.
      if (isMac) {
        el.setAttribute('data-mac-repo', REPO);
        el.setAttribute('data-mac-asset', 'NardotoStudio-Setup-mac.dmg');
      }
      var os = el.querySelector('[data-dl-os]');
      if (os) os.textContent = isMac ? 'macOS' : 'Windows';
    });
    // Mac Intel precisa do DMG x64 — no Apple Silicon o x64 roda em Rosetta e fica lento.
    document.querySelectorAll('[data-dl-mac-only]').forEach(function (el) {
      el.hidden = !isMac;
    });
    if (isMac && window.nardotoFixMacLinks) window.nardotoFixMacLinks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
