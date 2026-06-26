/* ============================================================
   motion-core.js
   Shared animation utilities — magnetic cursor, scroll reveals,
   marquee, counters. Used by both the AI/ML and Freelance sites.
   Respects prefers-reduced-motion throughout.
   ============================================================ */

(function () {
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Custom cursor dot + magnetic hover ---------- */
  function initCursor() {
    if (REDUCED || window.matchMedia('(pointer: coarse)').matches) return;

    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.appendChild(dot);

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let dx = mx, dy = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
    });

    function render() {
      dx += (mx - dx) * 0.18;
      dy += (my - dy) * 0.18;
      dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%,-50%) scale(${dot._scale || 1})`;
      requestAnimationFrame(render);
    }
    render();

    const magnets = document.querySelectorAll('[data-magnetic]');
    magnets.forEach((el) => {
      el.addEventListener('mouseenter', () => { dot._scale = 2.6; dot.classList.add('cursor-dot--active'); });
      el.addEventListener('mouseleave', () => { dot._scale = 1; dot.classList.remove('cursor-dot--active'); });

      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const relX = e.clientX - r.left - r.width / 2;
        const relY = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${relX * 0.18}px, ${relY * 0.25}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Scroll reveal (fade + rise) via GSAP ---------- */
  function initReveals() {
    if (!window.gsap) return;
    gsap.registerPlugin(ScrollTrigger);

    const els = document.querySelectorAll('[data-reveal]');
    els.forEach((el, i) => {
      const group = el.getAttribute('data-reveal-group');
      const delay = group ? 0 : Math.min(i * 0.04, 0.3);

      gsap.fromTo(el,
        { opacity: 0, y: REDUCED ? 0 : 28 },
        {
          opacity: 1,
          y: 0,
          duration: REDUCED ? 0.01 : 0.8,
          delay,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        }
      );
    });

    /* Staggered groups (skill pills, cards within one container) */
    document.querySelectorAll('[data-reveal-stagger]').forEach((container) => {
      const items = container.children;
      gsap.fromTo(items,
        { opacity: 0, y: REDUCED ? 0 : 20 },
        {
          opacity: 1,
          y: 0,
          duration: REDUCED ? 0.01 : 0.6,
          stagger: 0.06,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 85%',
            once: true,
          },
        }
      );
    });
  }

  /* ---------- Infinite marquee ---------- */
  function initMarquees() {
    document.querySelectorAll('[data-marquee]').forEach((track) => {
      const inner = track.querySelector('[data-marquee-inner]');
      if (!inner) return;
      /* duplicate content once for seamless loop */
      inner.innerHTML += inner.innerHTML;

      if (REDUCED || !window.gsap) return;

      const speed = parseFloat(track.getAttribute('data-marquee-speed')) || 40;
      let xPos = 0;
      let width = inner.scrollWidth / 2;

      function updateWidth() {
        width = inner.scrollWidth / 2;
      }
      updateWidth();
      window.addEventListener('resize', updateWidth);

      let lastTime = performance.now();
      function frame(now) {
        const dt = (now - lastTime) / 1000;
        lastTime = now;
        xPos -= speed * dt;
        if (Math.abs(xPos) >= width) xPos = 0;
        inner.style.transform = `translateX(${xPos}px)`;
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  /* ---------- Counter animation (for stat numbers) ---------- */
  function initCounters() {
    document.querySelectorAll('[data-counter]').forEach((el) => {
      const target = parseFloat(el.getAttribute('data-counter'));
      const decimals = el.getAttribute('data-counter-decimals') ? parseInt(el.getAttribute('data-counter-decimals')) : 0;
      const suffix = el.getAttribute('data-counter-suffix') || '';

      if (REDUCED || !window.gsap) {
        el.textContent = target.toFixed(decimals) + suffix;
        return;
      }

      gsap.registerPlugin(ScrollTrigger);
      const obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            val: target,
            duration: 1.4,
            ease: 'power2.out',
            onUpdate: () => {
              el.textContent = obj.val.toFixed(decimals) + suffix;
            },
          });
        },
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initReveals();
    initMarquees();
    initCounters();
  });
})();
