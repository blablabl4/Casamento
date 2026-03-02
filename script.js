/* ================================================
   WEDDING LANDING PAGE — JavaScript
   v3: Carousel + Word-by-Word + Glassmorphism
   ================================================ */

(function () {
  'use strict';

  /* ---------- ALL PHOTOS for carousel ---------- */
  const PHOTOS = [
    'Fotos/Capa.jpeg',
    'Fotos/capa principal.jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.09.jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.10.jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.10 (1).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12.jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (1).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (2).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (3).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (4).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (5).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (6).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (7).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (8).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (9).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (10).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (11).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (12).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (14).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (15).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (16).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (17).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (18).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (19).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (20).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (21).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (22).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (23).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (24).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (25).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (26).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (27).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (28).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (29).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (30).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (31).jpeg',
    'Fotos/WhatsApp Image 2026-02-28 at 17.24.12 (32).jpeg',
    'Fotos/confirmação.jpeg',
  ];

  /* ---------- COUNTDOWN ---------- */
  const WEDDING_DATE = new Date('2026-07-18T16:00:00-03:00');

  function updateCountdown() {
    const now = new Date();
    const diff = WEDDING_DATE - now;
    if (diff <= 0) {
      document.getElementById('cd-days').textContent = '0';
      document.getElementById('cd-hours').textContent = '00';
      document.getElementById('cd-minutes').textContent = '00';
      document.getElementById('cd-seconds').textContent = '00';
      return;
    }
    const d = Math.floor(diff / 864e5);
    const h = Math.floor((diff / 36e5) % 24);
    const m = Math.floor((diff / 6e4) % 60);
    const s = Math.floor((diff / 1e3) % 60);
    document.getElementById('cd-days').textContent = String(d);
    document.getElementById('cd-hours').textContent = String(h).padStart(2, '0');
    document.getElementById('cd-minutes').textContent = String(m).padStart(2, '0');
    document.getElementById('cd-seconds').textContent = String(s).padStart(2, '0');
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ============================================
     WORD-BY-WORD REVEAL ANIMATION
     ============================================ */
  function initWordReveal() {
    const elements = document.querySelectorAll('.word-reveal');
    elements.forEach((el) => {
      const text = el.textContent.trim();
      // Clear and rebuild with word spans
      el.innerHTML = '';
      const words = text.split(/\s+/);
      words.forEach((word, i) => {
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = word;
        // Stagger: 45ms between words, slower and more fluid
        span.style.transitionDelay = (i * 0.045) + 's';
        el.appendChild(span);
      });
    });
  }

  initWordReveal();

  /* Word reveal on scroll intersection */
  const wordElements = document.querySelectorAll('.word-reveal');

  const wordObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('words-visible');
          wordObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -30px 0px' }
  );

  wordElements.forEach((el) => wordObserver.observe(el));

  /* ---------- SCROLL REVEAL (blocks) ---------- */
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  /* ---------- NAV ---------- */
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 50);
  });

  document.querySelectorAll('.nav__link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ============================================
     PHOTO CAROUSEL — auto-sliding
     ============================================ */
  const carousel = document.getElementById('photo-carousel');
  let currentSlide = 0;

  // Build slides
  PHOTOS.forEach((src) => {
    const slide = document.createElement('div');
    slide.className = 'carousel__slide';
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';
    slide.appendChild(img);
    carousel.appendChild(slide);
  });

  function goToSlide(index) {
    currentSlide = index;
    carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
  }

  // Auto-advance every 4 seconds
  setInterval(() => {
    const next = (currentSlide + 1) % PHOTOS.length;
    goToSlide(next);
  }, 4000);

  /* ---------- GIFT CARDS ---------- */
  const gifts = [
    { emoji: '🍷', name: 'Cota Jantar Romântico', price: 'R$ 80,00', desc: 'Ajude-nos a celebrar com um jantar inesquecível na lua de mel.' },
    { emoji: '🧱', name: 'Cota Tijolo da Casa Nova', price: 'R$ 50,00', desc: 'Contribua com um tijolinho para a construção do nosso lar.' },
    { emoji: '🍹', name: 'Cota Drink na Lua de Mel', price: 'R$ 35,00', desc: 'Brinde à nossa felicidade com um drink tropical!' },
    { emoji: '🛏️', name: 'Cota Noite no Hotel', price: 'R$ 150,00', desc: 'Presenteie-nos com uma noite especial durante a lua de mel.' },
    { emoji: '✈️', name: 'Cota Passagem Aérea', price: 'R$ 200,00', desc: 'Ajude a tirar os nossos pés do chão — literalmente.' },
    { emoji: '🍰', name: 'Cota Bolo dos Sonhos', price: 'R$ 60,00', desc: 'Contribua para o bolo perfeito do nosso grande dia.' },
    { emoji: '📸', name: 'Cota Fotografia', price: 'R$ 120,00', desc: 'Ajude-nos a eternizar cada momento dessa celebração.' },
    { emoji: '🌺', name: 'Cota Decoração Floral', price: 'R$ 90,00', desc: 'Para que cada cantinho fique florido e cheio de amor.' },
    { emoji: '🎶', name: 'Cota Música ao Vivo', price: 'R$ 100,00', desc: 'Porque toda grande história merece uma trilha sonora.' },
  ];

  const giftsGrid = document.getElementById('gifts-grid');
  gifts.forEach((gift) => {
    const card = document.createElement('div');
    card.className = 'gift-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.innerHTML = `
      <span class="gift-card__emoji">${gift.emoji}</span>
      <h3 class="gift-card__name">${gift.name}</h3>
      <p class="gift-card__price">${gift.price}</p>
    `;
    card.addEventListener('click', () => openGiftModal(gift));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGiftModal(gift); }
    });
    giftsGrid.appendChild(card);
  });

  /* ---------- GIFT MODAL ---------- */
  const giftModal = document.getElementById('gift-modal');

  function openGiftModal(gift) {
    document.getElementById('modal-title').textContent = gift.emoji + ' ' + gift.name;
    document.getElementById('modal-price').textContent = gift.price;
    document.getElementById('modal-desc').textContent = gift.desc;
    giftModal.classList.add('modal--open');
    giftModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeGiftModal() {
    giftModal.classList.remove('modal--open');
    giftModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  giftModal.querySelector('.modal__close').addEventListener('click', closeGiftModal);
  giftModal.querySelector('.modal__backdrop').addEventListener('click', closeGiftModal);

  document.getElementById('copy-pix').addEventListener('click', function () {
    const key = document.getElementById('pix-key').textContent;
    navigator.clipboard.writeText(key).then(() => {
      this.textContent = 'Copiado!';
      setTimeout(() => { this.textContent = 'Copiar'; }, 2000);
    });
  });

  /* ============================================
     RSVP MODAL — Zigzag Brush Mask
     ============================================ */
  const rsvpModal = document.getElementById('rsvp-modal');
  const rsvpFormWrap = document.getElementById('rsvp-form-wrap');
  const brushPaths = [
    document.getElementById('brush-path'),
    document.getElementById('brush-path-2'),
    document.getElementById('brush-path-3'),
  ];
  let brushPlayed = false;

  function initBrushPaths() {
    brushPaths.forEach((p) => {
      if (!p) return;
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
  }

  function animBrush(path, dur, delay) {
    if (!path) return null;
    const len = path.getTotalLength();
    return path.animate(
      [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
      { duration: dur, delay: delay, easing: 'cubic-bezier(0.4,0,0.2,1)', fill: 'forwards' }
    );
  }

  function openRsvpModal() {
    rsvpModal.classList.add('rsvp-modal--open');
    rsvpModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (!brushPlayed) {
      brushPlayed = true;
      initBrushPaths();
      animBrush(brushPaths[0], 800, 0);
      animBrush(brushPaths[1], 800, 400);
      const last = animBrush(brushPaths[2], 800, 800);
      if (last) {
        last.onfinish = () => {
          setTimeout(() => rsvpFormWrap.classList.add('rsvp-form--visible'), 200);
        };
      } else {
        setTimeout(() => rsvpFormWrap.classList.add('rsvp-form--visible'), 2000);
      }
    }
  }

  function closeRsvpModal() {
    rsvpModal.classList.remove('rsvp-modal--open');
    rsvpModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.getElementById('open-rsvp').addEventListener('click', openRsvpModal);
  rsvpModal.querySelector('.rsvp-modal__close').addEventListener('click', closeRsvpModal);
  rsvpModal.querySelector('.rsvp-modal__backdrop').addEventListener('click', closeRsvpModal);

  /* ---------- RSVP FORM ---------- */
  const rsvpForm = document.getElementById('rsvp-form');
  const rsvpFeedback = document.getElementById('rsvp-feedback');

  rsvpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('rsvp-name').value.trim();
    const presence = rsvpForm.querySelector('input[name="presence"]:checked');
    if (!name || !presence) {
      rsvpFeedback.textContent = 'Por favor, preencha seu nome e selecione uma opção.';
      rsvpFeedback.className = 'rsvp-modal__feedback rsvp-modal__feedback--error';
      return;
    }
    const btn = document.getElementById('rsvp-btn');
    btn.disabled = true;
    btn.textContent = 'Enviando…';
    setTimeout(() => {
      const first = name.split(' ')[0];
      rsvpFeedback.textContent = presence.value === 'sim'
        ? `Que alegria, ${first}! Sua presença está confirmada. 💛`
        : `Sentiremos sua falta, ${first}. Obrigado por nos avisar.`;
      rsvpFeedback.className = 'rsvp-modal__feedback rsvp-modal__feedback--success';
      btn.textContent = 'Confirmado ✓';
    }, 800);
  });

  /* ---------- ESCAPE KEY ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeGiftModal(); closeRsvpModal(); }
  });

})();
