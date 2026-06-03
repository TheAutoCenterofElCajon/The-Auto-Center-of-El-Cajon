/**
 * ProShift Auto Repair — script.js
 * All interactive behaviors: navigation, carousel, counters,
 * service search/filter, FAQ accordion, form validation, animations.
 */

'use strict';

/* ── DOM helpers ── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ============================================================
   LOADING SCREEN
   ============================================================ */
(function initLoader() {
  const screen = $('#loading-screen');
  if (!screen) return;

  // Hide after CSS animation completes (~1.8s) + brief pause
  window.addEventListener('load', () => {
    setTimeout(() => {
      screen.classList.add('hidden');
      // Remove from DOM after transition
      screen.addEventListener('transitionend', () => screen.remove(), { once: true });
    }, 300);
  });

  // Failsafe: remove after 3s regardless
  setTimeout(() => {
    screen.classList.add('hidden');
  }, 3000);
})();


/* ============================================================
   STICKY HEADER + ACTIVE NAV HIGHLIGHTING
   ============================================================ */
(function initHeader() {
  const header = $('#site-header');
  const navLinks = $$('.nav-link');
  if (!header) return;

  const sections = navLinks
    .map(link => {
      const id = link.getAttribute('href')?.replace('#', '');
      return id ? { link, section: $(`#${id}`) } : null;
    })
    .filter(Boolean);

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      // Sticky class
      header.classList.toggle('scrolled', window.scrollY > 20);

      // Active nav link
      const scrollY = window.scrollY + 120;
      let current = null;

      sections.forEach(({ section }) => {
        if (!section) return;
        if (section.offsetTop <= scrollY) {
          current = section.id;
        }
      });

      sections.forEach(({ link, section }) => {
        if (!section) return;
        link.classList.toggle('active', section.id === current);
      });

      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


/* ============================================================
   MOBILE HAMBURGER MENU
   ============================================================ */
(function initMobileMenu() {
  const hamburger = $('#hamburger');
  const navLinks = $('#nav-links');
  if (!hamburger || !navLinks) return;

  function toggleMenu(force) {
    const isOpen = force !== undefined ? force : !navLinks.classList.contains('open');
    navLinks.classList.toggle('open', isOpen);
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  hamburger.addEventListener('click', () => toggleMenu());

  // Close on nav link click
  navLinks.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-link')) {
      toggleMenu(false);
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      toggleMenu(false);
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleMenu(false);
  });
})();


/* ============================================================
   SMOOTH SCROLLING
   ============================================================ */
(function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const id = link.getAttribute('href').slice(1);
    if (!id) return;

    const target = document.getElementById(id);
    if (!target) return;

    e.preventDefault();

    const headerH = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--header-h')) || 72;

    const top = target.getBoundingClientRect().top + window.scrollY - headerH;

    window.scrollTo({ top, behavior: 'smooth' });
  });
})();


/* ============================================================
   BACK TO TOP BUTTON
   ============================================================ */
