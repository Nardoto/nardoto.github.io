document.getElementById('abrirAbas').addEventListener('click', function() {
    const url = document.getElementById('url').value.trim();
    const quantidade = parseInt(document.getElementById('quantidade').value);

    // Validações
    if (!url) {
        alert('Por favor, insira uma URL válida!');
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('A URL deve começar com http:// ou https://');
        return;
    }

    if (quantidade < 1 || quantidade > 20) {
        alert('A quantidade deve estar entre 1 e 20 abas!');
        return;
    }

    // Abre as abas
    for (let i = 0; i < quantidade; i++) {
        chrome.tabs.create({ url: url });
    }

    // Mensagem de sucesso
    const button = document.getElementById('abrirAbas');
    button.textContent = `✓ ${quantidade} abas abertas!`;
    button.style.backgroundColor = '#4CAF50';

    setTimeout(() => {
        button.textContent = 'Abrir Abas';
        button.style.backgroundColor = '#007bff';
    }, 2000);
});

// Permite usar Enter para abrir as abas
document.getElementById('url').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('abrirAbas').click();
    }
});

document.getElementById('quantidade').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('abrirAbas').click();
    }
});
