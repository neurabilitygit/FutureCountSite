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

