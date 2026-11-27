(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Year
  $('#year').textContent = new Date().getFullYear();

  // Sticky header shadow
  const header = $('#header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile nav
  const burger = $('#burger');
  const nav = $('#nav');
  const setNav = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setNav(false)));

  // Open / closed status (Milton is in America/Toronto)
  const HOURS = { 0: [11, 16], 1: [9, 20], 2: [9, 20], 3: [9, 20], 4: [9, 20], 5: [9, 20], 6: [9, 17] };
  const fmt = h => (h > 12 ? h - 12 : h) + (h >= 12 ? ' p.m.' : ' a.m.');
  function torontoNow() {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      const get = t => parts.find(p => p.type === t).value;
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      return { day, mins: (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10) };
    } catch (e) {
      const d = new Date();
      return { day: d.getDay(), mins: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function updateStatus() {
    const { day, mins } = torontoNow();
    const [o, c] = HOURS[day];
    const status = $('#openStatus');
    const text = $('.status__text', status);
    const open = mins >= o * 60 && mins < c * 60;
    status.classList.toggle('is-open', open);
    status.classList.toggle('is-closed', !open);
    if (open) text.textContent = `Open now · until ${fmt(c)}`;
    else {
      const tomorrow = mins < o * 60 ? null : HOURS[(day + 1) % 7];
      text.textContent = tomorrow ? `Closed · opens tomorrow ${fmt(tomorrow[0])}` : `Closed · opens today ${fmt(o)}`;
    }
    $$('#hoursTable tr').forEach(tr => tr.classList.toggle('is-today', tr.dataset.days.split(',').map(Number).includes(day)));
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  // Hero bubbles
  const bubbles = $('.hero__bubbles');
  if (!reduced && bubbles) {
    for (let i = 0; i < 18; i++) {
      const b = document.createElement('span');
      const size = 6 + Math.random() * 26;
      b.className = 'bubble';
      b.style.width = b.style.height = size + 'px';
      b.style.left = Math.random() * 100 + '%';
      b.style.animationDuration = 9 + Math.random() * 12 + 's';
      b.style.animationDelay = -Math.random() * 20 + 's';
      b.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
      bubbles.appendChild(b);
    }
  }

  // Reveal on scroll + counters
  const countUp = (el) => {
    const target = +el.dataset.count;
    if (reduced) { el.textContent = target; return; }
    const start = performance.now();
    const step = (t) => {
      const p = Math.min((t - start) / 1400, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
      el.style.transitionDelay = (siblings.indexOf(el) % 6) * 70 + 'ms';
      el.classList.add('is-in');
      const c = $('[data-count]', el);
      if (c) countUp(c);
      io.unobserve(el);
    });
  }, { threshold: .15, rootMargin: '0px 0px -40px 0px' }) : null;
  $$('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('is-in'));
  if (!io) $$('[data-count]').forEach(countUp);

  // Water problem solver
  const PROBLEMS = {
    hard: { color: '#cfe3ea', cause: 'Hardness: calcium & magnesium', title: 'Scale, spots and dull laundry', body: 'Hard water leaves crusty scale on taps and kettles, spots on glassware, and film on the shower. It also wears down your water heater and dishwasher faster.', fix: 'A properly sized water softener' },
    iron: { color: '#d8a26b', cause: 'Dissolved iron', title: 'Orange and brown stains', body: 'Iron in well water stains sinks, toilets and laundry a rusty orange, and gives water a metallic taste.', fix: 'Chemical-free iron filter & media' },
    sulphur: { color: '#d9d39a', cause: 'Hydrogen sulphide', title: 'That dreaded rotten-egg smell', body: 'Sulphur makes water smell like rotten eggs, especially hot water. It is common in wells around Halton.', fix: 'Chemical-free iron & sulphur filtration' },
    chlorine: { color: '#bde3f2', cause: 'Chlorine & chemicals', title: 'Pool-like taste and smell', body: 'Municipal treatment keeps water safe, but chlorine can leave a taste and smell that dries out skin and hair in the shower.', fix: 'Whole-home chlorine filtration + RO drinking water' },
    bacteria: { color: '#b9d7b0', cause: 'Bacteria in well water', title: 'Unsafe well or cottage water', body: 'Private wells and cottage supplies can pick up bacteria. You often can\'t see, smell or taste it, so testing matters.', fix: 'UV light disinfection system' },
    tannins: { color: '#c79a63', cause: 'Tannins: organic matter', title: 'Tea-coloured, brown water', body: 'Decaying leaves and organic matter can turn well water a yellow-brown tea colour that stains fixtures and laundry.', fix: 'Tannin filter for home or cottage' }
  };
  const solver = $('.solver');
  const liquid = $('#solverLiquid');
  let fixTimer;
  function showProblem(key) {
    const p = PROBLEMS[key];
    $('#solverCause').textContent = p.cause;
    $('#solverTitle').textContent = p.title;
    $('#solverBody').textContent = p.body;
    $('#solverFix').textContent = p.fix;
    $('#solverBook').dataset.concern = key;
    solver.classList.remove('is-fixed');
    liquid.style.setProperty('--liquid', p.color);
    clearTimeout(fixTimer);
    if (!reduced) fixTimer = setTimeout(() => solver.classList.add('is-fixed'), 1600);
  }
  $$('.solver__tabs button').forEach(btn => btn.addEventListener('click', () => {
    $$('.solver__tabs button').forEach(b => b.setAttribute('aria-selected', String(b === btn)));
    showProblem(btn.dataset.p);
  }));
  showProblem('hard');

  // Softener quiz
  const boxes = $$('#quizForm input');
  const fill = $('#meterFill');
  const result = $('#quizResult');
  const updateQuiz = () => {
    const n = boxes.filter(b => b.checked).length;
    const pct = n / boxes.length * 100;
    fill.style.width = pct + '%';
    fill.style.backgroundPosition = (100 - pct) + '% 0';
    if (n === 0) result.textContent = 'Tick a box to get started.';
    else if (n <= 2) result.innerHTML = `${n} sign${n > 1 ? 's' : ''}. Your water may be on the hard side. A <a href="#book" data-concern="hard">free water test</a> will tell you for sure.`;
    else if (n <= 4) result.innerHTML = `${n} signs. A softener would likely make a real difference. <a href="#book" data-concern="hard">Book your free test</a>.`;
    else result.innerHTML = `${n} signs. Your home is asking for a softener! <a href="tel:9056938820">Call 905-693-8820</a> and we'll come test your water for free.`;
  };
  boxes.forEach(b => b.addEventListener('change', updateQuiz));

  // Cups tracker (remembered for today only, per browser)
  const cups = $$('#cupsRow button');
  const hint = $('#cupsHint');
  const key = 'tws-cups-' + new Date().toDateString();
  let filled = 0;
  try { filled = +localStorage.getItem(key) || 0; } catch (e) {}
  const renderCups = () => {
    cups.forEach((c, i) => { c.classList.toggle('is-full', i < filled); c.setAttribute('aria-pressed', String(i < filled)); });
    hint.textContent = filled === 0 ? 'Tap a cup each time you finish a glass today.'
      : filled >= 8 ? 'All 8 cups done. Nicely hydrated! 💧'
      : `${filled} of 8 cups today. Keep going!`;
  };
  cups.forEach((c, i) => c.addEventListener('click', () => {
    filled = filled === i + 1 ? i : i + 1;
    try { localStorage.setItem(key, filled); } catch (e) {}
    renderCups();
  }));
  renderCups();

  // Contact form opens a pre-filled email
  $('#contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const subject = `${f.topic.value}: message from ${f.name.value}`;
    const body = `${f.message.value}\n\n${f.name.value}\n${f.email.value}`;
    window.location.href = `mailto:goodwater@thewaterstoremilton.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();

// Interactive hero water: drag, tap, hover and touch bubbles
(() => {
  const hero = document.querySelector('.hero');
  const wrap = document.getElementById('jugWrap');
  const tiltG = document.getElementById('jugTilt');
  const levelG = document.getElementById('jugLevel');
  const front = document.getElementById('waveFront');
  const back = document.getElementById('waveBack');
  const inner = document.getElementById('jugBubbles');
  const splashEl = document.getElementById('splash');
  const bubbles = document.querySelector('.hero__bubbles');
  const heroWaves = document.querySelectorAll('.hero__wave path');
  if (!hero || !wrap || !tiltG || !front) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const SVGNS = 'http://www.w3.org/2000/svg';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  let waterA = 0, waterV = 0;   // surface angle relative to the jug, and its velocity
  let level = 0, levelV = 0;    // up/down slosh
  let energy = 8;               // drives wave height and speed
  let phase = 0, jugA = 0;
  let dragTilt = 0, hoverTilt = 0;
  let dragging = false, running = true;
  let lastInput = -1e9, hovering = false;
  const kick = (e) => { energy = Math.min(46, energy + e); };
  const touched = () => { lastInput = performance.now(); };


  // Waves drawn each frame so their height reacts to motion
  function wavePath(y0, amp, ph, k2) {
    let d = '';
    for (let x = -320; x <= 640; x += 16) {
      const y = y0 + Math.sin(x * 0.0393 + ph) * amp + Math.sin(x * k2 - ph * 1.4) * amp * 0.45;
      d += (x === -320 ? 'M' : 'L') + x + ' ' + y.toFixed(1) + ' ';
    }
    return d + 'V 760 H -320 Z';
  }

  // Bubbles rising inside the jug
  const inBubbles = [];
  function addInnerBubble() {
    if (inBubbles.length > 40) return;
    const c = document.createElementNS(SVGNS, 'circle');
    const b = { el: c, x: 80 + Math.random() * 160, y: 330 + Math.random() * 60, r: 2 + Math.random() * 5, v: .8 + Math.random() * 1.6, w: Math.random() * 6 };
    c.setAttribute('r', b.r);
    c.setAttribute('fill', 'rgba(255,255,255,.75)');
    inner.appendChild(c);
    inBubbles.push(b);
  }

  // Splash out of the jug mouth
  function splash(power = 1) {
    const n = Math.round(8 + power * 10);
    for (let i = 0; i < n; i++) {
      const d = document.createElement('span');
      d.className = 'drop';
      const dir = (Math.random() - .5) * 2.2 + clamp(-waterA / 20, -1.2, 1.2);
      d.style.setProperty('--dx', dir * (50 + Math.random() * 90 * power) + 'px');
      d.style.setProperty('--dy', -(60 + Math.random() * 110 * power) + 'px');
      d.style.setProperty('--s', 8 + Math.random() * 12 + 'px');
      d.style.animationDuration = 1 + Math.random() * .4 + 's';
      d.style.animationDelay = Math.random() * 90 + 'ms';
      splashEl.appendChild(d);
      setTimeout(() => d.remove(), 1600);
    }
    for (let i = 0; i < 6 * power; i++) addInnerBubble();
    levelV -= 6 * power;
    waterV += (Math.random() - .5) * 16 * power;
    kick(18 * power);
  }

  document.addEventListener('lab:splash', () => splash(1.3));

  // Bubbles + ripples under the finger / cursor
  let lastBubble = 0;
  function bubbleAt(x, y, force) {
    const now = performance.now();
    if (!force && now - lastBubble < 45) return;
    lastBubble = now;
    const r = hero.getBoundingClientRect();
    const b = document.createElement('span');
    const size = 12 + Math.random() * 30;
    b.className = 'bubble bubble--touch';
    b.style.width = b.style.height = size + 'px';
    b.style.left = x - r.left + (Math.random() - .5) * 20 + 'px';
    b.style.top = y - r.top + (Math.random() - .5) * 20 + 'px';
    b.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
    bubbles.appendChild(b);
    setTimeout(() => b.remove(), 1700);
  }
  function rippleAt(x, y) {
    const r = hero.getBoundingClientRect();
    const rp = document.createElement('span');
    rp.className = 'ripple';
    rp.style.left = x - r.left + 'px';
    rp.style.top = y - r.top + 'px';
    bubbles.appendChild(rp);
    setTimeout(() => rp.remove(), 950);
  }

  let lastMX = null;
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    if (e.pointerType === 'mouse' && !dragging) {
      hovering = true;
      hoverTilt = ((e.clientX - r.left) / r.width - .5) * 40;
      if (lastMX !== null) waterV -= clamp(e.clientX - lastMX, -40, 40) * .06;
      lastMX = e.clientX;
      touched();
    }
    bubbleAt(e.clientX, e.clientY);
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { hoverTilt = 0; hovering = false; lastMX = null; });
  hero.addEventListener('pointerdown', (e) => {
    rippleAt(e.clientX, e.clientY);
    for (let i = 0; i < 6; i++) bubbleAt(e.clientX, e.clientY, true);
    touched();
  });

  // Drag the jug to tip it; quick tap = splash
  let startX = 0, lastX = 0, lastT = 0, downT = 0, moved = 0;
  wrap.addEventListener('pointerdown', (e) => {
    dragging = true; moved = 0;
    startX = lastX = e.clientX; lastT = downT = performance.now();
    wrap.classList.add('is-dragging');
    try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
  });
  wrap.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    dragTilt = clamp(dx / 2.5, -40, 40);
    const vx = (e.clientX - lastX) / Math.max(now - lastT, 1);
    waterV -= vx * 2;
    kick(Math.abs(vx) * 3);
    if (Math.abs(vx) > 1.6) splash(.6);
    lastX = e.clientX; lastT = now; touched();
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    wrap.classList.remove('is-dragging');
    if (moved < 8 && performance.now() - downT < 350) splash(1.2);
    else { waterV += dragTilt * .5; kick(12); }
    dragTilt = 0;
  };
  wrap.addEventListener('pointerup', endDrag);
  wrap.addEventListener('pointercancel', endDrag);


  // Animation loop
  let t0 = performance.now();
  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - t0) / 16.67, 3); t0 = now;
    const idle = now - lastInput > 2500;
    let jugTarget = dragging ? dragTilt : hovering ? hoverTilt : 0;
    if (idle) jugTarget = Math.sin(now / 1100) * 12; // gentle rocking so it always looks alive
    jugA += (jugTarget - jugA) * .14 * dt;
    const target = clamp(-jugA, -42, 42);
    waterV += (target - waterA) * .045 * dt;
    waterV *= Math.pow(.95, dt);
    waterA += waterV * dt;
    levelV += -level * .07 * dt;
    levelV *= Math.pow(.92, dt);
    level += levelV * dt;
    energy += (8 + Math.abs(waterV) * 2.5 - energy) * .03 * dt;
    phase += (.05 + energy * .006) * dt;
    const amp = clamp(4 + energy * .55, 4, 30);
    front.setAttribute('d', wavePath(175, amp, phase, .021));
    back.setAttribute('d', wavePath(166, amp * .8, -phase * .8 + 1.7, .027));
    tiltG.setAttribute('transform', `rotate(${waterA.toFixed(2)} 160 175)`);
    levelG.setAttribute('transform', `translate(0 ${clamp(level, -40, 40).toFixed(2)})`);
    wrap.style.transform = `rotate(${jugA.toFixed(2)}deg)`;
    // inner bubbles
    if (Math.random() < .04 + energy * .004) addInnerBubble();
    const surface = 178 + level - amp;
    for (let i = inBubbles.length - 1; i >= 0; i--) {
      const b = inBubbles[i];
      b.y -= b.v * dt * (1 + energy * .03);
      b.w += .08 * dt;
      b.el.setAttribute('cx', (b.x + Math.sin(b.w) * 4).toFixed(1));
      b.el.setAttribute('cy', b.y.toFixed(1));
      if (b.y < surface) { b.el.remove(); inBubbles.splice(i, 1); }
    }
    const shift = clamp(jugA * .8, -40, 40);
    bubbles.style.transform = `translateX(${(-shift).toFixed(1)}px)`;
    if (heroWaves[0]) heroWaves[0].style.transform = `translateX(${(shift * 1.4).toFixed(1)}px)`;
    if (heroWaves[1]) heroWaves[1].style.transform = `translateX(${(-shift * .8).toFixed(1)}px)`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !running) { running = true; t0 = performance.now(); requestAnimationFrame(frame); }
      running = en.isIntersecting;
    }).observe(hero);
  }
  // A splash on load so visitors see it's alive
  setTimeout(() => { waterV += 10; splash(.9); }, 900);
})();

// Refill station: pick a size and watch it fill
(() => {
  const stage = document.getElementById('fillStage');
  if (!stage) return;
  const $ = (id) => document.getElementById(id);
  const SVGNS = 'http://www.w3.org/2000/svg';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CX = 160, B = 370;

  const SIZES = {
    1:  { w: 58,  h: 150, nw: 24, nh: 22, sh: 26, r: 12, extra: 'none' },
    4:  { w: 112, h: 190, nw: 34, nh: 20, sh: 32, r: 16, extra: 'handle' },
    11: { w: 142, h: 228, nw: 50, nh: 22, sh: 42, r: 22, extra: 'ridge1' },
    18: { w: 178, h: 272, nw: 56, nh: 26, sh: 54, r: 28, extra: 'ridges' }
  };
  function geo(s) {
    const T = B - s.h, L = CX - s.w / 2, R = CX + s.w / 2, nl = CX - s.nw / 2, nr = CX + s.nw / 2;
    const neckBase = T + s.nh, shEnd = neckBase + s.sh;
    return { T, L, R, nl, nr, neckBase, shEnd };
  }
  function bottlePath(s) {
    const g = geo(s);
    return `M${g.nl} ${g.T} L${g.nl} ${g.neckBase} C${g.nl} ${g.neckBase + s.sh * .55} ${g.L} ${g.neckBase + s.sh * .35} ${g.L} ${g.shEnd} ` +
      `L${g.L} ${B - s.r} Q${g.L} ${B} ${g.L + s.r} ${B} L${g.R - s.r} ${B} Q${g.R} ${B} ${g.R} ${B - s.r} ` +
      `L${g.R} ${g.shEnd} C${g.R} ${g.neckBase + s.sh * .35} ${g.nr} ${g.neckBase + s.sh * .55} ${g.nr} ${g.neckBase} L${g.nr} ${g.T} Z`;
  }
  function extraPath(s) {
    const g = geo(s);
    if (s.extra === 'handle') {
      const y1 = g.shEnd + 6, y2 = g.shEnd + 60;
      return `M${g.R - 4} ${y1} C${g.R + 30} ${y1} ${g.R + 30} ${y2} ${g.R - 4} ${y2}`;
    }
    const ys = s.extra === 'ridges' ? [.42, .62, .82] : s.extra === 'ridge1' ? [.62] : [];
    return ys.map(f => { const y = g.shEnd + (B - g.shEnd) * f; return `M${g.L + 6} ${y} L${g.R - 6} ${y}`; }).join(' ');
  }

  // Size buttons get true-to-scale icons
  const buttons = [...document.querySelectorAll('.size')];
  buttons.forEach(btn => {
    const s = SIZES[btn.dataset.l];
    btn.querySelector('.size__icon').innerHTML = `<svg viewBox="20 90 280 290" aria-hidden="true"><path d="${bottlePath(s)}"/></svg>`;
  });

  const el = {
    clip: $('bottleClipPath'), outline: $('bottleOutline'), extra: $('bottleExtra'), shine: $('bottleShine'),
    cap: $('bottleCap'), group: $('bottleGroup'), wave: $('fillWave'), waveBack: $('fillWaveBack'),
    bubbles: $('fillBubbles'), stream: $('stream'), light: $('fillLight'),
    litres: $('fillLitres'), capLabel: $('fillCap'), done: $('fillDone'),
    stat: $('fillStat')
  };

  let size = 18, s = SIZES[18], g = geo(s);
  let progress = 0, filling = false, fillStart = 0, duration = 3000;
  let phase = 0, turb = 0, streamLen = 0, streamY = 70, visible = false;
  const inner = [];

  function setShape(litres) {
    size = litres; s = SIZES[litres]; g = geo(s);
    const d = bottlePath(s);
    el.clip.setAttribute('d', d);
    el.outline.setAttribute('d', d);
    el.extra.setAttribute('d', extraPath(s));
    el.shine.setAttribute('d', `M${g.L + 14} ${g.shEnd + 14} L${g.L + 14} ${B - s.r - 10}`);
    el.cap.setAttribute('x', g.nl - 4);
    el.cap.setAttribute('y', g.T - 12);
    el.cap.setAttribute('width', s.nw + 8);
    el.capLabel.textContent = litres;
    const cups = Math.round(litres / 0.237);
    const days = Math.floor(cups / 8);
    el.stat.innerHTML = cups >= 8
      ? `<span>${cups}</span> cups per fill. That's about <span>${days}</span> ${days === 1 ? 'day' : 'days'} of 8 cups for one person.`
      : `<span>${cups}</span> cups per fill. Perfect for your bag, desk or the gym.`;
    inner.splice(0).forEach(b => b.el.remove());
  }

  function startFill() {
    progress = 0;
    filling = true;
    fillStart = performance.now();
    duration = 1000 + 700 * Math.sqrt(size);
    el.cap.classList.remove('is-on');
    el.done.classList.remove('is-on');
    el.light.setAttribute('fill', '#4cc3f0');
    if (reduced) { progress = 1; finish(); render(performance.now()); }
  }
  function finish() {
    filling = false;
    progress = 1;
    el.light.setAttribute('fill', '#3ee08f');
    setTimeout(() => { el.cap.classList.add('is-on'); el.done.classList.add('is-on'); }, reduced ? 0 : 250);
    turb = Math.max(turb, 6);
  }

  function select(btn) {
    buttons.forEach(b => b.setAttribute('aria-checked', String(b === btn)));
    setShape(+btn.dataset.l);
    el.group.classList.remove('is-swap');
    void el.group.getBBox();
    el.group.classList.add('is-swap');
    startFill();
  }
  buttons.forEach(btn => btn.addEventListener('click', () => select(btn)));
  // Arrow keys move between sizes (radio group behaviour)
  buttons.forEach((btn, i) => btn.addEventListener('keydown', (e) => {
    const k = e.key;
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(k)) return;
    e.preventDefault();
    const n = buttons[(i + (k === 'ArrowRight' || k === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length];
    n.focus(); select(n);
  }));

  // Tap / drag the stage: refill, or slosh the water if it's still pouring
  let lastX = null;
  stage.addEventListener('click', () => { if (!filling) startFill(); else turb += 6; });
  stage.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startFill(); } });
  stage.addEventListener('pointermove', (e) => {
    if (lastX !== null) turb = Math.min(14, turb + Math.abs(e.clientX - lastX) * .08);
    lastX = e.clientX;
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { lastX = null; });

  function wave(y, amp, ph) {
    let d = '';
    for (let x = 0; x <= 320; x += 10) {
      const yy = y + Math.sin(x * .05 + ph) * amp + Math.sin(x * .023 - ph * 1.3) * amp * .5;
      d += (x ? 'L' : 'M') + x + ' ' + yy.toFixed(1) + ' ';
    }
    return d + 'V 400 H 0 Z';
  }

  function render(now) {
    if (filling) {
      const t = Math.min((now - fillStart) / duration, 1);
      progress = 1 - Math.pow(1 - t, 1.6);
      if (t >= 1) finish();
    }
    const top = g.neckBase + 6;
    const surface = B - (B - top) * progress;
    // stream from nozzle to the water; when the tap shuts off the last of it falls in
    if (filling) {
      streamY = 70;
      streamLen += (Math.max(0, surface - 70) - streamLen) * .35;
    } else if (streamLen > 0) {
      streamY += 14; streamLen -= 14;
    }
    el.stream.setAttribute('y', streamY.toFixed(1));
    el.stream.setAttribute('height', Math.max(0, streamLen).toFixed(1));

    turb = turb * .96 + (filling ? .5 : 0);
    phase += .06 + turb * .012;
    const amp = progress > 0 ? Math.min(2 + turb * .9, 12) : 0;
    el.wave.setAttribute('d', wave(surface, amp, phase));
    el.waveBack.setAttribute('d', wave(surface - 4, amp * .8, -phase * .8 + 1.5));
    el.litres.textContent = (progress * size).toFixed(1);

    // bubbles where the stream hits
    if (filling && progress > .02 && Math.random() < .5 && inner.length < 50) {
      const c = document.createElementNS(SVGNS, 'circle');
      const b = { el: c, x: CX + (Math.random() - .5) * 30, y: surface + 10 + Math.random() * 40, v: .6 + Math.random() * 1.4, r: 1.5 + Math.random() * 4, w: Math.random() * 6 };
      c.setAttribute('r', b.r); c.setAttribute('fill', 'rgba(255,255,255,.8)');
      el.bubbles.appendChild(c); inner.push(b);
    }
    for (let i = inner.length - 1; i >= 0; i--) {
      const b = inner[i];
      b.y -= b.v; b.w += .1;
      b.el.setAttribute('cx', (b.x + Math.sin(b.w) * 3).toFixed(1));
      b.el.setAttribute('cy', b.y.toFixed(1));
      if (b.y < surface + 2) { b.el.remove(); inner.splice(i, 1); }
    }
  }

  function loop(now) {
    if (visible || filling) render(now);
    requestAnimationFrame(loop);
  }

  setShape(18);
  render(performance.now());
  requestAnimationFrame(loop);
  let started = false;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible && !started) { started = true; startFill(); }
  }, { threshold: .35 }) : null;
  if (io) io.observe(stage); else { visible = true; startFill(); }
})();

