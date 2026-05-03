// ══════════════════════════════════════
//  HAMBURGER MENU
// ══════════════════════════════════════
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

// Close when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
        closeMobileNav();
    }
});

// ══════════════════════════════════════
//  STICKY HEADER SHADOW
// ══════════════════════════════════════
const header = document.getElementById('main-header');

window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
});

// ══════════════════════════════════════
//  SCROLL REVEAL
// ══════════════════════════════════════
const reveals = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.12 });

reveals.forEach(el => revealObserver.observe(el));

// ══════════════════════════════════════
//  3D TILT ON HERO PRODUCT CARDS
//  FIX: restore the card's CSS class-based transform on mouseleave
//  instead of clearing inline style to '' which caused a snap
//  back without transition on rotated cards.
// ══════════════════════════════════════
const cardBaseTransforms = {
    c1: 'rotate(-7deg)',
    c2: 'rotate(5deg)',
    c3: 'rotate(-2deg)',
    c4: 'rotate(8deg)',
};

document.querySelectorAll('.p-card').forEach(card => {
    // Determine which class this card has to restore correct base transform
    const cardClass = ['c1','c2','c3','c4'].find(c => card.classList.contains(c));
    const baseTransform = cardBaseTransforms[cardClass] || '';

    card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        // Combine tilt with the card's base rotation
        card.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.05) ${baseTransform}`;
    });

    card.addEventListener('mouseleave', () => {
        // FIX: restore base transform with a smooth transition
        // instead of clearing to '' which snaps due to keyframe conflict
        card.style.transform = baseTransform;
        // After transition completes, remove inline style so CSS keyframe resumes
        setTimeout(() => {
            card.style.transform = '';
        }, 400);
    });
});

// ══════════════════════════════════════
//  BLOG CARD TOGGLE (MOBILE)
//  FIX: moved from inline onclick to delegated JS event listener.
//  - On desktop: overlay is CSS :hover only, no JS toggle needed.
//  - On mobile: tapping the card opens overlay; tapping the "Read Full
//    Article" link navigates without firing toggleArticle first
//    (stopPropagation on the link handles that — see index.html).
//  - Tapping outside an open card closes it.
//  - Removed the old global toggleArticle() function entirely.
// ══════════════════════════════════════
const blogCards = document.querySelectorAll('.blog-card[data-article]');

blogCards.forEach(card => {
    card.addEventListener('click', (e) => {
        // Only run toggle logic on mobile
        if (window.innerWidth > 768) return;

        // If the click was on the read-more link, let it navigate (stopPropagation
        // on the link itself prevents this handler from firing — but belt-and-braces:)
        if (e.target.closest('.blog-read-btn')) return;

        const isActive = card.classList.contains('active');

        // Close all other open cards first
        blogCards.forEach(c => c.classList.remove('active'));

        // Toggle this one
        if (!isActive) {
            card.classList.add('active');
        }
    });
});

// Close active blog card when tapping outside (mobile)
document.addEventListener('click', (e) => {
    if (window.innerWidth > 768) return;
    if (!e.target.closest('.blog-card')) {
        blogCards.forEach(c => c.classList.remove('active'));
    }
});