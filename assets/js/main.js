const t=document.querySelector('[data-nav-toggle]'),n=document.querySelector('[data-nav]');if(t&&n){t.addEventListener('click',()=>{n.classList.toggle('open');t.setAttribute('aria-expanded',String(n.classList.contains('open')));});}


document.addEventListener("DOMContentLoaded", function () {
    const animatedGrids = document.querySelectorAll(".service-grid.js-animate-on-scroll");
    if (!animatedGrids.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("in-view");
                obs.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: "0px 0px -5% 0px"
    });

    animatedGrids.forEach((grid) => observer.observe(grid));
});


document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('[data-faq-item]');
    if (!faqItems.length) return;

    faqItems.forEach((item) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(24px)';
        item.style.transition = 'opacity 0.75s ease, transform 0.75s ease';
    });

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const item = entry.target;
                const siblings = Array.from(document.querySelectorAll('[data-faq-item]'));
                const idx = siblings.indexOf(item);
                const delay = Math.min(idx % 2, 1) * 120;
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, delay);
                obs.unobserve(item);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -8% 0px'
    });

    faqItems.forEach((item) => observer.observe(item));
});