// Hero water lab: each service shows the problem, then fixes it in the jug
(() => {
  const card = document.getElementById('labCard');
  if (!card) return;
  const $ = (id) => document.getElementById(id);
  const SVGNS = 'http://www.w3.org/2000/svg';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = {
    kicker: $('labKicker'), title: $('labTitle'), metric: $('labMetric'), value: $('labValue'), unit: $('labUnit'),
    barWrap: $('labBarWrap'), bar: $('labBar'), run: $('labRun'), cta: $('labCta'), note: $('labNote'),
    top: $('jwTop'), bot: $('jwBot'), back: $('waveBack'), parts: $('labParticles'),
    scale: $('labScale'), uv: $('labUV'), sweep: $('labSweep'), stink: $('labStink'), strip: $('labStrip'),
    big: $('labelBig'), small: $('labelSmall'), wrap: $('jugWrap')
  };
  const chips = [...document.querySelectorAll('.lab-chip')];
  const dock = document.querySelector('.lab-dock');
  const pads = el.strip ? [...el.strip.querySelectorAll('.pad')] : [];

  const CLEAN = { top: '#4cc3f0', bot: '#1673c9', back: '#7fd6f7' };
  const MODES = {
    ro: {
      kicker: 'Reverse osmosis', problem: 'Cloudy water full of dissolved solids.', done: 'Crisp, clean RO water.',
      from: 340, to: 12, dec: 0, unit: 'ppm dissolved solids', barFrom: .9, barTo: .06,
      dirty: { top: '#9fbab0', bot: '#57756d', back: '#b9cbc4' }, clean: CLEAN,
      particles: 'sediment', count: 46, fx: 'sweep', run: 'Run the RO filter',
      cta: ['#products', 'See RO systems, from $398 →'], label: ['RO', 'FILTERED']
    },
    alkaline: {
      kicker: 'Alkaline water', problem: 'Plain filtered water sits around pH 7.', done: 'Alkaline water, ready to drink.',
      from: 7.0, to: 9.5, dec: 1, unit: 'pH', barFrom: .5, barTo: .95, good: true,
      dirty: { top: '#a9e1f3', bot: '#5ba7d9', back: '#c8edf9' }, clean: { top: '#5fe3cf', bot: '#128fb4', back: '#9cf0e2' },
      particles: null, count: 0, fx: 'minerals', run: 'Add minerals',
      cta: ['#refills', 'Fill up at our U-Fill station →'], label: ['pH 9.5', 'ALKALINE']
    },
    soften: {
      kicker: 'Water softener', problem: 'Hard water leaves chalky scale on everything.', done: 'Soft water. No more scale.',
      from: 20, to: 0, dec: 0, unit: 'grains of hardness', barFrom: .92, barTo: 0,
      dirty: { top: '#d0e2e7', bot: '#8db0bc', back: '#e3eff2' }, clean: CLEAN,
      particles: 'flakes', count: 34, fx: 'beads', scale: true, run: 'Soften the water',
      cta: ['#quiz', 'Do I need a softener? Take the check →'], label: ['0 gpg', 'SOFTENED']
    },
    iron: {
      kicker: 'Iron & sulphur filter', problem: 'Orange stains and a rotten-egg smell.', done: 'Clear, odour-free water.',
      from: 2.4, to: 0, dec: 1, unit: 'mg/L iron', barFrom: .85, barTo: 0,
      dirty: { top: '#e0aa6c', bot: '#9a5a27', back: '#ebc292' }, clean: CLEAN,
      particles: 'rust', count: 38, fx: 'sweep', stink: true, run: 'Run the iron filter',
      cta: ['#solutions', 'How we fix iron & sulphur →', 'iron'], label: ['0.0', 'IRON FREE']
    },
    uv: {
      kicker: 'UV disinfection', problem: 'Well and cottage water can carry bacteria you can’t see.', done: 'Bacteria inactivated with UV light.',
      from: 0, to: 99.99, dec: 2, unit: '% inactivated', barFrom: 0, barTo: 1, good: true,
      dirty: { top: '#94d9c6', bot: '#2e8c86', back: '#b8e8da' }, clean: CLEAN,
      particles: 'microbes', count: 16, fx: 'uv', run: 'Switch on the UV light',
      cta: ['#solutions', 'UV systems for homes & cottages →', 'bacteria'], label: ['UV', 'DISINFECTED']
    },
    test: {
      kicker: 'Free water test', problem: 'Not sure what’s in your water? We’ll test it free.', done: 'Example result: hard water with a little iron.',
      from: 0, to: 3, dec: 0, unit: 'of 3 checks done', barFrom: 0, barTo: 1, good: true,
      dirty: CLEAN, clean: CLEAN,
      particles: null, count: 0, fx: 'strip', run: 'Test this water',
      cta: ['#book', 'Book my free in-home test →'], label: ['TESTED', 'FREE ANALYSIS']
    }
  };

  // colour helpers
  const hex = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; };
  const ease = (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  let mode = null, cfg = null, phase = 'idle', p = 0, runStart = 0, RUN_MS = 2600;
  let parts = [];
  let curColors = { ...CLEAN };

  function setColors(c) {
    curColors = c;
    el.top.setAttribute('stop-color', c.top);
    el.bot.setAttribute('stop-color', c.bot);
    el.back.setAttribute('fill', c.back);
  }
  function blend(t) {
    return { top: mix(cfg.dirty.top, cfg.clean.top, t), bot: mix(cfg.dirty.bot, cfg.clean.bot, t), back: mix(cfg.dirty.back, cfg.clean.back, t) };
  }

  // particles
  function makePart(type) {
    let node;
    const x = 78 + Math.random() * 164, y = 215 + Math.random() * 175;
    if (type === 'sediment') { node = document.createElementNS(SVGNS, 'circle'); node.setAttribute('r', (1.5 + Math.random() * 2.5).toFixed(1)); node.setAttribute('fill', 'rgba(84,66,48,.75)'); }
    else if (type === 'rust') { node = document.createElementNS(SVGNS, 'circle'); node.setAttribute('r', (2 + Math.random() * 2.5).toFixed(1)); node.setAttribute('fill', '#b5541c'); }
    else if (type === 'flakes') { node = document.createElementNS(SVGNS, 'rect'); node.setAttribute('width', (5 + Math.random() * 6).toFixed(1)); node.setAttribute('height', '3'); node.setAttribute('rx', '1.5'); node.setAttribute('fill', '#ffffff'); node.setAttribute('opacity', '.9'); }
    else if (type === 'microbes') { node = document.createElementNS(SVGNS, 'g'); node.innerHTML = '<ellipse rx="7" ry="4" fill="#6fe07c"/><circle cx="-2" cy="-1" r="1.3" fill="#1d6b2a"/><circle cx="2.5" cy="1" r="1" fill="#1d6b2a"/><path d="M7 0 q5 -4 9 0" stroke="#6fe07c" stroke-width="2" fill="none"/>'; }
    else if (type === 'beads') { node = document.createElementNS(SVGNS, 'circle'); node.setAttribute('r', (3 + Math.random() * 2).toFixed(1)); node.setAttribute('fill', '#f2b544'); node.setAttribute('stroke', '#fff2cc'); node.setAttribute('stroke-width', '1'); }
    else if (type === 'minerals') { node = document.createElementNS(SVGNS, 'path'); const s = 3 + Math.random() * 3; node.setAttribute('d', `M0 ${-s} L${s * .6} 0 L0 ${s} L${-s * .6} 0Z`); node.setAttribute('fill', '#eafffb'); }
    el.parts.appendChild(node);
    return { node, type, x, y, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .3, a: Math.random() * 6.28, life: 1, kill: Math.random(), dying: 0 };
  }
  function clearParts() { parts.forEach(q => q.node.remove()); parts = []; }

  function uiProblem() {
    el.kicker.textContent = cfg.kicker;
    el.title.textContent = cfg.problem;
    el.metric.hidden = false; el.barWrap.hidden = false;
    el.run.hidden = false; el.run.disabled = false; el.run.textContent = cfg.run;
    el.cta.hidden = true;
    el.note.textContent = mode === 'test' ? 'Or tap the jug to dip the test strip.' : 'Or tap the jug to run it. Example values.';
    showValue(0);
  }
  function uiDone() {
    el.title.textContent = cfg.done;
    el.run.hidden = true;
    el.cta.hidden = false;
    el.cta.textContent = cfg.cta[1];
    el.cta.setAttribute('href', cfg.cta[0]);
    el.cta.dataset.solver = cfg.cta[2] || '';
    el.note.textContent = 'Example values. Tap another service to try it.';
    el.big.textContent = cfg.label[0];
    el.small.textContent = cfg.label[1];
    card.classList.remove('is-bump'); void card.offsetWidth; card.classList.add('is-bump');
    chips.forEach(c => { if (c.dataset.mode === mode) c.classList.add('is-done'); });
  }
  function showValue(t) {
    const v = cfg.from + (cfg.to - cfg.from) * t;
    el.value.textContent = v.toFixed(cfg.dec);
    el.unit.textContent = cfg.unit;
    const w = cfg.barFrom + (cfg.barTo - cfg.barFrom) * t;
    el.bar.style.width = (w * 100).toFixed(1) + '%';
    const goodness = cfg.good ? w : 1 - w;
    el.bar.style.background = mix('#ff7a45', '#2fd17f', clamp(goodness, 0, 1));
  }

  function select(m) {
    mode = m; cfg = MODES[m]; phase = 'problem'; p = 0;
    dock.classList.remove('is-intro');
    chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.mode === m)));
    clearParts();
    for (let i = 0; i < cfg.count; i++) parts.push(makePart(cfg.particles));
    setColors(cfg.dirty);
    el.scale.setAttribute('opacity', cfg.scale ? '.85' : '0');
    el.stink.setAttribute('opacity', cfg.stink ? '1' : '0');
    el.uv.setAttribute('opacity', '0');
    el.sweep.setAttribute('opacity', '0');
    el.strip.setAttribute('opacity', '0');
    el.strip.setAttribute('transform', 'translate(0 -240)');
    pads.forEach(pd => pd.setAttribute('fill', '#f1f5f9'));
    el.big.textContent = '18 L'; el.small.textContent = 'PURE R.O.';
    uiProblem();
  }
  function run() {
    if (!cfg || phase !== 'problem') return;
    phase = 'running'; runStart = performance.now(); p = 0;
    el.run.disabled = true; el.run.textContent = mode === 'test' ? 'Testing…' : 'Working…';
    if (mode === 'test') el.strip.setAttribute('opacity', '1');
    if (reduced) { p = 1; finish(); }
  }
  function finish() {
    phase = 'done'; p = 1;
    setColors(cfg.clean);
    showValue(1);
    el.scale.setAttribute('opacity', '0');
    el.stink.setAttribute('opacity', '0');
    el.uv.setAttribute('opacity', '0');
    el.sweep.setAttribute('opacity', '0');
    if (mode !== 'test') el.strip.setAttribute('opacity', '0');
    parts.filter(q => q.type !== 'minerals').forEach(q => { q.dying = q.dying || 1; });
    if (mode === 'test') { pads[0].setAttribute('fill', '#a855f7'); pads[1].setAttribute('fill', '#f59e0b'); pads[2].setAttribute('fill', '#22c55e'); }
    uiDone();
    // celebrate with the hero's own tap-splash
    document.dispatchEvent(new CustomEvent('lab:splash'));
  }

  chips.forEach(c => c.addEventListener('click', () => select(c.dataset.mode)));
  el.run.addEventListener('click', run);
  // a tap (not a drag) on the jug runs the selected service
  let downX = null;
  el.wrap.addEventListener('pointerdown', (e) => { if (e.isTrusted) downX = e.clientX; });
  el.wrap.addEventListener('pointerup', (e) => { if (e.isTrusted && downX !== null && Math.abs(e.clientX - downX) < 8) run(); downX = null; });
  // CTA to the problem solver also opens the matching tab
  el.cta.addEventListener('click', () => {
    const k = el.cta.dataset.solver;
    if (k) { const tab = document.querySelector(`.solver__tabs button[data-p="${k}"]`); if (tab) tab.click(); }
  });

  // animation
  let t0 = performance.now();
  function frame(now) {
    const dt = Math.min((now - t0) / 16.67, 3); t0 = now;
    if (phase === 'running') {
      const t = clamp((now - runStart) / RUN_MS, 0, 1);
      p = ease(t);
      showValue(p);
      setColors(blend(p));
      if (cfg.fx === 'sweep') {
        el.sweep.setAttribute('opacity', '1');
        const y = 60 + 350 * p;
        el.sweep.setAttribute('transform', `translate(0 ${y.toFixed(1)})`);
        parts.forEach(q => { if (!q.dying && q.y < y) q.dying = 1; });
        el.stink.setAttribute('opacity', cfg.stink ? (1 - p).toFixed(2) : '0');
      } else if (cfg.fx === 'uv') {
        el.uv.setAttribute('opacity', (Math.min(1, t * 4) * (.75 + Math.sin(now / 60) * .25)).toFixed(2));
        parts.forEach(q => { if (!q.dying && q.kill < p) q.dying = 1; });
      } else if (cfg.fx === 'beads') {
        if (Math.random() < .5 && parts.filter(q => q.type === 'beads').length < 26 && p < .8) parts.push(makePart('beads'));
        parts.forEach(q => { if (q.type === 'flakes' && !q.dying && q.kill < p * 1.1) q.dying = 1; if (q.type === 'beads' && p > .8) q.dying = q.dying || 1; });
        el.scale.setAttribute('opacity', (.85 * (1 - p)).toFixed(2));
      } else if (cfg.fx === 'minerals') {
        if (Math.random() < .6) { const m = makePart('minerals'); m.y = 390; m.vy = -(1 + Math.random() * 1.5); parts.push(m); }
      } else if (cfg.fx === 'strip') {
        const dip = clamp(t / .35, 0, 1);
        el.strip.setAttribute('transform', `translate(0 ${(-240 * (1 - ease(dip))).toFixed(1)})`);
        const colors = ['#a855f7', '#f59e0b', '#22c55e'];
        pads.forEach((pd, i) => { const s = clamp((t - .4 - i * .15) / .15, 0, 1); pd.setAttribute('fill', mix('#f1f5f9', colors[i], s)); });
      }
      if (t >= 1) finish();
    }
    // move particles
    for (let i = parts.length - 1; i >= 0; i--) {
      const q = parts[i];
      q.a += .05 * dt;
      if (q.type === 'minerals') { q.y += (q.vy || -1.2) * dt; q.x += Math.sin(q.a) * .4; if (q.y < 200) { q.dying = q.dying || 1; } }
      else if (q.type === 'beads') { const cx = 160, cy = 300; const ang = Math.atan2(q.y - cy, q.x - cx) + .06 * dt; const r = Math.hypot(q.x - cx, q.y - cy) * .995 + .3; q.x = cx + Math.cos(ang) * r; q.y = cy + Math.sin(ang) * r; }
      else { q.vx += (Math.random() - .5) * .06; q.vy += (Math.random() - .5) * .06; q.vx *= .98; q.vy *= .98; q.x += q.vx * dt; q.y += q.vy * dt; }
      q.x = clamp(q.x, 72, 248); q.y = clamp(q.y, 196, 396);
      let op = 1, sc = 1;
      if (q.dying) {
        q.dying += .06 * dt;
        op = clamp(2 - q.dying, 0, 1);
        if (q.type === 'microbes') { sc = 1 + (q.dying - 1) * 1.5; q.node.setAttribute('fill', '#fff'); }
        if (op <= 0) { q.node.remove(); parts.splice(i, 1); continue; }
      }
      const rot = q.type === 'flakes' || q.type === 'microbes' ? ` rotate(${(Math.sin(q.a) * 40).toFixed(0)})` : '';
      q.node.setAttribute('transform', `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})${rot} scale(${sc.toFixed(2)})`);
      q.node.setAttribute('opacity', op.toFixed(2));
      if (q.type === 'microbes' && q.dying) q.node.querySelectorAll('ellipse,path').forEach(n => { n.setAttribute('fill', n.tagName === 'path' ? 'none' : '#f5f3ff'); n.setAttribute('stroke', n.tagName === 'path' ? '#f5f3ff' : 'none'); });
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  dock.classList.add('is-intro');
})();