(function initBackToTop() {
  const btn = $('#back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


/* ============================================================
   SCROLL REVEAL ANIMATIONS (Intersection Observer)
   ============================================================ */
(function initScrollReveal() {
  const items = $$('.reveal-up, .reveal-left, .reveal-right');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Stagger sibling cards
        const parent = entry.target.closest('.stats-grid, .why-grid, .service-cards-row');
        if (parent) {
          const siblings = $$(
            '.reveal-up, .stat-card, .why-card',
            parent
          ).filter(el => !el.classList.contains('revealed'));
          const idx = siblings.indexOf(entry.target);
          if (idx > -1) {
            setTimeout(() => entry.target.classList.add('revealed'), idx * 80);
          } else {
            entry.target.classList.add('revealed');
          }
        } else {
          entry.target.classList.add('revealed');
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  items.forEach(el => observer.observe(el));
})();


/* ============================================================
   ANIMATED STATISTICS COUNTERS
   ============================================================ */
(function initStatCounters() {
  const counters = $$('.stat-number');
  if (!counters.length) return;

  function formatNumber(n) {
    return n >= 1000 ? n.toLocaleString() : String(n);
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const startTime = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(easeOut(progress) * target);
      el.textContent = formatNumber(value) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
})();


/* ============================================================
   SERVICE SEARCH + CATEGORY FILTERING
   ============================================================ */
(function initServicesFilter() {
  const searchInput = $('#service-search');
  const clearBtn = $('#search-clear');
  const tabs = $$('.tab-btn');
  const categories = $$('.service-category');
  const cards = $$('.service-card');
  const noResults = $('#no-results');

  if (!searchInput) return;

  let activeCategory = 'all';
  let searchQuery = '';

  function filterServices() {
    const query = searchQuery.toLowerCase().trim();
    let visibleCards = 0;

    categories.forEach(cat => {
      const catKey = cat.dataset.category;
      const catVisible = activeCategory === 'all' || catKey === activeCategory;

      let catHasVisible = false;

      cat.querySelectorAll('.service-card').forEach(card => {
        const serviceText = (card.dataset.service || '').toLowerCase();
        const cardText = card.textContent.toLowerCase();
        const matchesQuery = !query || serviceText.includes(query) || cardText.includes(query);
        const show = catVisible && matchesQuery;

        card.style.display = show ? '' : 'none';

        if (show) {
          catHasVisible = true;
          visibleCards++;
        }
      });

      cat.style.display = catVisible && catHasVisible ? '' : 'none';
    });

    if (noResults) {
      noResults.style.display = visibleCards === 0 ? 'block' : 'none';
    }
  }

  // Search input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearBtn.style.display = searchQuery ? 'flex' : 'none';
    filterServices();
  });

  // Clear button
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearBtn.style.display = 'none';
    searchInput.focus();
    filterServices();
  });

  // Tab buttons
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      activeCategory = tab.dataset.category;
      filterServices();
    });
  });
})();


/* ============================================================
   TESTIMONIAL CAROUSEL
   ============================================================ */
(function initCarousel() {
  const track = $('#testimonial-track');
  const dotsContainer = $('#carousel-dots');
  const prevBtn = $('#prev-btn');
  const nextBtn = $('#next-btn');

  if (!track) return;

  const slides = $$('.testimonial-card', track);
  const total = slides.length;
  let current = 0;
  let autoplayTimer = null;
  let isDragging = false;
  let dragStartX = 0;

  // Build dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Testimonial ${i + 1}`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  function updateDots() {
    const dots = $$('.carousel-dot', dotsContainer);
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
      dot.setAttribute('aria-selected', i === current ? 'true' : 'false');
    });
  }

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    updateDots();
    // Update live region text for screen readers
    track.setAttribute('aria-label', `Testimonial ${current + 1} of ${total}`);
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(next, 5000);
  }

  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
  }

  prevBtn?.addEventListener('click', () => { prev(); startAutoplay(); });
  nextBtn?.addEventListener('click', () => { next(); startAutoplay(); });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    const carousel = document.getElementById('testimonial-carousel');
    if (!carousel?.matches(':hover')) return;
    if (e.key === 'ArrowLeft') { prev(); startAutoplay(); }
    if (e.key === 'ArrowRight') { next(); startAutoplay(); }
  });

  // Touch/swipe support
  track.addEventListener('touchstart', (e) => {
    dragStartX = e.touches[0].clientX;
    stopAutoplay();
    isDragging = true;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    const diff = dragStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
    isDragging = false;
    startAutoplay();
  }, { passive: true });

  // Pause on hover
  const carousel = document.getElementById('testimonial-carousel');
  carousel?.addEventListener('mouseenter', stopAutoplay);
  carousel?.addEventListener('mouseleave', startAutoplay);

  startAutoplay();
  goTo(0);
})();


/* ============================================================
   FAQ ACCORDION
   ============================================================ */
(function initFAQ() {
  const items = $$('.faq-item');

  items.forEach(item => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      // Close all others
      items.forEach(other => {
        if (other === item) return;
        const otherBtn = other.querySelector('.faq-question');
        const otherAnswer = other.querySelector('.faq-answer');
        if (otherBtn && otherAnswer) {
          otherBtn.setAttribute('aria-expanded', 'false');
          otherAnswer.hidden = true;
        }
      });

      // Toggle current
      btn.setAttribute('aria-expanded', String(!isOpen));
      answer.hidden = isOpen;
    });
  });
})();


/* ============================================================
   APPOINTMENT FORM VALIDATION
   ============================================================ */
