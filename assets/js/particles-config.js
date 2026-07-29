/* ============================================================================
   PARTICLES.JS — hero-scoped ambient particle field
   ----------------------------------------------------------------------------
   Deliberately restrained: a sparse, slow, champagne-gold constellation that reads as
   atmosphere rather than decoration. Density scales down on small screens and
   the whole layer is skipped for reduced-motion users.
   ========================================================================== */

(function initParticles() {
  const HOST = 'particles-js';

  function boot() {
    const host = document.getElementById(HOST);
    if (!host || typeof particlesJS === 'undefined') return;

    // Respect motion preferences — no animated field at all.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      host.remove();
      return;
    }

    const isSmall = window.innerWidth < 768;

    particlesJS(HOST, {
      particles: {
        number: {
          value: isSmall ? 26 : 55,
          density: { enable: true, value_area: 900 }
        },
        color: { value: ['#C9A227', '#E8C766', '#FFFFFF'] },
        shape: { type: 'circle' },
        opacity: {
          value: 0.35,
          random: true,
          anim: { enable: true, speed: 0.5, opacity_min: 0.08, sync: false }
        },
        size: {
          value: 2.4,
          random: true,
          anim: { enable: true, speed: 1.2, size_min: 0.4, sync: false }
        },
        line_linked: {
          enable: true,
          distance: isSmall ? 110 : 150,
          color: '#C9A227',
          opacity: 0.14,
          width: 1
        },
        move: {
          enable: true,
          speed: 0.7,
          direction: 'none',
          random: true,
          straight: false,
          out_mode: 'out',
          bounce: false
        }
      },
      interactivity: {
        detect_on: 'window',
        events: {
          onhover: { enable: !isSmall, mode: 'grab' },
          onclick: { enable: false },
          resize: true
        },
        modes: {
          grab: { distance: 180, line_linked: { opacity: 0.32 } }
        }
      },
      retina_detect: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
