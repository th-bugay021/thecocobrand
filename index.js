    // Hamburger menu
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav');
 
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mobileNav.classList.toggle('open');
    });
 
    function closeMobileNav() {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
    }
 
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
            closeMobileNav();
        }
    });
    // Sticky header shadow
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 20);
    });

    // Scroll reveal
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.12 });

    reveals.forEach(el => observer.observe(el));

    // 3D tilt on product cards
    document.querySelectorAll('.p-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.05)`;
        });
        card.addEventListener('mouseleave', () => card.style.transform = '');
    });
