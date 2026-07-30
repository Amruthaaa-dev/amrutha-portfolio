/* ============================================================================
   THREE.JS — global ambient WebGL background
   ----------------------------------------------------------------------------
   A slowly rotating depth-field of points with a parallax response to the
   pointer. Built for cost, not spectacle:
     · additive points, no lights, no shadows, single draw call
     · particle count scales with viewport
     · render loop pauses when the tab is hidden
     · silently skipped on reduced-motion, tiny screens, or missing WebGL
   ========================================================================== */

(function initWebGLBackground() {
  function boot() {
    const canvas = document.getElementById('webgl-bg');
    if (!canvas) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tooSmall = window.innerWidth < 640;

    if (typeof THREE === 'undefined' || reduced || tooSmall) {
      canvas.style.display = 'none';
      return;
    }

    /* ── Renderer ───────────────────────────────────────────────────────── */
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,          // points don't need MSAA — saves fill rate
        powerPreference: 'low-power'
      });
    } catch (err) {
      canvas.style.display = 'none';
      return;                      // No WebGL context — the CSS aurora carries the look
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    /* ── Scene & camera ─────────────────────────────────────────────────── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 22;

    /* ── Point cloud ────────────────────────────────────────────────────── */
    const COUNT = window.innerWidth < 1024 ? 520 : 900;
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);

    const cWhite  = new THREE.Color('#ffffff');
    const cSilver = new THREE.Color('#9AA3B4');
    const cGold   = new THREE.Color('#C9A227');

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;

      // Distribute inside a flattened spherical shell for a sense of depth
      const radius = 12 + Math.random() * 20;
      const theta  = Math.random() * Math.PI * 2;
      const phi    = Math.acos(2 * Math.random() - 1);

      positions[i3]     = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.62;
      positions[i3 + 2] = radius * Math.cos(phi) * 0.55;

      // Mostly cool silver dust, a minority of white sparks and the odd gold
      // ember. Gold on every particle turned the whole field yellow.
      const roll = Math.random();
      const c = roll > 0.9 ? cGold : (roll > 0.72 ? cWhite : cSilver);
      colors[i3]     = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.085,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    /* ── Pointer parallax (eased toward the target each frame) ──────────── */
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    window.addEventListener('pointermove', (e) => {
      pointer.tx = (e.clientX / window.innerWidth  - 0.5) * 2;
      pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    /* ── Scroll drift — the field sinks slightly as you travel down ─────── */
    let scrollNorm = 0;
    window.addEventListener('scroll', () => {
      const max = document.body.scrollHeight - window.innerHeight;
      scrollNorm = max > 0 ? window.scrollY / max : 0;
    }, { passive: true });

    /* ── Loop ───────────────────────────────────────────────────────────── */
    let rafId = null;
    let running = true;
    let t = 0;

    function render() {
      t += 0.0016;

      pointer.x += (pointer.tx - pointer.x) * 0.045;
      pointer.y += (pointer.ty - pointer.y) * 0.045;

      points.rotation.y = t + pointer.x * 0.28;
      points.rotation.x = Math.sin(t * 0.6) * 0.08 + pointer.y * 0.16;
      points.position.y = -scrollNorm * 6;

      camera.position.x = pointer.x * 1.1;
      camera.position.y = -pointer.y * 0.8;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(render);
    }
    render();

    /* ── Resize (debounced) ─────────────────────────────────────────────── */
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight, false);
      }, 180);
    }, { passive: true });

    /* ── Pause offscreen: no cycles burned on a hidden tab ──────────────── */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && running) {
        cancelAnimationFrame(rafId);
        running = false;
      } else if (!document.hidden && !running) {
        running = true;
        render();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