// FAQ: smart search, topic filters, and a call-the-store fallback
(() => {
  const input = document.getElementById('faqSearch');
  if (!input) return;
  const list = document.getElementById('faqList');
  const suggest = document.getElementById('faqSuggest');
  const clearBtn = document.getElementById('faqClear');
  const countEl = document.getElementById('faqCount');
  const empty = document.getElementById('faqEmpty');
  const emptyText = document.getElementById('faqEmptyText');
  const emptyStatus = document.getElementById('faqEmptyStatus');
  const emailLink = document.getElementById('faqEmail');
  const topicBtns = [...document.querySelectorAll('.faq-topic')];
  const TOPIC_NAMES = {};
  topicBtns.forEach(b => { TOPIC_NAMES[b.dataset.topic] = b.firstChild.textContent.trim(); });

  const STOP = new Set('a an the is are am was be do does did i my me we you your our us it its to of in on at for and or with can could should would will how what why when which who this that there any get have has many some about from by if as so just please'.split(' '));
  const SYN = {
    salt: ['softener', 'delivery'], smell: ['sulphur', 'smell'], smells: ['sulphur', 'smell'], stink: ['sulphur', 'smell'], stinky: ['sulphur', 'smell'],
    odor: ['sulphur', 'smell'], odour: ['sulphur', 'smell'], egg: ['sulphur', 'smell'], eggs: ['sulphur', 'smell'], sulfur: ['sulphur'],
    rust: ['iron', 'stain'], rusty: ['iron', 'stain'], orange: ['iron'], brown: ['iron', 'tannin'], yellow: ['tannin'], stain: ['iron', 'stain'], stains: ['iron', 'stain'],
    germ: ['bacteria', 'uv'], germs: ['bacteria', 'uv'], ecoli: ['bacteria', 'uv'], coliform: ['bacteria', 'uv'], bacteria: ['bacteria', 'uv', 'well'], safe: ['safe'],
    much: ['cost', 'price'], price: ['cost', 'price'], prices: ['cost', 'price'], cost: ['cost', 'price'], costs: ['cost', 'price'], expensive: ['cost', 'price'], cheap: ['cost', 'price'], pay: ['cost', 'price'],
    open: ['hours', 'open'], opening: ['hours'], close: ['hours'], closed: ['hours'], closing: ['hours'], today: ['hours'], weekend: ['hours'], sunday: ['hours'], saturday: ['hours'], time: ['hours'], hour: ['hours'],
    address: ['located', 'address'], located: ['address'], location: ['address'], directions: ['address'], where: ['address'], parking: ['address'],
    deliver: ['delivery'], delivered: ['delivery'], bring: ['delivery'], drop: ['delivery', 'purolator'],
    fix: ['service', 'repair'], broken: ['service', 'repair'], repair: ['service', 'repair'], leaking: ['service', 'repair'], technician: ['service'],
    ro: ['reverse', 'osmosis', 'ro'], osmosis: ['reverse', 'osmosis', 'ro'], purified: ['ro', 'filter'], purify: ['ro', 'filter'],
    ph: ['alkaline', 'ph'], scale: ['hard', 'scale'], limescale: ['hard', 'scale'], calcium: ['hard'], spots: ['hard'], spotty: ['hard'], soft: ['softener', 'soften'],
    jug: ['refill', 'jug'], jugs: ['refill', 'jug'], bottle: ['refill', 'bottle'], bottles: ['refill', 'bottle'], fill: ['refill'], litre: ['refill'], liter: ['refill'], litres: ['refill'], liters: ['refill'],
    test: ['test', 'testing'], testing: ['test'], tested: ['test'], analysis: ['test'], sample: ['test'],
    coffee: ['kcup', 'pods'], pod: ['pods'], keurig: ['kcup', 'pods'], package: ['purolator'], parcel: ['purolator'], shipping: ['purolator'], courier: ['purolator'],
    guarantee: ['warranty'], warrantee: ['warranty'], cottage: ['well', 'cottage'], fridge: ['fridge', 'refrigerator'], refrigerator: ['fridge'], cooler: ['cooler'], dispenser: ['cooler'],
    uv: ['uv', 'ultraviolet'], ultraviolet: ['uv'], drinking: ['drink'], drink: ['drink']
  };
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/k-cups?/g, 'kcup').replace(/e\.?\s?coli/g, 'ecoli').replace(/[^a-z0-9\s]/g, ' ');
  const stem = (w) => w.length > 4 ? w.replace(/(ing|ed|es|s)$/, '') : w;
  const words = (s) => norm(s).split(/\s+/).filter(Boolean);
  const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      let best = i;
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        best = Math.min(best, cur[j]);
      }
      if (best > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }

  // Index the questions
  const items = [...list.querySelectorAll('details')].map((d, i) => {
    const summary = d.querySelector('summary');
    const q = summary.textContent;
    const toSet = (s) => new Set(words(s).filter(w => !STOP.has(w)).map(stem));
    return {
      d, summary, q, i, topic: d.dataset.topic,
      fq: toSet(q), fk: toSet(d.dataset.keys || ''), fa: toSet(d.querySelector('p').textContent)
    };
  });

  function queryTokens(raw) {
    const ws = words(raw);
    const endsWithSpace = /\s$/.test(raw);
    return ws.filter(w => !STOP.has(w) || ws.length === 1).map((w, idx, arr) => ({
      w: stem(w), raw: w, prefix: !endsWithSpace && idx === arr.length - 1 && w.length >= 2,
      syn: (SYN[w] || SYN[stem(w)] || []).map(stem)
    }));
  }
  function fieldScore(set, tok, weights) {
    if (set.has(tok.w)) return weights[0];
    let best = 0;
    for (const s of tok.syn) if (set.has(s)) best = Math.max(best, weights[0] * .75);
    if (best) return best;
    if (tok.prefix) for (const w of set) if (w.startsWith(tok.w)) return weights[1];
    if (tok.w.length >= 4) {
      const max = tok.w.length >= 7 ? 2 : 1;
      for (const w of set) if (lev(tok.w, w, max) <= max) return weights[2];
    }
    return 0;
  }
  function score(item, toks) {
    if (!toks.length) return 0;
    let total = 0, hit = 0;
    for (const t of toks) {
      const s = Math.max(fieldScore(item.fq, t, [4, 2.5, 2]), fieldScore(item.fk, t, [3, 2, 1.5]), fieldScore(item.fa, t, [1, .5, .5]));
      if (s > 0) hit++;
      total += s;
    }
    const ratio = hit / toks.length;
    // multi-word questions must mostly match, otherwise it isn't really answered here
    if (toks.length >= 2 && ratio < .6) return 0;
    return total * (.4 + .6 * ratio);
  }
  function highlight(text, toks) {
    if (!toks.length) return esc(text);
    return text.split(/(\s+)/).map(part => {
      const n = stem(norm(part).trim());
      if (!n) return esc(part);
      const on = toks.some(t => n === t.w || t.syn.includes(n) || (t.prefix && n.startsWith(t.w)) || (t.w.length >= 4 && n.length >= 4 && lev(t.w, n, 1) <= 1));
      return on ? `<mark>${esc(part)}</mark>` : esc(part);
    }).join('');
  }

  let topic = 'all', active = -1, options = [], lastToks = [], lastQuery = '';

  function setTopic(t) {
    topic = t;
    topicBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.topic === t)));
    apply();
  }
  topicBtns.forEach(b => b.addEventListener('click', () => setTopic(b.dataset.topic)));

  function storeOpen() {
    const H = { 0: [11, 16], 1: [9, 20], 2: [9, 20], 3: [9, 20], 4: [9, 20], 5: [9, 20], 6: [9, 17] };
    try {
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      const g = (t) => parts.find(p => p.type === t).value;
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday'));
      const mins = (parseInt(g('hour'), 10) % 24) * 60 + parseInt(g('minute'), 10);
      const [o, c] = H[day];
      return { open: mins >= o * 60 && mins < c * 60, close: c };
    } catch (e) { return null; }
  }

  // Filter the list (and reorder by relevance while searching)
  function apply() {
    const raw = input.value;
    const toks = queryTokens(raw);
    lastToks = toks; lastQuery = raw.trim();
    const searching = toks.length > 0;
    const scored = items.map(it => ({ it, s: searching ? score(it, toks) : 1 }));
    const inTopic = (it) => topic === 'all' || it.topic === topic;
    const shown = scored.filter(x => inTopic(x.it) && (!searching || x.s >= 1.5));
    const order = searching ? [...scored].sort((a, b) => b.s - a.s || a.it.i - b.it.i) : scored;
    order.forEach(x => list.appendChild(x.it.d));
    scored.forEach(x => {
      const vis = shown.includes(x);
      x.it.d.hidden = !vis;
      x.it.summary.innerHTML = vis && searching ? highlight(x.it.q, toks) : esc(x.it.q);
    });
    const topicLabel = topic === 'all' ? '' : ` in ${TOPIC_NAMES[topic]}`;
    if (!searching) countEl.textContent = `Showing ${shown.length} question${shown.length === 1 ? '' : 's'}${topicLabel || ' across all topics'}`;
    else countEl.textContent = shown.length ? `${shown.length} question${shown.length === 1 ? '' : 's'} match “${lastQuery}”${topicLabel}` : '';

    const elsewhere = searching && !shown.length && topic !== 'all' ? scored.filter(x => x.s >= 1.5).length : 0;
    empty.hidden = !(searching && !shown.length);
    if (!empty.hidden) {
      if (elsewhere) {
        emptyText.innerHTML = `No matches for “${esc(lastQuery)}” in ${esc(TOPIC_NAMES[topic])}, but ${elsewhere} in other topics. <button type="button" class="link-btn" id="faqShowAll">Search all topics</button>, or call us and we'll answer it.`;
        document.getElementById('faqShowAll').addEventListener('click', () => setTopic('all'));
      } else {
        emptyText.textContent = `We don't have an answer for “${lastQuery}” in our FAQ yet. Our team answers water questions every day, so give us a call and we'll help you out.`;
      }
      emailLink.href = `mailto:goodwater@thewaterstoremilton.com?subject=${encodeURIComponent('Question: ' + lastQuery)}`;
      const st = storeOpen();
      emptyStatus.className = 'faq-empty__status' + (st ? (st.open ? ' is-open' : ' is-closed') : '');
      emptyStatus.textContent = st ? (st.open ? `We're open now until ${st.close > 12 ? st.close - 12 : st.close} p.m. Someone can answer right away.` : 'We’re closed right now. Leave a message or email us and we’ll get back to you.') : '';
    }
    clearBtn.hidden = !raw;
    renderSuggest(scored, toks);
  }

  // Suggestions dropdown
  function renderSuggest(scored, toks) {
    options = [];
    if (!toks.length || document.activeElement !== input) { closeSuggest(); return; }
    const top = scored.filter(x => x.s >= 1.5).sort((a, b) => b.s - a.s).slice(0, 6);
    const html = [];
    // topic shortcuts
    Object.entries(TOPIC_NAMES).forEach(([k, name]) => {
      if (k === 'all') return;
      const nn = norm(name);
      if (toks.some(t => t.raw.length >= 3 && nn.split(/\s+/).some(w => w.startsWith(t.raw)))) options.push({ kind: 'topic', k, label: name });
    });
    top.forEach(x => options.push({ kind: 'q', it: x.it }));
    const best = top.length ? top[0].s : 0;
    options.push({ kind: 'call', weak: best < 3.5 });
    if (top.length) html.push('<li class="faq-suggest__hint" role="presentation">Suggested questions</li>');
    options.forEach((o, i) => {
      const id = `faq-opt-${i}`;
      if (o.kind === 'topic') html.push(`<li role="option" id="${id}" data-i="${i}" aria-selected="false"><span class="faq-suggest__tag">Topic</span><span class="faq-suggest__text">Show all <b>${esc(o.label)}</b> questions</span></li>`);
      else if (o.kind === 'q') html.push(`<li role="option" id="${id}" data-i="${i}" aria-selected="false"><span class="faq-suggest__text">${highlight(o.it.q, toks)}</span><span class="faq-suggest__tag">${esc(TOPIC_NAMES[o.it.topic])}</span></li>`);
      else html.push(`<li role="option" id="${id}" data-i="${i}" aria-selected="false" class="faq-suggest__call"><span class="faq-suggest__tag">Call</span><span class="faq-suggest__text">${top.length ? 'Not what you’re looking for? Call 905-693-8820' : `No answer for “${esc(lastQuery)}” yet. Call the store at 905-693-8820`}</span></li>`);
    });
    suggest.innerHTML = html.join('');
    suggest.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    active = -1;
    input.removeAttribute('aria-activedescendant');
  }
  function closeSuggest() {
    suggest.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  }
  function setActive(i) {
    const lis = [...suggest.querySelectorAll('[role="option"]')];
    if (!lis.length) return;
    active = (i + lis.length) % lis.length;
    lis.forEach((li, k) => li.setAttribute('aria-selected', String(k === active)));
    input.setAttribute('aria-activedescendant', lis[active].id);
    lis[active].scrollIntoView({ block: 'nearest' });
  }
  function choose(i) {
    const o = options[i];
    if (!o) return;
    closeSuggest();
    if (o.kind === 'call') { window.location.href = 'tel:9056938820'; return; }
    if (o.kind === 'topic') { input.value = ''; setTopic(o.k); return; }
    if (topic !== 'all' && o.it.topic !== topic) setTopic('all');
    const d = o.it.d;
    d.hidden = false;
    d.open = true;
    d.classList.remove('is-flash'); void d.offsetWidth; d.classList.add('is-flash');
    d.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  input.addEventListener('input', apply);
  input.addEventListener('focus', () => { if (input.value.trim()) apply(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (suggest.hidden) apply(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0) choose(active);
      else { const firstQ = options.findIndex(o => o.kind === 'q'); if (firstQ >= 0) choose(firstQ); else closeSuggest(); }
    } else if (e.key === 'Escape') {
      if (!suggest.hidden) closeSuggest(); else { input.value = ''; apply(); }
    }
  });
  suggest.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus in the input
  suggest.addEventListener('click', (e) => { const li = e.target.closest('[role="option"]'); if (li) choose(+li.dataset.i); });
  input.addEventListener('blur', () => setTimeout(closeSuggest, 120));
  clearBtn.addEventListener('click', () => { input.value = ''; apply(); input.focus(); });

  apply();
})();

