// Resolve o link de download do Mac para a release mais recente que REALMENTE
// tem o .dmg pedido.
//
// Motivo: /releases/latest/download/<asset> aponta sempre para a ultima release
// publicada. Quando sai uma versao so-Windows (v9.11.0/v9.12.0 do Studio), o Mac
// passa a receber 404 na cara do cliente. O chip de versao ate mostrava a tag
// certa, mas o href continuava no /latest/ -- link e texto discordavam.
//
// Uso no HTML (o script se aplica sozinho no DOMContentLoaded):
//   <a data-mac-repo="LoopLess-nardoto/nardoto-studio-releases"
//      data-mac-asset="NardotoStudio-Setup-mac.dmg" href="...fallback...">
//      Mac Apple Silicon <span class="app-version"></span></a>
//
// Se o asset nao existir em nenhuma release (caso dos botoes Mac do Flow, que
// apontavam para um nome de arquivo que nunca foi publicado), o botao some em
// vez de virar 404. Falha de rede/rate limit da API nao esconde nada.
(function () {
  var cache = {};

  function releasesOf(repo) {
    if (!cache[repo]) {
      cache[repo] = fetch('https://api.github.com/repos/' + repo + '/releases?per_page=100')
        .then(function (r) { return r.json(); })
        .then(function (rels) {
          if (!Array.isArray(rels)) return null;
          // A API ordena por created_at; em repos populados em massa isso mente.
          // published_at e a data real da publicacao.
          return rels.slice().sort(function (a, b) {
            return new Date(b.published_at || 0) - new Date(a.published_at || 0);
          });
        })
        .catch(function () { return null; });
    }
    return cache[repo];
  }

  // Retorna {tag, url} da release mais nova que tem o asset, null se nao existe
  // em nenhuma, ou undefined se a API falhou (nesse caso nao mexemos no botao).
  window.nardotoMacRelease = function (repo, asset) {
    return releasesOf(repo).then(function (rels) {
      if (!rels) return undefined;
      var rel = rels.find(function (r) {
        return (r.assets || []).some(function (a) { return a.name === asset; });
      });
      if (!rel) return null;
      return {
        tag: rel.tag_name,
        url: 'https://github.com/' + repo + '/releases/download/' + rel.tag_name + '/' + asset
      };
    });
  };

  window.nardotoFixMacLinks = function (root) {
    var nodes = (root || document).querySelectorAll('[data-mac-repo][data-mac-asset]');
    Array.prototype.forEach.call(nodes, function (el) {
      var repo = el.getAttribute('data-mac-repo');
      var asset = el.getAttribute('data-mac-asset');
      window.nardotoMacRelease(repo, asset).then(function (info) {
        if (info === undefined) return;
        if (info === null) { el.style.display = 'none'; return; }
        if (el.tagName === 'A') el.href = info.url;
        var chip = el.querySelector('.app-version');
        if (chip) chip.textContent = info.tag;
        // Blocos de comando (curl) trocam a URL no texto.
        if (el.hasAttribute('data-mac-url-text')) {
          el.textContent = el.textContent.replace(/https:\/\/github\.com\/\S+?\.dmg/, info.url);
        }
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.nardotoFixMacLinks(); });
  } else {
    window.nardotoFixMacLinks();
  }
})();
