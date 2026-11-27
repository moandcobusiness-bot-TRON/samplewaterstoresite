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

  // Jug size picker
  const cupCount = $('#cupCount');
  const dayCount = $('#dayCount');
  const miniJug = $('#miniJug');
  $$('.seg button').forEach(btn => btn.addEventListener('click', () => {
    $$('.seg button').forEach(b => b.setAttribute('aria-selected', String(b === btn)));
    const litres = +btn.dataset.size;
    const cups = Math.round(litres / 0.237);
    cupCount.textContent = cups;
    dayCount.textContent = Math.floor(cups / 8);
    miniJug.classList.toggle('is-small', litres === 11);
  }));

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
    else if (n <= 2) result.innerHTML = `${n} sign${n > 1 ? 's' : ''}. Your water may be on the hard side. A <a href="#test">free water test</a> will tell you for sure.`;
    else if (n <= 4) result.innerHTML = `${n} signs. A softener would likely make a real difference. <a href="#test">Book your free test</a>.`;
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

// Interactive hero water: device tilt/shake, drag, tap, hover and touch bubbles
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
  const hint = document.getElementById('tiltHint');
  const hintText = document.getElementById('tiltHintText');
  if (!hero || !wrap || !tiltG || !front) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { hint.classList.add('is-hidden'); return; }

  const SVGNS = 'http://www.w3.org/2000/svg';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const needsPermission = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';

  let waterA = 0, waterV = 0;   // surface angle relative to the jug, and its velocity
  let level = 0, levelV = 0;    // up/down slosh
  let energy = 8;               // drives wave height and speed
  let phase = 0, jugA = 0;
  let dragTilt = 0, hoverTilt = 0, deviceTilt = 0, deviceRaw = 0;
  let dragging = false, deviceActive = false, permAsked = false, running = true;
  let lastInput = -1e9, hovering = false;
  const kick = (e) => { energy = Math.min(46, energy + e); };
  const touched = () => { lastInput = performance.now(); };

  const setHint = (t) => { hintText.textContent = t; };
  setHint(needsPermission ? 'Tap to turn on tilt, then move your phone' : isTouch ? 'Tilt your phone, or drag the jug' : 'Drag, tap or hover the jug');

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

  // Phone tilt + shake
  function screenAngle() {
    if (screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle;
    return typeof window.orientation === 'number' ? window.orientation : 0;
  }
  function onOrient(e) {
    if (e.gamma == null) return;
    const ang = ((screenAngle() % 360) + 360) % 360;
    let t = e.gamma;
    if (ang === 90) t = e.beta; else if (ang === 270) t = -e.beta; else if (ang === 180) t = -e.gamma;
    const next = clamp(t, -45, 45);
    kick(Math.abs(next - deviceRaw) * .6);
    deviceRaw = next;
    if (!deviceActive) { deviceActive = true; setHint('Tilt or shake your phone'); setTimeout(() => hint.classList.add('is-hidden'), 4000); }
  }
  let lastShake = 0;
  function onMotion(e) {
    const a = e.acceleration && e.acceleration.x != null ? e.acceleration : null;
    if (!a) return;
    waterV += clamp(a.x, -15, 15) * .7;
    levelV += clamp(a.y, -15, 15) * .2;
    const mag = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
    kick(mag * .8);
    const now = performance.now();
    if (mag > 11 && now - lastShake > 300) { lastShake = now; splash(clamp(mag / 16, .7, 1.8)); }
  }
  let listening = false;
  function listenMotion() {
    if (listening) return;
    listening = true;
    window.addEventListener('deviceorientation', onOrient);
    window.addEventListener('devicemotion', onMotion);
  }
  // iPhone/iPad: permission must be asked from a click / touchend, not touchstart
  function requestMotion() {
    if (!needsPermission || permAsked) return;
    permAsked = true;
    const asks = [DeviceOrientationEvent.requestPermission()];
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') asks.push(DeviceMotionEvent.requestPermission());
    Promise.all(asks).then((r) => {
      if (r[0] === 'granted') { listenMotion(); setHint('Tilt or shake your phone'); }
      else { permAsked = false; if (!deviceActive) setHint('Drag or tap the jug to make waves'); }
    }).catch(() => { permAsked = false; });
  }
  // Always listen (Android delivers events right away); also ask where a permission prompt exists
  if ('DeviceOrientationEvent' in window) listenMotion();
  if (needsPermission) {
    document.addEventListener('touchend', requestMotion, { passive: true });
    document.addEventListener('click', requestMotion);
  }
  hint.addEventListener('click', (e) => { e.stopPropagation(); requestMotion(); splash(1.4); });

  // Animation loop
  let t0 = performance.now();
  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - t0) / 16.67, 3); t0 = now;
    const idle = now - lastInput > 2500 && !deviceActive;
    deviceTilt += (deviceRaw - deviceTilt) * .25 * dt;
    let jugTarget = dragging ? dragTilt : deviceActive ? 0 : hovering ? hoverTilt : 0;
    if (idle) jugTarget = Math.sin(now / 1100) * 12; // gentle rocking so it always looks alive
    jugA += (jugTarget - jugA) * .14 * dt;
    const target = clamp(-(jugA + deviceTilt), -42, 42);
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
    const shift = clamp(deviceTilt * 1.2 + jugA * .8, -40, 40);
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