(function initAppointmentForm() {
  const form = $('#appointment-form');
  const success = $('#form-success');
  const submitBtn = $('#submit-btn');
  if (!form) return;

  // Set minimum date to today
  const dateInput = $('#appt-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  function showError(id, msg) {
    const el = $(`#${id}`);
    const input = form.querySelector(`[id="${id.replace('err-', '')}"]`) ||
                  form.querySelector(`[name="${id.replace('err-', '')}"]`);
    if (el) el.textContent = msg;
    if (input) input.classList.toggle('error', !!msg);
  }

  function clearError(id) { showError(id, ''); }

  function validateField(input) {
    const name = input.name;
    const val = input.value.trim();
    const errMap = {
      fullName:    'err-name',
      phone:       'err-phone',
      email:       'err-email',
      vehicleYear: 'err-year',
      vehicleMake: 'err-make',
      vehicleModel:'err-model',
      serviceType: 'err-service',
      apptDate:    'err-date',
    };

    const errId = errMap[name];
    if (!errId) return true;

    if (!val) {
      showError(errId, 'This field is required.');
      return false;
    }

    if (name === 'email') {
      const emailRE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRE.test(val)) {
        showError(errId, 'Please enter a valid email address.');
        return false;
      }
    }

    if (name === 'phone') {
      const phoneRE = /^[\d\s\(\)\-\+]{7,20}$/;
      if (!phoneRE.test(val)) {
        showError(errId, 'Please enter a valid phone number.');
        return false;
      }
    }

    if (name === 'vehicleYear') {
      const yr = parseInt(val, 10);
      const maxYr = new Date().getFullYear() + 1;
      if (yr < 1960 || yr > maxYr) {
        showError(errId, `Please enter a year between 1960 and ${maxYr}.`);
        return false;
      }
    }

    if (name === 'apptDate') {
      const today = new Date().toISOString().split('T')[0];
      if (val < today) {
        showError(errId, 'Please select a future date.');
        return false;
      }
    }

    clearError(errId);
    return true;
  }

  // Live validation on blur
  $$('input, select, textarea', form).forEach(el => {
    el.addEventListener('blur', () => validateField(el));
    el.addEventListener('input', () => {
      if (el.classList.contains('error')) validateField(el);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fields = $$('input[required], select[required]', form);
    let valid = true;

    fields.forEach(field => {
      if (!validateField(field)) valid = false;
    });

    if (!valid) {
      // Focus first error
      const firstError = form.querySelector('.error');
      firstError?.focus();
      return;
    }

    // Show loading state
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');
    submitBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline-flex';

    // Simulate async submission
    setTimeout(() => {
      form.style.display = 'none';
      success.style.display = 'block';
      // Scroll success message into view
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 1400);
  });
})();


/* ============================================================
   CURRENT YEAR IN FOOTER
   ============================================================ */
(function setYear() {
  const el = $('#current-year');
  if (el) el.textContent = new Date().getFullYear();
})();


/* ============================================================
   LAZY IMAGE LOADING (polyfill support)
   ============================================================ */
(function initLazyImages() {
  if ('loading' in HTMLImageElement.prototype) return; // native support

  const images = $$('img[loading="lazy"]');
  if (!images.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) img.src = img.dataset.src;
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  images.forEach(img => observer.observe(img));
})();


/* ============================================================
   PHONE NUMBER FORMATTING
   ============================================================ */
(function initPhoneFormat() {
  const phoneInput = $('#phone');
  if (!phoneInput) return;

  phoneInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 10) val = val.slice(0, 10);

    if (val.length >= 7) {
      val = `(${val.slice(0,3)}) ${val.slice(3,6)}-${val.slice(6)}`;
    } else if (val.length >= 4) {
      val = `(${val.slice(0,3)}) ${val.slice(3)}`;
    } else if (val.length > 0) {
      val = `(${val}`;
    }

    e.target.value = val;
  });
})();


/* ============================================================
   HEADER TRANSPARENCY → OPAQUE on scroll
   (ensure white text readability in hero area)
   ============================================================ */
(function initHeaderColorShift() {
  const header = $('#site-header');
  if (!header) return;
  // Already handled by .scrolled class — this is just the initial force
  if (window.scrollY > 20) header.classList.add('scrolled');
})();
