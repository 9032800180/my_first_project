/* SkillGrow – Interactions, Demo logic, and Animations */
(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', () => {
    setYear();
    initNav();
    initSmoothAnchors();
    initReveal();
    initHeroCanvas();
    initRangeSync();
    initQuiz();
    initProgressRings();
    initContactAndQR();
    initChatbot();
  });

  function setYear() {
    const y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  /* Navigation */
  function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    const linkEls = links ? Array.from(links.querySelectorAll('a[href^="#"]')) : [];

    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      links.classList.toggle('is-open');
    });

    linkEls.forEach((a) => a.addEventListener('click', () => {
      // Close on selection for mobile
      toggle.setAttribute('aria-expanded', 'false');
      links.classList.remove('is-open');
    }));
  }

  /* Smooth scroll for internal links */
  function initSmoothAnchors() {
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const a = t.closest('a[href^="#"]');
      if (!a) return;
      const hash = a.getAttribute('href');
      if (!hash || hash === '#' || hash.length < 2) return;
      const el = document.querySelector(hash);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* Reveal on scroll */
  function initReveal() {
    const elts = document.querySelectorAll('.reveal');
    if (!elts.length) return;
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    elts.forEach((el) => io.observe(el));
  }

  /* Hero canvas animation (particles + links) */
  function initHeroCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0, height = 0, dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const NUM = prefersReduced ? 30 : 80;
    const DIST = 110; // px link distance
    const nodes = [];

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function resetNodes() {
      nodes.length = 0;
      for (let i = 0; i < NUM; i++) {
        nodes.push({
          x: rand(0, width),
          y: rand(0, height),
          vx: rand(-0.4, 0.4),
          vy: rand(-0.4, 0.4),
          r: rand(1.2, 2.4)
        });
      }
    }

    function step() {
      ctx.clearRect(0, 0, width, height);
      // glow background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, 'rgba(0,217,255,0.05)');
      grad.addColorStop(1, 'rgba(20,99,255,0.05)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // update and draw
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < -10 || n.x > width + 10) n.vx *= -1;
        if (n.y < -10 || n.y > height + 10) n.vy *= -1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180, 235, 255, 0.8)';
        ctx.fill();
      }

      // connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x; const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < DIST) {
            const alpha = 1 - d / DIST;
            ctx.strokeStyle = `rgba(0, 217, 255, ${0.25 * alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(step);
    }

    let rafId = 0;
    function start() { if (!prefersReduced) rafId = requestAnimationFrame(step); }
    function stop() { cancelAnimationFrame(rafId); }

    const ro = new ResizeObserver(() => { resize(); resetNodes(); });
    ro.observe(canvas);
    resize();
    resetNodes();
    start();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else start();
    });
  }

  /* Range inputs value sync */
  function initRangeSync() {
    const form = document.getElementById('quizForm');
    if (!form) return;
    const ranges = form.querySelectorAll('input[type="range"][name]');
    ranges.forEach((input) => {
      const name = input.getAttribute('name');
      const badge = form.querySelector(`.range-val[data-for="${name}"]`);
      const update = () => badge && (badge.textContent = input.value);
      input.addEventListener('input', update);
      update();
    });
  }

  /* Quiz -> AI analysis -> Roadmap */
  function initQuiz() {
    const form = document.getElementById('quizForm');
    const container = document.getElementById('roadmapContainer');
    if (!form || !container) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const domain = String(data.get('domain') || '');
      if (!domain) {
        alert('Please choose a preferred domain.');
        return;
      }
      const scores = {
        dsa: Number(data.get('dsa') || 3),
        web: Number(data.get('web') || 3),
        python: Number(data.get('python') || 3),
        math: Number(data.get('math') || 3),
      };

      // Simulate AI analysis
      container.innerHTML = '';
      const spinner = document.createElement('div');
      spinner.className = 'card glass';
      spinner.style.padding = '16px';
      spinner.innerHTML = '<strong>Analyzing with AI...</strong><p class="muted">Calibrating your roadmap based on your inputs.</p>';
      container.appendChild(spinner);

      setTimeout(() => {
        const modules = generateRoadmap(domain, scores);
        renderRoadmap(container, modules);
      }, prefersReduced ? 200 : 700);
    });
  }

  function generateRoadmap(domain, scores) {
    const low = (n) => n <= 2;
    const mid = (n) => n === 3;
    const high = (n) => n >= 4;

    const common = (extra = []) => ([
      { title: 'Study Setup & Habits', level: 'Beginner', estWeeks: 1, items: [
        'Define a clear 4-week goal',
        'Set up note system (Obsidian/Notion)',
        'Daily 45–60 min deep work routine'
      ], resources: [
        { label: 'Goal setting guide', href: 'https://www.mindtools.com/ato/goal-setting' },
      ] },
      ...extra,
      { title: 'Build + Share', level: 'Intermediate', estWeeks: 2, items: [
        'Create a mini project and publish',
        'Write a 500-word summary of what you learned',
        'Peer review with a study buddy'
      ], resources: [
        { label: 'GitHub getting started', href: 'https://docs.github.com/en/get-started' }
      ] }
    ]);

    if (domain === 'DSA') {
      const seq = [];
      if (low(scores.dsa)) seq.push({ title: 'Data Structures Foundations', level: 'Beginner', estWeeks: 2, items: [
        'Arrays, Linked Lists, Stacks, Queues', 'Hash Maps & Sets', 'Time/Space complexity basics'
      ], resources: [
        { label: 'CS50 Data Structures', href: 'https://cs50.harvard.edu/x/2023/' },
        { label: 'NeetCode roadmap', href: 'https://neetcode.io/' }
      ] });
      seq.push({ title: 'Core Algorithms', level: 'Intermediate', estWeeks: 3, items: [
        'Sorting & Searching patterns', 'Two Pointers, Sliding Window', 'Binary Search Trees'
      ], resources: [
        { label: 'VisuAlgo', href: 'https://visualgo.net/en' }
      ] });
      seq.push({ title: 'Graphs & Dynamic Programming', level: 'Advanced', estWeeks: 3, items: [
        'Graph traversals (BFS/DFS)', 'Shortest paths & MST', 'DP patterns (knapsack, LIS)'
      ], resources: [
        { label: 'CP Handbook', href: 'https://cses.fi/book/book.pdf' }
      ] });
      return common(seq);
    }

    if (domain === 'Web Dev') {
      const seq = [];
      if (low(scores.web)) seq.push({ title: 'HTML & CSS Fundamentals', level: 'Beginner', estWeeks: 2, items: [
        'Semantic HTML', 'Flexbox & Grid', 'Responsive design'
      ], resources: [ { label: 'MDN Web Docs', href: 'https://developer.mozilla.org/' } ] });
      seq.push({ title: 'JavaScript Essentials', level: 'Intermediate', estWeeks: 2, items: [
        'ES6+ basics', 'Async/await & fetch', 'DOM & events'
      ], resources: [ { label: 'JavaScript.info', href: 'https://javascript.info/' } ] });
      seq.push({ title: 'Frontend Framework Basics', level: 'Intermediate', estWeeks: 2, items: [
        'React components & state', 'Routing basics', 'API integration'
      ], resources: [ { label: 'React docs', href: 'https://react.dev/' } ] });
      seq.push({ title: 'Backend & Deployment', level: 'Advanced', estWeeks: 3, items: [
        'Node + Express API', 'Auth & sessions', 'Deploy on Vercel/Render'
      ], resources: [ { label: 'Express docs', href: 'https://expressjs.com/' } ] });
      return common(seq);
    }

    // AI/ML (default)
    const seq = [];
    if (low(scores.python) || low(scores.math)) seq.push({ title: 'Python & Math Foundations', level: 'Beginner', estWeeks: 2, items: [
      'NumPy & Pandas', 'Linear algebra & stats refresher', 'Data cleaning basics'
    ], resources: [ { label: 'Khan Academy – LA', href: 'https://www.khanacademy.org/math/linear-algebra' } ] });
    seq.push({ title: 'Machine Learning Core', level: 'Intermediate', estWeeks: 3, items: [
      'Supervised learning (LR, SVM, Trees)', 'Bias/variance & regularization', 'Model evaluation'
    ], resources: [ { label: 'scikit-learn docs', href: 'https://scikit-learn.org/' } ] });
    seq.push({ title: 'Deep Learning Basics', level: 'Intermediate', estWeeks: 3, items: [
      'Neural nets & backprop', 'CNNs & RNNs overview', 'Training tips'
    ], resources: [ { label: 'DeepLearning.ai', href: 'https://www.deeplearning.ai/' } ] });
    seq.push({ title: 'Projects & MLOps Intro', level: 'Advanced', estWeeks: 3, items: [
      'Deploy a simple model', 'Data versioning', 'Monitoring basics'
    ], resources: [ { label: 'Hugging Face', href: 'https://huggingface.co/' } ] });
    return common(seq);
  }

  function renderRoadmap(container, modules) {
    container.innerHTML = '';
    modules.forEach((m, idx) => {
      const mod = document.createElement('div');
      mod.className = 'module';
      const header = document.createElement('div');
      header.className = 'module-header';
      header.innerHTML = `<h4>${escapeHtml(m.title)} <span class="badge">${escapeHtml(m.level)} • ~${m.estWeeks}w</span></h4>`;
      const body = document.createElement('div');
      body.className = 'module-body';
      const ul = document.createElement('ul');
      m.items.forEach((it) => { const li = document.createElement('li'); li.textContent = it; ul.appendChild(li); });
      body.appendChild(ul);
      if (m.resources && m.resources.length) {
        const res = document.createElement('div');
        res.className = 'resources';
        m.resources.forEach((r) => {
          const a = document.createElement('a'); a.href = r.href; a.textContent = r.label; a.target = '_blank'; a.rel = 'noopener'; res.appendChild(a);
        });
        body.appendChild(res);
      }
      mod.appendChild(header);
      mod.appendChild(body);
      container.appendChild(mod);
      if (idx === 0) mod.classList.add('open');

      header.addEventListener('click', () => {
        mod.classList.toggle('open');
      });
    });
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }

  /* Progress rings */
  function initProgressRings() {
    const rings = Array.from(document.querySelectorAll('.ring'));
    const update = (el) => {
      const value = Number(el.getAttribute('data-value') || 0);
      const max = Number(el.getAttribute('data-max') || 100);
      const percent = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
      el.style.setProperty('--p', percent);
    };
    rings.forEach(update);

    const shuffleBtn = document.getElementById('shuffleProgress');
    if (shuffleBtn) shuffleBtn.addEventListener('click', () => {
      rings.forEach((el) => {
        const max = Number(el.getAttribute('data-max') || 100);
        const val = Math.floor(Math.random() * (max + 1));
        el.setAttribute('data-value', String(val));
        const inner = el.querySelector('.ring-inner');
        if (inner) inner.textContent = max === 100 ? `${val}%` : `${val}/${max}`;
        const label = el.querySelector('.ring-label');
        if (label) label.style.opacity = '0.9';
        el.style.transition = prefersReduced ? 'none' : 'background 600ms ease';
        const percent = Math.round((val / max) * 100);
        el.style.setProperty('--p', percent);
      });
    });
  }

  /* Contact form + QR */
  function initContactAndQR() {
    const form = document.getElementById('contactForm');
    const statusEl = document.getElementById('formStatus');
    if (form && statusEl) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const name = String(data.get('name') || '').trim();
        const email = String(data.get('email') || '').trim();
        const message = String(data.get('message') || '').trim();
        if (!name || !email) { statusEl.textContent = 'Please provide name and email.'; return; }
        statusEl.textContent = 'Sending...';
        await sleep(prefersReduced ? 150 : 600);
        statusEl.textContent = 'Thanks! Your message was sent.';
        try { form.reset(); } catch {}
      });
    }

    // QR code
    const qr = document.getElementById('qrImage');
    const demoLink = document.getElementById('demoLink');
    if (qr && demoLink) {
      const base = String(window.location.href).replace(/#.*$/, '');
      const demoUrl = `${base}#demo`;
      demoLink.setAttribute('href', demoUrl);
      const api = 'https://api.qrserver.com/v1/create-qr-code/';
      const src = `${api}?size=160x160&data=${encodeURIComponent(demoUrl)}`;
      qr.setAttribute('src', src);
    }
  }

  /* Chatbot (mock assistant) */
  function initChatbot() {
    const toggle = document.getElementById('chatToggle');
    const closeBtn = document.getElementById('chatClose');
    const win = document.getElementById('chatWindow');
    const body = document.getElementById('chatBody');
    const form = document.getElementById('chatForm');
    const input = document.getElementById('chatText');
    if (!toggle || !win || !body || !form || !input) return;

    function open() {
      win.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      input.focus();
    }
    function close() {
      win.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', () => {
      if (win.hidden) open(); else close();
    });
    if (closeBtn) closeBtn.addEventListener('click', close);

    sendAssistant('Hi! Ask me for a personalized next step or resources.');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = String(input.value || '').trim();
      if (!text) return;
      sendUser(text);
      input.value = '';
      await sleep(300);
      const reply = generateAssistantReply(text);
      await typeAssistant(reply);
    });

    function sendUser(text) { appendMsg(text, 'user'); }
    function sendAssistant(text) { appendMsg(text, 'assistant'); }
    async function typeAssistant(text) { appendMsg('Typing…', 'assistant', true); await sleep(prefersReduced ? 50 : 500); replaceLastAssistant(text); }

    function appendMsg(text, role, isTemp = false) {
      const div = document.createElement('div');
      div.className = `msg ${role}`;
      div.textContent = text;
      if (isTemp) div.dataset.temp = '1';
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }
    function replaceLastAssistant(text) {
      const msgs = Array.from(body.querySelectorAll('.msg.assistant'));
      const last = msgs.reverse().find((m) => m.dataset.temp === '1');
      if (last) { last.textContent = text; delete last.dataset.temp; }
      else appendMsg(text, 'assistant');
      body.scrollTop = body.scrollHeight;
    }

    function generateAssistantReply(q) {
      const s = q.toLowerCase();
      if (/(roadmap|plan|next step)/.test(s)) {
        return 'Start with a 2-week sprint: pick one domain, set a daily 45–60 minute block, and complete 3 focused modules. I can suggest resources if you tell me DSA, Web, or AI/ML.';
      }
      if (/(dsa|algorithm|data structure)/.test(s)) {
        return 'For DSA: practice Two Pointers and Sliding Window daily. Do 2 easy and 1 medium problem from NeetCode. Review time complexity each time.';
      }
      if (/(web|frontend|react|html|css|javascript)/.test(s)) {
        return 'For Web Dev: build a 2-page responsive site and deploy it. Focus on semantic HTML, CSS Grid, and fetch() to call a public API.';
      }
      if (/(ai|ml|machine|python|deep)/.test(s)) {
        return 'For AI/ML: run one scikit-learn tutorial and write notes on bias vs variance. Then try a small dataset on Kaggle.';
      }
      if (/(resource|course|book|video)/.test(s)) {
        return 'Try: MDN (Web), NeetCode (DSA), scikit-learn docs (ML). Want more domain-specific picks?';
      }
      return 'I can help with study plans, resources, and prioritizing modules. Ask me about DSA, Web Dev, or AI/ML!';
    }
  }

  /* Utils */
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
})();