// Free water test booking form (4 steps, then sends by email)
(() => {
  const form = document.getElementById('bookForm');
  if (!form) return;
  const book = document.getElementById('book');
  const steps = [...form.querySelectorAll('.book__step')];
  const progress = [...book.querySelectorAll('.book__progress li')];
  const nextBtn = document.getElementById('bookNext');
  const backBtn = document.getElementById('bookBack');
  const countEl = document.getElementById('bookCount');
  const nav = document.getElementById('bookNav');
  const review = document.getElementById('bookReview');
  const datesEl = document.getElementById('bookDates');
  const timesEl = document.getElementById('bookTimes');
  const timeNote = document.getElementById('bookTimeNote');
  const otherDate = document.getElementById('bookDateOther');
  const STORE = 'goodwater@thewaterstoremilton.com';
  const DRAFT = 'tws-booking-draft';
  let step = 1;

  const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fromIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const pretty = (s) => { const d = fromIso(s); return `${DAY[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`; };

  // Time windows follow store hours
  function windowsFor(day) {
    if (day === 0) return [{ v: 'midday', t: 'Midday', s: '11 a.m. – 4 p.m.' }];
    if (day === 6) return [{ v: 'morning', t: 'Morning', s: '9 a.m. – 12 p.m.' }, { v: 'afternoon', t: 'Afternoon', s: '12 – 5 p.m.' }];
    return [{ v: 'morning', t: 'Morning', s: '9 a.m. – 12 p.m.' }, { v: 'afternoon', t: 'Afternoon', s: '12 – 4 p.m.' }, { v: 'evening', t: 'Evening', s: '4 – 8 p.m.' }];
  }

  // Next 7 days as quick picks (starting tomorrow), plus a free date input
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const quick = [];
  for (let i = 1; i <= 7; i++) { const d = new Date(today); d.setDate(d.getDate() + i); quick.push(d); }
  datesEl.innerHTML = quick.map(d => `<label class="pick date-pick"><input type="radio" name="date" value="${iso(d)}"><span><small>${DAY[d.getDay()].slice(0, 3)}</small><b>${d.getDate()}</b><em>${MON[d.getMonth()]}</em></span></label>`).join('');
  const minD = new Date(today); minD.setDate(minD.getDate() + 1);
  const maxD = new Date(today); maxD.setDate(maxD.getDate() + 60);
  otherDate.min = iso(minD); otherDate.max = iso(maxD);

  const chosenDate = () => { const r = form.querySelector('input[name="date"]:checked'); return r ? r.value : (otherDate.value || ''); };
  function renderTimes() {
    const d = chosenDate();
    const prev = (form.querySelector('input[name="time"]:checked') || {}).value;
    const wins = d ? windowsFor(fromIso(d).getDay()) : windowsFor(1);
    timesEl.innerHTML = wins.map(w => `<label class="pick time-pick"><input type="radio" name="time" value="${w.v}" ${d ? '' : 'disabled'} ${prev === w.v ? 'checked' : ''}><span><b>${w.t}</b><small>${w.s}</small></span></label>`).join('');
    timeNote.textContent = d ? (fromIso(d).getDay() === 0 ? 'Sundays we’re open 11 a.m. – 4 p.m.' : '') : 'Pick a date first.';
  }
  datesEl.addEventListener('change', () => { otherDate.value = ''; renderTimes(); save(); });
  otherDate.addEventListener('change', () => {
    if (otherDate.value) {
      if (otherDate.value < otherDate.min || otherDate.value > otherDate.max) otherDate.value = '';
      form.querySelectorAll('input[name="date"]').forEach(r => { r.checked = r.value === otherDate.value; });
    }
    renderTimes(); save();
  });

  // Store drop-off doesn't need an address
  function syncWhere() {
    const where = form.where.value;
    const atStore = where === 'store';
    document.getElementById('addrField').hidden = atStore;
    document.getElementById('townField').hidden = atStore;
    document.getElementById('whenLegend').textContent = atStore ? 'When will you drop off your sample?' : 'When works for you?';
    form.address.placeholder = where === 'cottage' ? 'Cottage address or directions' : 'Street address';
  }
  form.addEventListener('change', (e) => { if (e.target.name === 'where') syncWhere(); });

  // "Not sure" and specific concerns are mutually exclusive
  form.addEventListener('change', (e) => {
    if (e.target.name !== 'concern') return;
    const boxes = [...form.querySelectorAll('input[name="concern"]')];
    if (e.target.value === 'unsure' && e.target.checked) boxes.forEach(b => { if (b !== e.target) b.checked = false; });
    else if (e.target.checked) boxes.find(b => b.value === 'unsure').checked = false;
    form.querySelector('[data-error="2"]').hidden = true;
  });

  // Validation per step
  const digits = (s) => (s || '').replace(/\D/g, '');
  function invalid(field, bad) { field.closest('.field').classList.toggle('is-invalid', bad); field.setAttribute('aria-invalid', String(bad)); return bad; }
  function validate(n) {
    const err = form.querySelector(`[data-error="${n}"]`);
    let ok = true, first = null;
    if (n === 2) ok = !!form.querySelector('input[name="concern"]:checked');
    if (n === 3) ok = !!chosenDate() && !!form.querySelector('input[name="time"]:checked');
    if (n === 4) {
      const atStore = form.where.value === 'store';
      const checks = [
        [form.name, !form.name.value.trim()],
        [form.phone, digits(form.phone.value).length < 10],
        [form.email, (form.email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value)) || (form.contact.value === 'email' && !form.email.value)],
        [form.address, !atStore && !form.address.value.trim()]
      ];
      checks.forEach(([f, bad]) => { if (invalid(f, bad) && !first) first = f; });
      ok = !first;
      if (err) err.textContent = form.contact.value === 'email' && !form.email.value ? 'Add your email, since that’s how you’d like us to reach you.' : 'Please fill in the highlighted fields.';
    }
    if (err) err.hidden = ok;
    if (!ok) (first || err).focus?.();
    return ok;
  }
  form.addEventListener('input', (e) => { const f = e.target.closest('.field'); if (f && f.classList.contains('is-invalid')) invalid(e.target, false); });
  // clear a step's error once the visitor fixes it
  form.addEventListener('change', () => {
    const err = form.querySelector(`[data-error="${step}"]`);
    if (!err || err.hidden) return;
    if (step === 3 && chosenDate() && form.querySelector('input[name="time"]:checked')) err.hidden = true;
  });
  form.addEventListener('input', () => {
    const err = form.querySelector('[data-error="4"]');
    if (step === 4 && !err.hidden && !form.querySelector('.field.is-invalid')) err.hidden = true;
  });

  function show(n, initial) {
    step = n;
    steps.forEach(s => s.classList.toggle('is-active', +s.dataset.step === n));
    progress.forEach(li => { const k = +li.dataset.for; li.classList.toggle('is-on', k === n); li.classList.toggle('is-done', k < n || n === 5); });
    review.hidden = n !== 5;
    nav.hidden = n === 5;
    backBtn.hidden = n === 1;
    nextBtn.textContent = n === 4 ? 'Review request →' : 'Next →';
    countEl.textContent = `Step ${n} of 4`;
    if (initial) return;
    const top = book.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * .6) book.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const active = n === 5 ? review : steps[n - 1];
    const focusTarget = n === 5 ? review : active.querySelector('input, textarea, select');
    if (focusTarget) setTimeout(() => focusTarget.focus({ preventScroll: true }), 50);
  }
  nextBtn.addEventListener('click', () => { if (!validate(step)) return; if (step < 4) show(step + 1); else buildReview(); });
  backBtn.addEventListener('click', () => show(Math.max(1, step - 1)));
  form.addEventListener('submit', (e) => { e.preventDefault(); nextBtn.click(); });
  form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'radio') { e.preventDefault(); nextBtn.click(); } });
  document.getElementById('bookEdit').addEventListener('click', () => show(4));
  progress.forEach(li => li.addEventListener('click', () => { const k = +li.dataset.for; if (k < step || step === 5) show(k); }));

  // Review + send
  const label = (input) => { const sp = input.closest('label').querySelector('span').cloneNode(true); sp.querySelectorAll('i').forEach(i => i.remove()); return sp.textContent.trim(); };
  function collect() {
    const where = form.where.value, src = form.source.value;
    const concerns = [...form.querySelectorAll('input[name="concern"]:checked')].map(label);
    const d = chosenDate(), t = form.querySelector('input[name="time"]:checked');
    const win = windowsFor(fromIso(d).getDay()).find(w => w.v === t.value);
    return [
      ['Visit', { home: 'In-home test', cottage: 'Cottage visit', store: 'Bringing a sample to the store' }[where]],
      ['Water source', { city: 'City / municipal', well: 'Private well', unsure: 'Not sure' }[src]],
      ['Concerns', concerns.join(', ')],
      ['Notes', form.notes.value.trim()],
      ['Preferred time', `${pretty(d)}, ${win.t.toLowerCase()} (${win.s})`],
      ['Name', form.name.value.trim()],
      ['Phone', form.phone.value.trim()],
      ['Email', form.email.value.trim()],
      ['Contact me by', { phone: 'Phone call', text: 'Text message', email: 'Email' }[form.contact.value]],
      ['Address', where === 'store' ? '' : [form.address.value.trim(), form.town.value.trim()].filter(Boolean).join(', ')]
    ].filter(r => r[1]);
  }
  let ref = '';
  function buildReview() {
    const rows = collect();
    if (!ref) ref = 'WT-' + Date.now().toString(36).slice(-5).toUpperCase();
    document.getElementById('bookRef').textContent = ref;
    const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    document.getElementById('bookSummary').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
    const text = `Free water test request (${ref})\n\n` + rows.map(([k, v]) => `${k}: ${v}`).join('\n') + '\n\nSent from the website booking form.';
    const subject = `Free water test request: ${form.name.value.trim()}, ${pretty(chosenDate())}`;
    document.getElementById('bookSend').href = `mailto:${STORE}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    review.dataset.text = text;
    show(5);
  }
  const copyBtn = document.getElementById('bookCopy');
  copyBtn.addEventListener('click', async () => {
    const text = review.dataset.text || '';
    try { await navigator.clipboard.writeText(text); }
    catch (e) { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e2) {} ta.remove(); }
    copyBtn.textContent = 'Copied ✓';
    setTimeout(() => { copyBtn.textContent = 'Copy details'; }, 2000);
  });

  // Links elsewhere on the site can pre-tick a concern
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href="#book"][data-concern]');
    if (!a) return;
    const box = form.querySelector(`input[name="concern"][value="${a.dataset.concern}"]`);
    if (box) { box.checked = true; const u = form.querySelector('input[value="unsure"]'); if (u && box !== u) u.checked = false; }
    if (['iron', 'sulphur', 'bacteria', 'tannins'].includes(a.dataset.concern) && form.source.value === 'city') form.querySelector('input[name="source"][value="well"]').checked = true;
    save();
  });

  // Keep a draft in this browser so a refresh doesn't lose answers
  function save() {
    try {
      const data = {};
      new FormData(form).forEach((v, k) => { (data[k] = data[k] || []).push(v); });
      localStorage.setItem(DRAFT, JSON.stringify(data));
    } catch (e) {}
  }
  function restore() {
    let data;
    try { data = JSON.parse(localStorage.getItem(DRAFT) || 'null'); } catch (e) { data = null; }
    if (!data) return;
    Object.entries(data).forEach(([k, vals]) => {
      const els = form.querySelectorAll(`[name="${k}"]`);
      els.forEach(el => {
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = vals.includes(el.value);
        else el.value = vals[0];
      });
    });
    if (data.date && !form.querySelector(`input[name="date"][value="${data.date[0]}"]`)) {
      if (data.date[0] >= otherDate.min && data.date[0] <= otherDate.max) otherDate.value = data.date[0];
    }
    renderTimes();
    if (data.time) { const t = form.querySelector(`input[name="time"][value="${data.time[0]}"]`); if (t) t.checked = true; }
  }
  form.addEventListener('input', save);
  form.addEventListener('change', save);
  document.getElementById('bookSend').addEventListener('click', () => { try { localStorage.removeItem(DRAFT); } catch (e) {} });

  renderTimes();
  restore();
  syncWhere();
  show(1, true);
})();
