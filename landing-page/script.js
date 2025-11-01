// Links dos produtos na Kiwify - Nardoto Automações
const LINKS = {
    // Pacotes de Implementação
    essencial: 'https://pay.kiwify.com.br/nbJiBo4',
    acelerada: 'https://pay.kiwify.com.br/V3cYA1R',
    vip: 'https://pay.kiwify.com.br/5kxogqi',

    // Planos de Assinatura
    mensal: 'https://pay.kiwify.com.br/NtnupLV',
    pro: 'https://pay.kiwify.com.br/NtnupLV',
    vipClube: 'https://pay.kiwify.com.br/O3ax8ZG'
};

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Configurar links dos botões de pacotes
document.querySelectorAll('.package-button').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const packageType = this.getAttribute('data-package');
        const link = LINKS[packageType];

        if (link && !link.includes('SEU-LINK')) {
            window.open(link, '_blank');
        } else {
            alert('Link do produto ainda não configurado. Por favor, adicione seu link da Kiwify no arquivo script.js');
        }
    });
});

// Configurar links dos botões de assinatura
document.querySelectorAll('.subscription-button:not(.kiwify-direct)').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const planType = this.getAttribute('data-plan');
        let link;

        if (planType === 'vip') {
            link = LINKS.vipClube;
        } else {
            link = LINKS[planType];
        }

        if (link && !link.includes('SEU-LINK')) {
            window.open(link, '_blank');
        } else {
            alert('Link do plano ainda não configurado. Por favor, adicione seu link da Kiwify no arquivo script.js');
        }
    });
});

// Animação ao scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Aplicar animação aos cards
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.package-card, .subscription-card, .benefit-card, .faq-item');

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});

// Analytics (opcional - adicione seu código de tracking aqui)
// Exemplo: Google Analytics, Facebook Pixel, etc.

// Countdown Timer (reinicia a cada 72h)
function initCountdown() {
    const countdownKey = 'nardoto-countdown-end';
    let endTime = localStorage.getItem(countdownKey);

    // Se não existe ou já passou, cria novo countdown de 72 horas
    if (!endTime || new Date().getTime() > parseInt(endTime)) {
        endTime = new Date().getTime() + (72 * 60 * 60 * 1000); // 72 horas
        localStorage.setItem(countdownKey, endTime);
    }

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = parseInt(endTime) - now;

        // Se terminou, reinicia
        if (distance < 0) {
            endTime = new Date().getTime() + (72 * 60 * 60 * 1000);
            localStorage.setItem(countdownKey, endTime);
            return updateCountdown();
        }

        // Calcula tempo restante
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Atualiza display
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');

        if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
    }

    // Atualiza a cada segundo
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Inicia countdown quando página carregar
document.addEventListener('DOMContentLoaded', initCountdown);

console.log('🚀 Página de vendas carregada com sucesso!');
console.log('📝 Lembre-se de configurar os links da Kiwify no arquivo script.js');
