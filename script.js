/* ================================================
   WEDDING LANDING PAGE — JavaScript
   Zigzag Diagonal Brush Mask + Gold Interactions
   ================================================ */

(function () {
  'use strict';

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

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    document.getElementById('cd-days').textContent = String(days);
    document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('cd-minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('cd-seconds').textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ---------- SCROLL REVEAL (wind effect) ---------- */
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
    {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  /* ---------- NAV SCROLL SHADOW ---------- */
  const nav = document.getElementById('nav');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  });

  /* ---------- SMOOTH NAV LINKS ---------- */
  document.querySelectorAll('.nav__link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

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
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openGiftModal(gift);
      }
    });

    giftsGrid.appendChild(card);
  });

  /* ---------- GIFT MODAL ---------- */
  const giftModal = document.getElementById('gift-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalPrice = document.getElementById('modal-price');
  const modalDesc = document.getElementById('modal-desc');
  const copyBtn = document.getElementById('copy-pix');

  function openGiftModal(gift) {
    modalTitle.textContent = gift.emoji + ' ' + gift.name;
    modalPrice.textContent = gift.price;
    modalDesc.textContent = gift.desc;
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

  copyBtn.addEventListener('click', () => {
    const pixKey = document.getElementById('pix-key').textContent;
    navigator.clipboard.writeText(pixKey).then(() => {
      copyBtn.textContent = 'Copiado!';
      setTimeout(() => {
        copyBtn.textContent = 'Copiar';
      }, 2000);
    });
  });

  /* ============================================
     RSVP MODAL — Zigzag Diagonal Brush Mask
     ============================================ */
  const rsvpModal = document.getElementById('rsvp-modal');
  const openRsvpBtn = document.getElementById('open-rsvp');
  const rsvpFormWrap = document.getElementById('rsvp-form-wrap');

  const brushPath1 = document.getElementById('brush-path');
  const brushPath2 = document.getElementById('brush-path-2');
  const brushPath3 = document.getElementById('brush-path-3');

  let brushAnimationPlayed = false;

  /**
   * Initialize SVG paths: set strokeDasharray and offset
   * so the path is fully hidden, ready for reveal animation.
   */
  function initBrushPaths() {
    [brushPath1, brushPath2, brushPath3].forEach((path) => {
      if (path) {
        const length = path.getTotalLength();
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
      }
    });
  }

  /**
   * Animate a single brush stroke path using Web Animations API.
   * Returns the Animation object for chaining.
   */
  function animateBrushStroke(path, duration, delay) {
    if (!path) return null;
    const length = path.getTotalLength();

    return path.animate(
      [
        { strokeDashoffset: length },
        { strokeDashoffset: 0 }
      ],
      {
        duration: duration,
        delay: delay,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards'
      }
    );
  }

  function openRsvpModal() {
    rsvpModal.classList.add('rsvp-modal--open');
    rsvpModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (!brushAnimationPlayed) {
      brushAnimationPlayed = true;

      // Initialize all paths to hidden
      initBrushPaths();

      // Zigzag diagonal sweep: left → middle → right
      // Path 1 (left column): starts immediately, 800ms
      animateBrushStroke(brushPath1, 800, 0);
      // Path 2 (middle column): 400ms delay, 800ms
      animateBrushStroke(brushPath2, 800, 400);
      // Path 3 (right column): 800ms delay, 800ms
      const lastAnim = animateBrushStroke(brushPath3, 800, 800);

      // After ALL brush strokes complete, show the form overlay ON TOP
      if (lastAnim) {
        lastAnim.onfinish = () => {
          // Small buffer for visual polish
          setTimeout(() => {
            rsvpFormWrap.classList.add('rsvp-form--visible');
          }, 200);
        };
      } else {
        // Fallback if animation API not supported
        setTimeout(() => {
          rsvpFormWrap.classList.add('rsvp-form--visible');
        }, 2000);
      }
    }
  }

  function closeRsvpModal() {
    rsvpModal.classList.remove('rsvp-modal--open');
    rsvpModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  openRsvpBtn.addEventListener('click', openRsvpModal);
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
      showFeedback('Por favor, preencha seu nome e selecione uma opção.', 'error');
      return;
    }

    const btn = document.getElementById('rsvp-btn');
    btn.disabled = true;
    btn.textContent = 'Enviando…';

    setTimeout(() => {
      if (presence.value === 'sim') {
        showFeedback(`Que alegria, ${name.split(' ')[0]}! Sua presença está confirmada. 💛`, 'success');
      } else {
        showFeedback(`Sentiremos sua falta, ${name.split(' ')[0]}. Obrigado por nos avisar.`, 'success');
      }
      btn.textContent = 'Confirmado ✓';
    }, 800);
  });

  function showFeedback(msg, type) {
    rsvpFeedback.textContent = msg;
    rsvpFeedback.className = 'rsvp-modal__feedback rsvp-modal__feedback--' + type;
  }

  /* ---------- ESCAPE KEY ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeGiftModal();
      closeRsvpModal();
    }
  });

})();
