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
