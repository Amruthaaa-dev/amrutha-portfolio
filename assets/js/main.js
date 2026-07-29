/* ============================================================================
   MAIN — interaction & animation layer
   ----------------------------------------------------------------------------
   Every behaviour lives in its own small module and is invoked from boot().
   Nothing here assumes a library loaded successfully: each integration is
   feature-detected so the page degrades to a clean, static, readable site.

   MODULES
     01 · Preloader
     02 · Custom cursor + mouse spotlight
     03 · Navigation (sticky, scrollspy, mobile menu)
     04 · Hero entrance timeline
     05 · Typed.js headline
     06 · Scroll progress bar
     07 · Animated counters
     08 · Animated skill bars
     09 · Experience timeline draw
     10 · Magnetic buttons
     11 · 3D tilt cards
     12 · Parallax layers
     13 · Project filtering
     14 · Contact form
     15 · Portrait source resolution (cutout vs framed)
     16 · Misc (back-to-top, footer year)
   ========================================================================== */

(function () {
  'use strict';

  /* ── Shared helpers ────────────────────────────────────────────────────── */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const REDUCED  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IS_TOUCH = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  const hasGSAP   = () => typeof gsap !== 'undefined';
  const hasST     = () => hasGSAP() && typeof ScrollTrigger !== 'undefined';
  const clamp     = (v, min, max) => Math.min(Math.max(v, min), max);
  const lerp      = (a, b, n) => a + (b - a) * n;

  /* Run a callback once when an element first enters the viewport. */
  function onEnterOnce(el, cb, threshold = 0.25) {
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          cb(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold });
    io.observe(el);
  }

  /* ======================================================================== */
  /* 01 · PRELOADER                                                           */
  /* ======================================================================== */
  function initPreloader(onDone) {
    const root = $('#preloader');
    const fill = $('#preloaderFill');
    const pct  = $('#preloaderPct');

    if (!root) { onDone(); return; }

    document.body.classList.add('is-locked');

    let progress = 0;
    let pageLoaded = false;
    let finished = false;          // guards against the failsafe double-firing
    window.addEventListener('load', () => { pageLoaded = true; }, { once: true });

    // Ease toward 90% while assets stream in; snap to 100 once load fires.
    const tick = () => {
      const ceiling = pageLoaded ? 100 : 90;
      progress = lerp(progress, ceiling, pageLoaded ? 0.22 : 0.035);

      if (progress > 99.4) progress = 100;

      if (fill) fill.style.width = progress + '%';
      if (pct)  pct.textContent  = Math.round(progress);

      if (progress < 100) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(dismiss, 260);
      }
    };
    requestAnimationFrame(tick);

    function dismiss() {
      if (finished) return;
      finished = true;

      root.classList.add('is-done');
      document.body.classList.remove('is-locked');

      const finish = () => {
        root.style.display = 'none';
        onDone();
      };

      if (hasGSAP() && !REDUCED) {
        gsap.timeline({ onComplete: finish })
          .to('.preloader__inner', { opacity: 0, y: -24, duration: 0.5, ease: 'power2.inOut' })
          .to(root, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '-=0.15');
      } else {
        root.style.transition = 'opacity .4s ease';
        root.style.opacity = '0';
        setTimeout(finish, 420);
      }
    }

    // Failsafe: never trap the visitor behind a stuck loader.
    setTimeout(() => {
      if (finished) return;
      finished = true;
      root.style.display = 'none';
      document.body.classList.remove('is-locked');
      onDone();
    }, 6000);
  }

  /* ======================================================================== */
  /* 02 · CUSTOM CURSOR + MOUSE SPOTLIGHT                                     */
  /* ======================================================================== */
  function initCursor() {
    const dot  = $('#cursorDot');
    const ring = $('#cursorRing');
    const root = document.documentElement;

    // Spotlight follows the pointer on every device that has one.
    let sx = window.innerWidth / 2, sy = window.innerHeight / 2;
    let spotQueued = false;

    const paintSpotlight = () => {
      root.style.setProperty('--mx', sx + 'px');
      root.style.setProperty('--my', sy + 'px');
      spotQueued = false;
    };

    if (IS_TOUCH || REDUCED || !dot || !ring) {
      // Still track the spotlight for non-touch reduced-motion users.
      if (!IS_TOUCH) {
        window.addEventListener('pointermove', (e) => {
          sx = e.clientX; sy = e.clientY;
          if (!spotQueued) { spotQueued = true; requestAnimationFrame(paintSpotlight); }
        }, { passive: true });
      }
      return;
    }

    let mx = sx, my = sy;          // raw pointer
    let rx = sx, ry = sy;          // eased ring position

    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      sx = mx; sy = my;
      document.body.classList.add('cursor-ready');
      if (!spotQueued) { spotQueued = true; requestAnimationFrame(paintSpotlight); }
    }, { passive: true });

    // Dot snaps, ring trails — the classic premium two-layer cursor.
    (function loop() {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      dot.style.transform  = `translate3d(${mx}px, ${my}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    })();

    // Grow the ring over anything clickable.
    const INTERACTIVE = 'a, button, input, textarea, select, [data-tilt], .filter, .stack-tile';
    document.addEventListener('pointerover', (e) => {
      if (e.target.closest(INTERACTIVE)) ring.classList.add('is-hover');
    });
    document.addEventListener('pointerout', (e) => {
      if (e.target.closest(INTERACTIVE)) ring.classList.remove('is-hover');
    });

    document.addEventListener('pointerleave', () => document.body.classList.remove('cursor-ready'));
    document.addEventListener('pointerenter', () => document.body.classList.add('cursor-ready'));
  }

  /* ======================================================================== */
  /* 03 · NAVIGATION                                                          */
  /* ======================================================================== */
  function initNav() {
    const navbar   = $('#navbar');
    const toggle   = $('#menuToggle');
    const menu     = $('#mobileMenu');
    const navLinks = $$('[data-nav]');

    /* Sticky state */
    const onScroll = () => {
      if (!navbar) return;
      navbar.classList.toggle('is-stuck', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Mobile menu */
    if (toggle && menu) {
      const setMenu = (open) => {
        // Visibility is CSS-driven (opacity + visibility) so the panel can
        // animate in and out rather than snapping via the hidden attribute.
        menu.classList.toggle('is-open', open);
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.classList.toggle('is-locked', open);
      };

      toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
      $$('[data-mobile-link]').forEach((a) => a.addEventListener('click', () => setMenu(false)));
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false);
      });
    }

    /* Scrollspy — highlights the section currently in the middle of the view */
    const sections = navLinks
      .map((link) => $(link.getAttribute('href')))
      .filter(Boolean);

    if (sections.length) {
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((l) =>
            l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id)
          );
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

      sections.forEach((s) => spy.observe(s));
    }
  }

  /* ======================================================================== */
  /* 04 · HERO ENTRANCE                                                       */
  /* ======================================================================== */
  function initHeroIntro() {
    if (!hasGSAP() || REDUCED) return;

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    tl.from('.reveal-word', {
        yPercent: 115,
        duration: 1.15,
        stagger: 0.09
      })
      .from('.hero__eyebrow', { y: 20, opacity: 0, duration: 0.7 }, '-=0.85')
      .from('.hero__role',    { y: 20, opacity: 0, duration: 0.7 }, '-=0.6')
      .from('.hero__blurb',   { y: 20, opacity: 0, duration: 0.7, stagger: 0.08 }, '-=0.55')
      .from('.hero__cta > *', { y: 22, opacity: 0, duration: 0.6, stagger: 0.08 }, '-=0.5')
      .from('.hero__stats li', { y: 18, opacity: 0, duration: 0.6, stagger: 0.08 }, '-=0.45')
      .from('.hero__social li', { y: 14, opacity: 0, duration: 0.5, stagger: 0.06 }, '-=0.45')
      .from('.portrait', { scale: 0.9, opacity: 0, duration: 1.3, ease: 'power3.out' }, '-=1.5')
      .from('.floater', { scale: 0.4, opacity: 0, duration: 0.8, stagger: 0.08 }, '-=0.9')
      .from('.scroll-cue', { opacity: 0, y: 14, duration: 0.6 }, '-=0.5');
  }

  /* ======================================================================== */
  /* 05 · TYPED HEADLINE                                                      */
  /* ======================================================================== */
  function initTyped() {
    const host = $('#typed');
    if (!host) return;

    const strings = (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.typedStrings)
      ? SITE_CONFIG.typedStrings
      : ['Software Engineer', 'Full Stack PHP Developer'];

    // Reduced motion (or no library): show the primary role, statically.
    if (typeof Typed === 'undefined' || REDUCED) {
      host.textContent = strings[0];
      return;
    }

    new Typed('#typed', {
      strings,
      typeSpeed: 58,
      backSpeed: 28,
      backDelay: 1900,
      startDelay: 400,
      smartBackspace: true,
      loop: true
    });
  }

  /* ======================================================================== */
  /* 06 · SCROLL PROGRESS                                                     */
  /* ======================================================================== */
  function initScrollProgress() {
    const bar = $('#scrollBar');
    if (!bar) return;

    let queued = false;
    const paint = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = clamp(pct, 0, 100) + '%';
      queued = false;
    };

    window.addEventListener('scroll', () => {
      if (!queued) { queued = true; requestAnimationFrame(paint); }
    }, { passive: true });
    paint();
  }

  /* ======================================================================== */
  /* 07 · ANIMATED COUNTERS                                                   */
  /* ======================================================================== */
  function initCounters() {
    $$('.counter').forEach((el) => {
      const target = parseFloat(el.dataset.count || '0');
      const suffix = el.dataset.suffix || '';

      if (REDUCED) { el.textContent = target + suffix; return; }

      onEnterOnce(el, () => {
        const DURATION = 1900;
        const start = performance.now();

        const step = (now) => {
          const p = clamp((now - start) / DURATION, 0, 1);
          // easeOutExpo — fast start, long graceful settle
          const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, 0.4);
    });
  }

  /* ======================================================================== */
  /* 08 · ANIMATED SKILL BARS                                                 */
  /* ======================================================================== */
  function initSkills() {
    $$('.skill').forEach((skill) => {
      const value = parseInt(skill.dataset.skill || '0', 10);
      const fill  = $('.skill__fill', skill);
      const label = $('.skill__pct', skill);
      if (!fill) return;

      if (REDUCED) {
        fill.style.width = value + '%';
        if (label) label.textContent = value + '%';
        return;
      }

      onEnterOnce(skill, () => {
        // Bar and number animate on the same curve so they land together.
        fill.style.transition = 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1)';
        fill.style.width = value + '%';

        if (!label) return;
        const start = performance.now();
        const step = (now) => {
          const p = clamp((now - start) / 1500, 0, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          label.textContent = Math.round(value * eased) + '%';
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, 0.3);
    });
  }

  /* ======================================================================== */
  /* 09 · EXPERIENCE TIMELINE DRAW                                            */
  /* ======================================================================== */
  function initTimeline() {
    const wrap = $('#timeline');
    const fill = $('#timelineFill');
    if (!wrap || !fill) return;

    if (REDUCED) { fill.style.height = '100%'; return; }

    if (hasST()) {
      // Spine fills in lockstep with scroll position through the section.
      gsap.to(fill, {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: wrap,
          start: 'top 72%',
          end: 'bottom 62%',
          scrub: 0.6
        }
      });

      // Nodes pop as they reach the middle of the viewport.
      $$('.tl-node span').forEach((node) => {
        gsap.fromTo(node,
          { scale: 0.2, opacity: 0.3 },
          {
            scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2.4)',
            scrollTrigger: { trigger: node, start: 'top 78%' }
          }
        );
      });
      return;
    }

    // Fallback without ScrollTrigger: fill proportionally on scroll.
    const paint = () => {
      const rect = wrap.getBoundingClientRect();
      const total = rect.height + window.innerHeight * 0.3;
      const seen = clamp(window.innerHeight * 0.72 - rect.top, 0, total);
      fill.style.height = (seen / total) * 100 + '%';
    };
    window.addEventListener('scroll', paint, { passive: true });
    paint();
  }

  /* ======================================================================== */
  /* 10 · MAGNETIC BUTTONS                                                    */
  /* ======================================================================== */
  function initMagnetic() {
    if (IS_TOUCH || REDUCED) return;

    $$('.magnetic').forEach((el) => {
      const STRENGTH = 0.32;
      let raf = null;
      let tx = 0, ty = 0, cx = 0, cy = 0;

      const animate = () => {
        cx = lerp(cx, tx, 0.18);
        cy = lerp(cy, ty, 0.18);
        el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;

        if (Math.abs(cx - tx) > 0.1 || Math.abs(cy - ty) > 0.1) {
          raf = requestAnimationFrame(animate);
        } else {
          el.style.transform = tx === 0 && ty === 0 ? '' : el.style.transform;
          raf = null;
        }
      };

      const start = () => { if (!raf) raf = requestAnimationFrame(animate); };

      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width  / 2)) * STRENGTH;
        ty = (e.clientY - (r.top  + r.height / 2)) * STRENGTH;
        start();
      });

      el.addEventListener('pointerleave', () => { tx = 0; ty = 0; start(); });
    });
  }

  /* ======================================================================== */
  /* 11 · 3D TILT CARDS                                                       */
  /* ======================================================================== */
  function initTilt() {
    if (IS_TOUCH || REDUCED) return;

    $$('[data-tilt]').forEach((card) => {
      const MAX = 7;               // degrees — restraint keeps it premium
      let raf = null;
      let trx = 0, try_ = 0, crx = 0, cry = 0;

      const animate = () => {
        crx = lerp(crx, trx, 0.12);
        cry = lerp(cry, try_, 0.12);
        card.style.transform =
          `perspective(1000px) rotateX(${crx.toFixed(3)}deg) rotateY(${cry.toFixed(3)}deg)`;

        if (Math.abs(crx - trx) > 0.01 || Math.abs(cry - try_) > 0.01) {
          raf = requestAnimationFrame(animate);
        } else {
          if (trx === 0 && try_ === 0) card.style.transform = '';
          raf = null;
        }
      };

      const start = () => { if (!raf) raf = requestAnimationFrame(animate); };

      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width  - 0.5;
        const py = (e.clientY - r.top)  / r.height - 0.5;
        trx = -py * MAX * 2;
        try_ =  px * MAX * 2;
        start();
      });

      card.addEventListener('pointerleave', () => { trx = 0; try_ = 0; start(); });
    });
  }

  /* ======================================================================== */
  /* 12 · PARALLAX LAYERS                                                     */
  /* ======================================================================== */
  function initParallax() {
    if (REDUCED) return;

    /* Pointer-driven depth on the floating tech chips */
    if (!IS_TOUCH) {
      const floaters = $$('.floater');
      if (floaters.length) {
        let queued = false, mx = 0, my = 0;

        const paint = () => {
          floaters.forEach((f) => {
            const d = parseFloat(f.dataset.depth || '0.05');
            f.style.marginLeft = (mx * d * 60) + 'px';
            f.style.marginTop  = (my * d * 60) + 'px';
          });
          queued = false;
        };

        window.addEventListener('pointermove', (e) => {
          mx = e.clientX / window.innerWidth  - 0.5;
          my = e.clientY / window.innerHeight - 0.5;
          if (!queued) { queued = true; requestAnimationFrame(paint); }
        }, { passive: true });
      }
    }

    if (!hasST()) return;
    gsap.registerPlugin(ScrollTrigger);

    /* Hero copy drifts up and fades as you scroll past it */
    gsap.to('.hero__copy', {
      y: -70, opacity: 0.25, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 }
    });

    /* Portrait moves at a different rate — classic depth cue */
    gsap.to('.hero__visual', {
      y: 60, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 }
    });

    /* Section headings rise slightly ahead of their content */
    $$('.section-title').forEach((title) => {
      gsap.from(title, {
        y: 34, opacity: 0, duration: 0.9, ease: 'expo.out',
        scrollTrigger: { trigger: title, start: 'top 88%' }
      });
    });

    /* Footer signature scales in as the page bottoms out */
    const footName = $('.footer__name');
    if (footName) {
      gsap.from(footName, {
        scale: 0.9, opacity: 0, duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: footName, start: 'top 92%' }
      });
    }
  }

  /* ======================================================================== */
  /* 13 · PROJECT FILTERING                                                   */
  /* ======================================================================== */
  function initFilters() {
    const buttons = $$('.filter');
    const cards   = $$('.project');
    if (!buttons.length || !cards.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        buttons.forEach((b) => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-selected', String(active));
        });

        cards.forEach((card) => {
          const match = filter === 'all' || card.dataset.category === filter;
          card.classList.toggle('is-hidden', !match);

          if (match && hasGSAP() && !REDUCED) {
            gsap.fromTo(card,
              { opacity: 0, y: 22, scale: 0.97 },
              { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'expo.out' }
            );
          }
        });

        // Grid heights changed — let ScrollTrigger recompute its positions.
        if (hasST()) ScrollTrigger.refresh();
      });
    });
  }

  /* ======================================================================== */
  /* 14 · CONTACT FORM                                                        */
  /* ======================================================================== */
  function initContactForm() {
    const form   = $('#contactForm');
    const status = $('#formStatus');
    if (!form) return;

    const setError = (input, message) => {
      const field = input.closest('.field');
      const slot  = $(`[data-error-for="${input.id}"]`, form);
      if (field) field.classList.toggle('has-error', Boolean(message));
      if (slot)  slot.textContent = message || '';
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
    };

    // Clear the error the moment the visitor starts fixing it.
    $$('input, textarea', form).forEach((input) => {
      input.addEventListener('input', () => setError(input, ''));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name    = $('#cf-name', form);
      const email   = $('#cf-email', form);
      const subject = $('#cf-subject', form);
      const message = $('#cf-message', form);

      let valid = true;

      if (!name.value.trim())    { setError(name, 'Please tell me your name.'); valid = false; }
      if (!subject.value.trim()) { setError(subject, 'A short subject helps.'); valid = false; }
      if (message.value.trim().length < 10) {
        setError(message, 'A little more detail, please (10+ characters).'); valid = false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        setError(email, 'That email address does not look valid.'); valid = false;
      }

      if (!valid) {
        if (status) {
          status.textContent = 'Please fix the highlighted fields.';
          status.className = 'form-note is-error';
        }
        // Nudge the form so the failure is felt, not just read.
        if (hasGSAP() && !REDUCED) gsap.fromTo(form, { x: -7 }, { x: 0, duration: 0.45, ease: 'elastic.out(1, 0.35)' });
        return;
      }

      const cfg = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG : {};

      sendEnquiry({
        cfg, form, status,
        payload: {
          name:    name.value.trim(),
          email:   email.value.trim(),
          subject: subject.value.trim(),
          message: message.value.trim(),
          botcheck: form.botcheck ? form.botcheck.checked : false
        }
      });
    });

    /* ---------------------------------------------------------------------- */
    /* Delivery                                                               */
    /*                                                                        */
    /* The enquiry is emailed to the inbox in config.js via a form-relay       */
    /* service — the browser POSTs directly, so no server is required and this */
    /* works unchanged on GitHub Pages / Netlify / any static host.            */
    /* ---------------------------------------------------------------------- */
    async function sendEnquiry({ cfg, form, status, payload }) {
      const key    = (cfg.web3formsKey || '').trim();
      const fsTo   = (cfg.formsubmitTo || '').trim();
      const direct = cfg.email || '';

      // Neither relay configured — fall back to the visitor's own mail app.
      if (!key && !fsTo) {
        const body = `Name: ${payload.name}\nEmail: ${payload.email}\n\n${payload.message}`;
        window.location.href =
          `mailto:${direct}?subject=${encodeURIComponent(payload.subject)}` +
          `&body=${encodeURIComponent(body)}`;
        if (status) {
          status.textContent = 'Opening your mail app… if nothing happens, email me directly.';
          status.className = 'form-note';
        }
        return;
      }

      setPending(form, status, true);

      try {
        const { endpoint, body } = key
          ? buildWeb3Forms(key, payload)
          : buildFormSubmit(fsTo, payload);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json().catch(() => ({}));

        // FormSubmit returns success as the string "true"; Web3Forms as a
        // boolean. Normalise before deciding.
        const ok = res.ok && (data.success === true || data.success === 'true');
        if (!ok) throw new Error(data.message || `HTTP ${res.status}`);

        form.reset();

        // On the very first FormSubmit send, the service emails an activation
        // link to the owner instead of delivering. Say so plainly rather than
        // claiming the message arrived.
        const needsActivation = !key && /confirm|activat/i.test(data.message || '');

        if (status) {
          status.textContent = needsActivation
            ? 'Sent. First-time setup: check your inbox and click the confirmation link.'
            : 'Message sent. I’ll reply within a day.';
          status.className = 'form-note is-success';
        }

        if (hasGSAP() && !REDUCED) {
          gsap.fromTo(form, { scale: 0.99 }, { scale: 1, duration: 0.5, ease: 'expo.out' });
        }
      } catch (err) {
        if (status) {
          // Form relays reject file:// pages outright, and browsers block the
          // cross-origin request anyway. This only ever affects local testing —
          // once hosted the page is served over https and it works. Say so,
          // rather than showing a generic failure the developer has to guess at.
          if (location.protocol === 'file:') {
            status.innerHTML =
              'The form cannot send from a <code>file://</code> page. ' +
              'Run <code>node serve.js</code> and open ' +
              '<a href="http://localhost:5500">localhost:5500</a>, ' +
              'or test it once the site is hosted.';
          } else {
            // Never strand a real visitor — always surface the direct address.
            status.innerHTML =
              'Could not send just now. Please email me directly at ' +
              `<a href="mailto:${direct}">${direct}</a>.`;
          }
          status.className = 'form-note is-error';
        }
      } finally {
        setPending(form, status, false);
      }
    }

    /* FormSubmit — no API key required. Underscore-prefixed keys are its
       control options, not message content. */
    function buildFormSubmit(target, p) {
      return {
        endpoint: `https://formsubmit.co/ajax/${encodeURIComponent(target)}`,
        body: {
          name:    p.name,
          email:   p.email,          // becomes the Reply-To on the email
          subject: p.subject,
          message: p.message,
          _subject:  `Portfolio enquiry: ${p.subject}`,
          _template: 'table',        // readable layout in the inbox
          _captcha:  'false',        // already gated by the honeypot below
          _honey:    p.botcheck ? 'bot' : ''
        }
      };
    }

    /* Web3Forms — used only when an access key is configured. */
    function buildWeb3Forms(key, p) {
      return {
        endpoint: 'https://api.web3forms.com/submit',
        body: {
          access_key: key,
          name:    p.name,
          email:   p.email,
          subject: p.subject,
          message: p.message,
          replyto: p.email,
          from_name: 'Portfolio enquiry',
          botcheck: p.botcheck
        }
      };
    }

    /* Shared in-flight UI state for the submit button. */
    function setPending(form, status, pending) {
      const button = $('button[type="submit"]', form);
      const label  = button ? $('span', button) : null;

      if (button) button.disabled = pending;
      if (label) {
        if (pending) {
          label.dataset.idle = label.textContent;
          label.textContent = 'Sending…';
        } else {
          label.textContent = label.dataset.idle || 'Send Message';
        }
      }
      if (pending && status) {
        status.textContent = 'Sending your message…';
        status.className = 'form-note';
      }
    }
  }

  /* ======================================================================== */
  /* 15 · PORTRAIT SOURCE RESOLUTION                                          */
  /* ------------------------------------------------------------------------ */
  /* Prefers a background-removed transparent PNG when one exists.            */
  /*                                                                          */
  /*   assets/images/profile-cutout.png  → frameless floating portrait        */
  /*   assets/images/profile.jpg         → framed glass portrait (default)    */
  /*   profile-placeholder.svg           → silhouette, if neither exists      */
  /*                                                                          */
  /* Drop the cutout file in and the layout switches on its own — no markup   */
  /* or CSS edit required.                                                    */
  /* ======================================================================== */
  function initPortrait() {
    const CUTOUT = 'assets/images/profile-cutout.png';

    const probe = new Image();

    probe.onload = () => {
      // Guard against a 0-byte or corrupt file resolving as "loaded"
      if (!probe.naturalWidth) return;

      const portrait = $('.portrait');
      const heroImg  = $('.portrait__img');

      if (heroImg) {
        heroImg.src = CUTOUT;
        heroImg.classList.remove('is-placeholder');
      }

      // A real cutout needs no feather mask — swap bare mode for cutout mode.
      if (portrait) {
        portrait.classList.remove('portrait--bare');
        portrait.classList.add('portrait--cutout');
      }

      // The About avatar deliberately keeps profile.jpg: a circular crop reads
      // better as an avatar than a contained cutout floating in a disc.
    };

    // No cutout available — the framed portrait already in the markup stands.
    probe.onerror = () => {};

    probe.src = CUTOUT;

    resolveEmployerLogo();
  }

  /* ------------------------------------------------------------------------ */
  /* Employer logo on the role badge.                                          */
  /*                                                                           */
  /* Tries assets/images/logos/impex.svg, then .png. If neither exists the      */
  /* generic engineering mark already in the markup stays put — no broken       */
  /* image, no layout shift, and nothing pretending to be a company's brand.    */
  /* ------------------------------------------------------------------------ */
  function resolveEmployerLogo() {
    const CANDIDATES = [
      'assets/images/logos/impex.svg',
      'assets/images/logos/impex.png'
    ];

    const mark = $('.portrait__badge-mark');
    if (!mark) return;

    let i = 0;

    const tryNext = () => {
      if (i >= CANDIDATES.length) return;      // none found — keep the fallback
      const src = CANDIDATES[i++];

      const probe = new Image();
      probe.onload = () => {
        if (!probe.naturalWidth) { tryNext(); return; }

        const img = document.createElement('img');
        img.className = 'portrait__badge-logo';
        img.src = src;
        img.alt = '';
        img.width = 20;
        img.height = 20;
        img.decoding = 'async';

        mark.insertBefore(img, mark.firstChild);
        mark.classList.add('has-logo');          // hides the fallback via CSS
      };
      probe.onerror = tryNext;
      probe.src = src;
    };

    tryNext();
  }

  /* ======================================================================== */
  /* 16 · MISC                                                                */
  /* ======================================================================== */
  function initMisc() {
    /* Footer year, always current */
    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());

    /* Back to top */
    const toTop = $('#toTop');
    if (toTop) {
      toTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
      });
    }

    /* Anchor links: native smooth scroll, honoured by scroll-padding-top */
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  /* ======================================================================== */
  /* BOOT                                                                     */
  /* ======================================================================== */
  function boot() {
    // Things that should be live before the curtain lifts
    initCursor();
    initNav();
    initScrollProgress();
    initPortrait();
    initMisc();

    initPreloader(function afterPreloader() {
      // AOS drives the generic fade/slide/zoom reveals across all sections
      if (typeof AOS !== 'undefined') {
        AOS.init({
          duration: 850,
          easing: 'ease-out-cubic',
          once: true,
          offset: 70,
          disable: () => REDUCED
        });
      }

      if (hasST()) gsap.registerPlugin(ScrollTrigger);

      initHeroIntro();
      initTyped();
      initCounters();
      initSkills();
      initTimeline();
      initMagnetic();
      initTilt();
      initParallax();
      initFilters();
      initContactForm();

      // Layout has settled — recalculate every scroll-driven position once.
      if (hasST()) setTimeout(() => ScrollTrigger.refresh(), 350);
      if (typeof AOS !== 'undefined') setTimeout(() => AOS.refresh(), 400);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
