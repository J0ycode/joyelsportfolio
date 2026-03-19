/* ═══════════════════════════════════════
   JOYEL JOE JOSH — PORTFOLIO 2026
   Premium Script: Three.js · GSAP · Lenis
═══════════════════════════════════════ */

(() => {
  'use strict';

  /* ── UTILS ── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const isMobile = () => window.innerWidth <= 1024;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ══════════════════════════════════
     GSAP SETUP
  ══════════════════════════════════ */
  if (typeof gsap === 'undefined') {
    console.error('GSAP not loaded. Portfolio animations disabled.');
    window.addEventListener('load', () => {
      document.body.classList.add('no-gsap');
      if (typeof initHeroAnimations !== 'undefined') initHeroAnimations();
    });
    return;
  }

  try {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
    gsap.defaults({ ease: 'power3.out', duration: 0.9 });
  } catch (e) {
    console.error('GSAP Plugin registration failed:', e);
  }

  /* ══════════════════════════════════
     THEME
  ══════════════════════════════════ */
  const initTheme = () => {
    const html = document.documentElement;
    const syncSwitches = $$('.theme-sync');
    const saved = localStorage.getItem('portfolio-theme');
    const applyTheme = (theme) => {
      if (theme === 'gold') {
        html.setAttribute('data-theme', 'gold');
        syncSwitches.forEach(s => s.checked = true);
      } else {
        html.removeAttribute('data-theme');
        syncSwitches.forEach(s => s.checked = false);
      }
    };
    applyTheme(saved);
    syncSwitches.forEach(s => {
      s.addEventListener('change', () => {
        const next = s.checked ? 'gold' : '';
        applyTheme(next);
        if (next) localStorage.setItem('portfolio-theme', 'gold');
        else localStorage.removeItem('portfolio-theme');
      });
    });
  };
  initTheme();

  /* ══════════════════════════════════
     LENIS SMOOTH SCROLL
  ══════════════════════════════════ */
  let lenis = null;
  const initLenis = () => {
    if (isMobile() || window.matchMedia('(pointer:coarse)').matches) return;
    if (typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 1.4,
      easing: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
      smoothWheel: true,
      wheelMultiplier: 1.1,
      lerp: 0.1,
      smoothTouch: false,
    });
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.on('scroll', ScrollTrigger.update);
    ScrollTrigger.addEventListener('refreshInit', () => lenis.resize());
  };
  try {
    initLenis();
  } catch (e) {
    console.warn('Lenis init failed:', e);
  }

  /* ══════════════════════════════════
     PRELOADER
  ══════════════════════════════════ */
  const initPreloader = () => {
    const loader = $('#preloader');
    const fill = $('.preloader-fill');
    const counter = $('.preloader-counter');
    if (!loader) return;
    document.body.style.overflow = 'hidden';

    const exitPreloader = () => {
      if (!loader.parentNode) return;
      gsap.timeline({
        onComplete: () => {
          loader.remove();
          document.body.style.overflow = '';
          initHeroAnimations();
        }
      })
        .to('.preloader-inner', { opacity: 0, y: -24, duration: 0.4, ease: 'power2.in' })
        .to(loader, { yPercent: -101, duration: 0.9, ease: 'power4.inOut' }, '+=0.05');
    };

    const startCounter = () => {
      const start = Date.now(), dur = 1400;
      const tick = () => {
        const val = Math.min(100, Math.floor((Date.now() - start) / dur * 100));
        if (counter) counter.textContent = String(val).padStart(3, '0');
        if (val < 100) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    window.addEventListener('load', () => {
      requestAnimationFrame(() => { fill.style.width = '100%'; });
      startCounter();
      setTimeout(exitPreloader, 1650);
    });
    setTimeout(exitPreloader, 3400);
  };
  initPreloader();

  /* ══════════════════════════════════
     THREE.JS — INTERACTIVE PARTICLE FIELD
     Low-poly, GPU-efficient, reacts to mouse
  ══════════════════════════════════ */
  const initThreeBackground = () => {
    if (prefersReducedMotion || isMobile()) return;
    if (typeof THREE === 'undefined') { console.warn('Three.js not loaded'); return; }

    const canvas = document.createElement('canvas');
    canvas.id = 'threeBg';
    document.body.prepend(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 60;

    /* Floating particles */
    const PARTICLE_COUNT = 600;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 160;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      velocities.push({
        x: (Math.random() - 0.5) * 0.008,
        y: (Math.random() - 0.5) * 0.008,
        z: (Math.random() - 0.5) * 0.004,
      });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x00d4ff, size: 0.18,
      transparent: true, opacity: 0.55,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    /* Subtle wireframe icosahedron — foreground depth layer */
    const icGeo = new THREE.IcosahedronGeometry(12, 1);
    const icMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff, wireframe: true,
      transparent: true, opacity: 0.03,
    });
    const icosahedron = new THREE.Mesh(icGeo, icMat);
    icosahedron.position.set(28, -8, 0);
    scene.add(icosahedron);

    /* Second decorative torus */
    const torusGeo = new THREE.TorusGeometry(8, 0.8, 8, 40);
    const torusMat = new THREE.MeshBasicMaterial({
      color: 0x7df9ff, wireframe: true,
      transparent: true, opacity: 0.04,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.position.set(-32, 10, -10);
    scene.add(torus);

    /* Mouse interaction */
    let mouse = { x: 0, y: 0 };
    document.addEventListener('mousemove', e => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    /* Resize */
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, { passive: true });

    /* Scroll-based depth */
    let scrollY = 0;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

    /* Animate */
    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = Date.now() * 0.001;
      const pos = geo.attributes.position;

      /* Update particles */
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos.array[i * 3]     += velocities[i].x;
        pos.array[i * 3 + 1] += velocities[i].y;
        pos.array[i * 3 + 2] += velocities[i].z;
        /* Wrap */
        if (pos.array[i * 3]     >  80) pos.array[i * 3]     = -80;
        if (pos.array[i * 3]     < -80) pos.array[i * 3]     =  80;
        if (pos.array[i * 3 + 1] >  50) pos.array[i * 3 + 1] = -50;
        if (pos.array[i * 3 + 1] < -50) pos.array[i * 3 + 1] =  50;
      }
      pos.needsUpdate = true;

      /* Gentle camera drift with mouse */
      camera.position.x += (mouse.x * 4 - camera.position.x) * 0.03;
      camera.position.y += (mouse.y * 3 - camera.position.y) * 0.03;

      /* Scroll parallax on particles */
      particles.position.y = -scrollY * 0.02;

      /* Slow 3D object rotation */
      icosahedron.rotation.x = t * 0.15;
      icosahedron.rotation.y = t * 0.12;
      torus.rotation.x = t * 0.1;
      torus.rotation.z = t * 0.08;

      renderer.render(scene, camera);
    };
    animate();

    /* Pause when tab inactive */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(frame);
      else animate();
    });
  };
  try {
    initThreeBackground();
  } catch (e) {
    console.warn('Three.js background init failed:', e);
  }

  /* ══════════════════════════════════
     CUSTOM CURSOR
  ══════════════════════════════════ */
  const initCursor = () => {
    if (window.matchMedia('(hover:none),(pointer:coarse)').matches) return;
    const dot = $('#cursorDot'), ring = $('#cursorRing');
    if (!dot || !ring) return;
    let hasMoved = false, mx = -200, my = -200, rx = -200, ry = -200;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if (!hasMoved) { hasMoved = true; rx = mx; ry = my; document.body.classList.add('cursor-ready'); }
    }, { passive: true });
    const loop = () => {
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(loop);
    };
    loop();
    $$('a,button,.magnetic,.glass-card,input,textarea,.project-link-btn').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  };
  initCursor();

  /* ══════════════════════════════════
     SCROLL PROGRESS BAR
  ══════════════════════════════════ */
  const initScrollProgress = () => {
    const bar = $('#scrollProgress');
    if (!bar) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const max = document.documentElement.scrollHeight - window.innerHeight;
          bar.style.width = (window.scrollY / max * 100) + '%';
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  };
  initScrollProgress();

  /* ══════════════════════════════════
     NAV
  ══════════════════════════════════ */
  const initNav = () => {
    const nav = $('#nav');
    if (!nav) return;
    setTimeout(() => nav.classList.add('visible'), 200);

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          nav.classList.toggle('scrolled', window.scrollY > 60);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    const sections = $$('section[id]');
    const links = $$('.nav-link');
    let lt = false;
    window.addEventListener('scroll', () => {
      if (!lt) {
        requestAnimationFrame(() => {
          let cur = '';
          sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) cur = s.id; });
          links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${cur}`));
          lt = false;
        });
        lt = true;
      }
    }, { passive: true });

    const burger = $('#navBurger'), drawer = $('#mobileDrawer');
    if (burger && drawer) {
      burger.addEventListener('click', () => {
        const open = drawer.classList.toggle('open');
        burger.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', open);
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.style.overflow = open ? 'hidden' : '';
      });
      $$('.drawer-link').forEach(l => l.addEventListener('click', () => {
        burger.classList.remove('open'); drawer.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu');
        document.body.style.overflow = '';
      }));
    }

    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = $(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: -64, duration: 1.2 });
        else gsap.to(window, { duration: 1.1, scrollTo: { y: target, offsetY: 64 }, ease: 'power3.inOut' });
      });
    });
  };

  /* ══════════════════════════════════
     MAGNETIC BUTTONS
  ══════════════════════════════════ */
  const initMagnetic = () => {
    if (isMobile()) return;
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * 16;
        const y = ((e.clientY - r.top) / r.height - 0.5) * 16;
        gsap.to(btn, { x, y, duration: 0.3, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' }));
    });
  };

  /* ══════════════════════════════════
     ROLE CYCLER
  ══════════════════════════════════ */
  const initRoleCycle = () => {
    const el = $('#roleCycle');
    if (!el) return;
    const roles = ['systems.', 'startups.', 'solutions.', 'empires.', 'futures.'];
    let idx = 0, charIdx = 0, deleting = false;
    const type = () => {
      const cur = roles[idx];
      if (!deleting) {
        el.textContent = cur.substring(0, ++charIdx);
        if (charIdx === cur.length) { deleting = true; setTimeout(type, 2000); return; }
      } else {
        el.textContent = cur.substring(0, --charIdx);
        if (charIdx === 0) { deleting = false; idx = (idx + 1) % roles.length; setTimeout(type, 350); return; }
      }
      setTimeout(type, deleting ? 40 : 85);
    };
    setTimeout(type, 2800);
  };

  /* ══════════════════════════════════
     HEADLINE — Liquid Molecule Physics
  ══════════════════════════════════ */
  const initHeadlineGradient = () => {
    const lines = $$('.gsap-hero-line');
    if (!lines.length || isMobile()) return;

    try {
      const isGold = () => document.documentElement.getAttribute('data-theme') === 'gold';

      /* ── 5-BLOB LIQUID PHYSICS ─────────────────────────────────────────────
         Drifts on Lissajous paths. Multi-stage reactivity as requested.
      ─────────────────────────────────────────────────────────────────────── */
      const blobs = [
        { cx: 50, cy: 50, ax: 48, ay: 42, fx: 0.55, fy: 0.43, ph: 0.00, sz: '38% 160%' },
        { cx: 50, cy: 50, ax: 44, ay: 38, fx: 0.80, fy: 0.67, ph: 2.09, sz: '30% 140%' },
        { cx: 50, cy: 50, ax: 50, ay: 44, fx: 0.37, fy: 0.61, ph: 4.19, sz: '34% 150%' },
        { cx: 50, cy: 50, ax: 36, ay: 46, fx: 0.92, fy: 0.71, ph: 1.05, sz: '24% 120%' },
        { cx: 50, cy: 50, ax: 42, ay: 34, fx: 0.48, fy: 0.89, ph: 3.14, sz: '20% 100%' },
      ];

      const cyanPal = ['125,211,252', '56,189,248', '7,89,133', '186,230,253', '125,211,252'];
      const goldPal = ['255,195,20', '255,228,80', '220,160,10', '255,245,140', '210,140,5'];

      /* Mouse interaction state */
      let mx = 50, my = 50, mFactor = 0, mTarget = 0;

      document.addEventListener('mousemove', e => {
        const r = lines[0].getBoundingClientRect();
        const centerX = r.left + r.width / 2;
        const centerY = r.top + r.height / 2;
        const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        const RADIUS = 400;

        if (dist < RADIUS) {
          mTarget = 1 - dist / RADIUS;
          mx = (e.clientX - r.left) / r.width * 100;
          my = (e.clientY - r.top) / r.height * 100;
        } else {
          mTarget = 0;
        }
      }, { passive: true });

      let t = 0;
      const tick = () => {
        t += 0.011; // base time step
        /* Physics: mFactor lerp 0.055 as requested */
        mFactor += (mTarget - mFactor) * 0.055;

        const pal = isGold() ? goldPal : cyanPal;
        const alphas = [0.88, 0.72, 0.62, 0.50, 0.42];

        const layers = blobs.map((b, i) => {
          /* Viscosity: 30% slowdown when mFactor is high */
          const slowdown = 1 - mFactor * 0.30;
          const tt = t * slowdown;

          let x = b.cx + b.ax * Math.sin(b.fx * tt + b.ph);
          let y = b.cy + b.ay * Math.cos(b.fy * tt + b.ph * 0.9);

          /* Gravity and Pooling pull */
          if (mFactor > 0.001) {
            const pullStr = mFactor * (0.18 + i * 0.05);
            x += (mx - x) * pullStr;
            y += (my - y) * pullStr;
          }
          return `radial-gradient(ellipse ${b.sz} at ${x.toFixed(1)}% ${y.toFixed(1)}%, rgba(${pal[i % 5]},${alphas[i]}) 0%, transparent 70%)`;
        });

        /* Solid white base for fallback readability */
        layers.push('linear-gradient(rgba(255,255,255,1), rgba(255,255,255,1))');

        const bg = layers.join(', ');
        lines.forEach(line => {
          line.style.background = bg;
          line.style.webkitBackgroundClip = 'text';
          line.style.backgroundClip = 'text';
          line.style.webkitTextFillColor = 'transparent';
        });

        requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      console.warn('Headline liquid animation failure:', e);
      lines.forEach(line => {
        line.style.background = 'white';
        line.style.webkitTextFillColor = 'white';
      });
    }
  };


  /* ══════════════════════════════════
     HERO ANIMATIONS (cinematic reveal)
  ══════════════════════════════════ */
  const initHeroAnimations = () => {
    if (prefersReducedMotion) {
      gsap.set(['#nav','.gsap-hero-eyebrow','.gsap-hero-line','.gsap-hero-role',
        '.gsap-hero-desc','.gsap-hero-actions','.gsap-hero-stats','.gsap-hero-visual'], { opacity:1, y:0 });
      $('#nav')?.classList.add('visible');
      initRoleCycle(); initNav(); initMagnetic();
      initScrollAnimations(); initCardTilt(); initProjectGlow();
      initContactForm(); initGlobalParticles(); initOrbitAnimation();
      return;
    }

    // Start mouse-reactive gradient tracking immediately
    initHeadlineGradient();

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    tl.to('#nav', { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', onStart: () => $('#nav')?.classList.add('visible') }, 0)
      .fromTo('.gsap-hero-eyebrow',
        { opacity: 0, y: 32, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7 }, 0.05)
      .fromTo('.gsap-hero-line',
        { yPercent: 115, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: 'power4.out' }, 0.18)
      .fromTo('.gsap-hero-role',    { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.5')
      .fromTo('.gsap-hero-desc',    { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.45')
      .fromTo('.gsap-hero-actions', { opacity: 0, y: 12, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.55 }, '-=0.38')
      .fromTo('.gsap-hero-stats',   { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.35')
      .fromTo('.gsap-hero-visual',
        { opacity: 0, scale: 0.8, rotate: -12 },
        { opacity: 1, scale: 1, rotate: 0, duration: 1.1, ease: 'power3.out' }, 0.1)
      .fromTo('.orbit-planet',
        { opacity: 0, scale: 0 },
        { opacity: 1, scale: 1, duration: 0.5, stagger: { amount: 0.9, from: 'random' }, ease: 'back.out(1.8)' }, 0.8);

    /* No letter split needed — CSS gradient handles the premium look.
       The whole .gsap-hero-line animates as one clean clip-reveal unit. */

    initRoleCycle();
    initNav();
    initMagnetic();
    initScrollAnimations();
    initCardTilt();
    initProjectGlow();
    initContactForm();
    initGlobalParticles();
    initOrbitAnimation();
    initShapesParallax();
  };

  /* ══════════════════════════════════
     SCROLL ANIMATIONS
  ══════════════════════════════════ */
  const initScrollAnimations = () => {
    if (prefersReducedMotion) return;
    const once = { start: 'top 92%', toggleActions: 'play none none none' };

    /* Section tags */
    $$('.gsap-tag').forEach(el => gsap.fromTo(el,
      { opacity: 0, x: -24 },
      { opacity: 1, x: 0, duration: 0.65, scrollTrigger: { trigger: el, ...once } }
    ));

    /* Headlines — clip reveal */
    $$('.gsap-headline').forEach(el => {
      const lines = el.innerHTML.split('<br>');
      el.innerHTML = lines.map(line =>
        `<span style="display:block;overflow:hidden"><span class="headline-word" style="display:block">${line}</span></span>`
      ).join('');
      gsap.fromTo(el.querySelectorAll('.headline-word'),
        { y: '100%', autoAlpha: 0 },
        {
          y: '0%', autoAlpha: 1, stagger: 0.1, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 95%', toggleActions: 'play none none none' }
        }
      );
    });
    ScrollTrigger.refresh();

    /* About */
    gsap.fromTo('.gsap-about-text',
      { opacity: 0, x: -40 },
      { opacity: 1, x: 0, duration: 0.9, scrollTrigger: { trigger: '#about', start: 'top 90%', toggleActions: 'play none none none' } }
    );
    gsap.fromTo('.info-card',
      { opacity: 0, y: 36, scale: 0.94 },
      { opacity: 1, y: 0, scale: 1, stagger: 0.09, duration: 0.65, ease: 'back.out(1.3)',
        scrollTrigger: { trigger: '.about-cards', start: 'top 92%', toggleActions: 'play none none none' } }
    );

    /* Skills */
    $$('.gsap-group-title').forEach((el, i) => gsap.fromTo(el,
      { opacity: 0, x: -24 },
      { opacity: 1, x: 0, duration: 0.55, delay: i * 0.08,
        scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none none' } }
    ));
    $$('.skills-group').forEach(group => {
      const cards = $$('.gsap-skill', group);
      gsap.fromTo(cards,
        { opacity: 0, y: -36, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, stagger: { amount: 0.55 }, duration: 0.6, ease: 'back.out(1.3)',
          scrollTrigger: { trigger: group, start: 'top 92%', toggleActions: 'play none none none' } }
      );
    });
    $$('.skill-level').forEach(bar => {
      const lvl = bar.getAttribute('data-level');
      bar.style.setProperty('--lvl', lvl + '%');
      ScrollTrigger.create({ trigger: bar, start: 'top 95%', onEnter: () => bar.classList.add('animated') });
    });

    /* Projects */
    gsap.fromTo('.gsap-project',
      { opacity: 0, y: 60, scale: 0.92 },
      { opacity: 1, y: 0, scale: 1, stagger: 0.12, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: '.projects-grid', start: 'top 92%', toggleActions: 'play none none none' } }
    );
    gsap.fromTo('.gsap-projects-cta',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.65,
        scrollTrigger: { trigger: '.projects-cta', start: 'top 95%', toggleActions: 'play none none none' } }
    );

    /* Contact */
    gsap.fromTo('.gsap-contact-left',
      { opacity: 0, x: -60 },
      { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: '#contact', start: 'top 90%', toggleActions: 'play none none none' } }
    );
    gsap.fromTo('.gsap-contact-right',
      { opacity: 0, x: 60 },
      { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: '#contact', start: 'top 90%', toggleActions: 'play none none none' } }
    );
    gsap.fromTo('.form-field',
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.55,
        scrollTrigger: { trigger: '.contact-form', start: 'top 92%', toggleActions: 'play none none none' } }
    );

    /* Footer */
    gsap.fromTo('#footer',
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7,
        scrollTrigger: { trigger: '#footer', start: 'top 98%', toggleActions: 'play none none none' } }
    );

    /* Section parallax — subtle background depth layer */
    $$('.section').forEach(sec => {
      gsap.fromTo(sec.querySelector('.section-inner') || sec,
        { y: 0 },
        { y: -20, ease: 'none',
          scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 1.5 } }
      );
    });
  };

  /* ══════════════════════════════════
     3D CARD TILT
  ══════════════════════════════════ */
  const initCardTilt = () => {
    if (isMobile()) return;
    $$('.glass-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -10;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 10;
        gsap.to(card, { rotateX: rx, rotateY: ry, transformPerspective: 900, duration: 0.35, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.65, ease: 'elastic.out(1,0.4)' }));
    });
  };

  /* ══════════════════════════════════
     PROJECT CARD GLOW
  ══════════════════════════════════ */
  const initProjectGlow = () => {
    if (isMobile()) return;
    $$('.project-card').forEach(card => {
      const glow = $('.project-glow', card);
      if (!glow) return;
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        glow.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(0,212,255,0.12), transparent 60%)`;
      });
    });
  };

  /* ══════════════════════════════════
     CONTACT FORM
  ══════════════════════════════════ */
  const initContactForm = () => {
    const form = $('#contactForm'), btn = $('#submitBtn');
    if (!form || !btn) return;
    form.addEventListener('submit', e => {
      e.preventDefault(); let valid = true;
      $$('.form-field input,.form-field textarea', form).forEach(f => {
        f.classList.remove('error');
        if (f.required && !f.value.trim()) { f.classList.add('error'); valid = false; gsap.fromTo(f, { x: -7 }, { x: 0, duration: 0.35, ease: 'elastic.out(1,0.4)' }); }
        if (f.type === 'email' && f.value && !/\S+@\S+\.\S+/.test(f.value)) { f.classList.add('error'); valid = false; }
      });
      if (!valid) return;
      btn.disabled = true;
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>&nbsp; Sending...';
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check"></i>&nbsp; Message Sent!';
        btn.classList.add('success'); form.reset();
        setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('success'); btn.disabled = false; }, 4000);
      }, 1800);
    });
    $$('.form-field input,.form-field textarea', form).forEach(f => {
      f.addEventListener('blur', () => {
        if (f.required && !f.value.trim()) f.classList.add('error');
        else f.classList.remove('error');
      });
    });
  };

  /* ══════════════════════════════════
     GLOBAL BACKGROUND PARTICLES
  ══════════════════════════════════ */
  const initGlobalParticles = () => {
    const canvas = $('#globalParticles');
    if (!canvas || isMobile()) return;
    const ctx = canvas.getContext('2d');
    const N = 100, DIST = 150, MR = 120;
    let nodes = [], mouse = { x: -1000, y: -1000 }, reqId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      nodes = [];
      for (let i = 0; i < N; i++) nodes.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isGold = document.documentElement.getAttribute('data-theme') === 'gold';
      const rgb = isGold ? '212,175,55' : '125,211,252';
      nodes.forEach((n, i) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0) n.x = canvas.width; else if (n.x > canvas.width) n.x = 0;
        if (n.y < 0) n.y = canvas.height; else if (n.y > canvas.height) n.y = 0;

        const dx = mouse.x - n.x, dy = mouse.y - n.y, d = Math.hypot(dx, dy);
        if (d < MR) {
          n.x -= (dx / d) * ((MR - d) / MR) * 1.5;
          n.y -= (dy / d) * ((MR - d) / MR) * 1.5;
        }

        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},0.45)`; ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j], cd = Math.hypot(n.x - n2.x, n.y - n2.y);
          if (cd < DIST) {
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(${rgb},${(1 - cd / DIST) * 0.12})`;
            ctx.lineWidth = 0.6; ctx.stroke();
          }
        }
      });
      reqId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', e => {
      mouse.x = e.clientX; mouse.y = e.clientY;
    }, { passive: true });
    window.addEventListener('mouseleave', () => { mouse.x = -1000; mouse.y = -1000; });

    resize();
    draw();
    gsap.to(canvas, { opacity: 0.45, duration: 1.5, delay: 0.5 });
  };

  /* ══════════════════════════════════
     ORBIT SYSTEM (GSAP rotation)
  ══════════════════════════════════ */
  const initOrbitAnimation = () => {
    if (prefersReducedMotion || isMobile()) return;
    const sr = $('.ring-skills'), pr = $('.ring-projects');
    const sp = $$('.ring-skills .orbit-planet'), pp = $$('.ring-projects .orbit-planet');
    const all = [...sp, ...pp];
    gsap.set(all, { xPercent: -50, yPercent: -50 });

    const stw = gsap.to(sr, { rotation: 360, duration: 40, repeat: -1, ease: 'none' }).timeScale(0);
    const ptw = gsap.to(pr, { rotation: -360, duration: 60, repeat: -1, ease: 'none' }).timeScale(0);
    const sct = gsap.to(sp, { rotation: -360, duration: 40, repeat: -1, ease: 'none' }).timeScale(0);
    const pct = gsap.to(pp, { rotation: 360, duration: 60, repeat: -1, ease: 'none' }).timeScale(0);
    const tweens = [stw, ptw, sct, pct];

    tweens.forEach(t => gsap.to(t, { timeScale: 1, duration: 2.5, ease: 'power2.inOut', delay: 1.2 }));

    all.forEach(p => {
      p.addEventListener('mouseenter', () => tweens.forEach(t => gsap.to(t, { timeScale: 0.08, duration: 0.8, ease: 'power2.out' })));
      p.addEventListener('mouseleave', () => tweens.forEach(t => gsap.to(t, { timeScale: 1, duration: 1.2, ease: 'power2.inOut' })));
    });
  };

  /* ══════════════════════════════════
     HERO SHAPES PARALLAX
  ══════════════════════════════════ */
  const initShapesParallax = () => {
    if (isMobile()) return;
    document.addEventListener('mousemove', e => {
      const mx = (e.clientX / window.innerWidth - 0.5);
      const my = (e.clientY / window.innerHeight - 0.5);
      gsap.to('.shape-3', { x: mx * 22, y: my * 22, duration: 1.5, ease: 'power2.out' });
      gsap.to('.shape-1', { x: mx * 12, y: my * 8, duration: 2, ease: 'power2.out' });
    }, { passive: true });
  };

  /* ══════════════════════════════════
     RESIZE HANDLER
  ══════════════════════════════════ */
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => ScrollTrigger.refresh(), 250);
  }, { passive: true });

})();
