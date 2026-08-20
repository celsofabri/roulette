// gera as listras de fundo
(function () {
  var deco = document.getElementById('decoracao');
  var frag = document.createDocumentFragment();
  for (var i = 0; i < 45; i++) {
    var d = document.createElement('div');
    d.style.webkitTransform = 'rotate(' + (i * 4) + 'deg)';
    d.style.mozTransform = 'rotate(' + (i * 4) + 'deg)';
    d.style.transform = 'rotate(' + (i * 4) + 'deg)';
    frag.appendChild(d);
  }
  deco.appendChild(frag);
}());

(function () {
  var FILES = [
    'carla-joia.png', 'carolina-ovidio.jpg', 'celso-fabri.jpg', 'david-rezende.png',
    'debora-ellen.jpg', 'douglas-queiroz.jpg', 'euller-nobrega.jpg', 'gabrielly-silva.png', 'glaide-oliveira.jpg',
    'guilherme-hernandez.jpg', 'helena-dantas.jpg', 'henrique-morbin.jpg', 'jessica-rodrigues.png',
    'joao-bonucci.png', 'leonardo-lopes.png', 'luciana-correa.png', 'luisa-larrieu.png',
    'luiz-costa.png', 'maria-nunes.jpg', 'matheus-cabral.jpg', 'monia-lodo.png',
    'paula-assis.jpg', 'rafael-soares.jpg', 'raquel-nicolau.jpg', 'rodrigo-dangelo.jpg',
    'rodrigo-teixeira.jpg', 'talissa-dahlke.jpg', 'thalyta-nascimento.jpg', 'washington-rodrigues.jpg'
  ];
  var FACE = 105; // largura de cada face em px

  var people = Roulette.buildPeople(FILES);
  var N = people.length;
  var geometry = Roulette.computeGeometry(N, FACE);
  var SEG = geometry.seg;
  var RADIUS = geometry.radius;
  var SCALE = RADIUS / 280;

  // geometria dinâmica (28 faces => raio ~466px) via variáveis CSS
  document.documentElement.style.setProperty('--face', FACE + 'px');
  document.documentElement.style.setProperty('--seg', SEG + 'deg');
  document.documentElement.style.setProperty('--radius', RADIUS + 'px');
  document.documentElement.style.setProperty('--scale', SCALE);

  var piao = document.getElementById('piao');
  var faceFrag = document.createDocumentFragment();
  people.forEach(function (p, i) {
    var face = document.createElement('div');
    face.className = 'face';
    face.style.setProperty('--i', i);
    var img = document.createElement('img');
    img.src = 'fotos/' + p.file;
    img.alt = p.name;
    var label = document.createElement('span');
    label.className = 'label';
    label.textContent = p.name;
    face.appendChild(img);
    face.appendChild(label);
    faceFrag.appendChild(face);
  });
  piao.appendChild(faceFrag);

  var muteBtn = document.querySelector('#mute');
  var audio = document.querySelector('audio');
  var sortearBtn = document.getElementById('sortear');
  var resultEl = document.getElementById('result');
  var faces = Array.prototype.slice.call(document.querySelectorAll('#piao .face'));

  // seleção de participantes
  var selectorEl = document.getElementById('selector');
  var selectorGrid = document.getElementById('selector-grid');
  var confirmBtn = document.getElementById('confirm');
  var selectAllBtn = document.getElementById('select-all');
  var selectNoneBtn = document.getElementById('select-none');
  var participantsBtn = document.getElementById('participants');
  var selected = faces.map(function () { return true; }); // todos marcados por padrão

  var fxCanvas = document.getElementById('fx');
  var fxCtx = fxCanvas.getContext('2d');

  var SPEED = 360 / 4000;         // graus por ms (1 volta a cada 4s)

  var angle = 0;
  var phase = 'select';           // select | idle | spinning | drawing | done
  var raf = null;
  var lastT = 0;
  var drawTimer = null;

  // estado dos efeitos (fogos + confetes)
  var particles = [];
  var fxRunning = false;
  var fxSession = 0;
  var COLORS = ['#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
                '#911eb4', '#46f0f0', '#f032e6', '#9A6324', '#e6beff'];

  function resizeFx() {
    fxCanvas.width = window.innerWidth;
    fxCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeFx);
  resizeFx();

  function clearWinner() {
    faces.forEach(function (f) { f.classList.remove('winner'); });
  }

  function updateUI() {
    if (phase === 'spinning') {
      sortearBtn.style.display = '';
      sortearBtn.textContent = 'Sortear';
    } else if (phase === 'done') {
      sortearBtn.style.display = '';
      sortearBtn.textContent = 'Começar do zero';
    } else {
      sortearBtn.style.display = 'none';
    }
  }

  function syncSelector() {
    var cards = selectorGrid.children;
    for (var c = 0; c < cards.length; c++) {
      cards[c].classList.toggle('selected', selected[c]);
    }
  }

  function applySelection() {
    var count = 0;
    faces.forEach(function (f, i) {
      var on = selected[i];
      if (on) count++;
      f.classList.toggle('dimmed', !on);
    });
    confirmBtn.textContent = 'Começar (' + count + ')';
    confirmBtn.disabled = count === 0;
  }

  function buildSelector() {
    selectorGrid.innerHTML = '';
    faces.forEach(function (f, i) {
      var name = f.querySelector('.label').textContent;
      var imgSrc = f.querySelector('img').getAttribute('src');
      var p = document.createElement('div');
      p.className = 'person selected';
      p.innerHTML =
        '<img src="' + imgSrc + '" alt="' + name + '">' +
        '<div class="name">' + name + '</div>' +
        '<div class="check">&#10003;</div>';
      p.addEventListener('click', function () {
        selected[i] = !selected[i];
        p.classList.toggle('selected', selected[i]);
        applySelection();
      });
      selectorGrid.appendChild(p);
    });
    applySelection();
  }

  function loop(now) {
    if (phase !== 'spinning') return;
    var dt = now - lastT;
    lastT = now;
    angle -= SPEED * dt;
    piao.style.transform = 'rotateY(' + angle + 'deg)';
    raf = requestAnimationFrame(loop);
  }

  function startSpinning() {
    cancelAnimationFrame(raf);
    phase = 'spinning';
    piao.style.transition = 'none';
    lastT = performance.now();
    raf = requestAnimationFrame(loop);
    updateUI();
  }

  function resetTo(phaseTarget, showPanel) {
    audio.pause();
    audio.currentTime = 0;
    muteBtn.innerHTML = '▶';
    cancelAnimationFrame(raf);
    clearTimeout(drawTimer);
    phase = phaseTarget;
    angle = 0;
    piao.style.transition = 'none';
    piao.style.transform = 'rotateY(0deg)';
    clearWinner();
    resultEl.innerHTML = '';
    clearFx();
    if (showPanel) {
      selectorEl.classList.remove('hidden');
    } else {
      selectorEl.classList.add('hidden');
    }
    updateUI();
  }

  function fullReset() {
    resetTo('idle', false);
  }

  function showSelector() {
    resetTo('select', true);
  }

  function draw() {
    if (phase !== 'spinning') return;
    cancelAnimationFrame(raf);
    phase = 'drawing';
    updateUI();

    var active = Roulette.activeIndices(selected);
    if (active.length === 0) {
      fullReset();
      return;
    }
    var winner = Roulette.pickWinner(active);
    var fullSpins = 4 + Math.floor(Math.random() * 3);
    var target = Roulette.computeTargetAngle(winner, SEG, angle, fullSpins);
    angle = target;

    var duration = 4000;
    piao.style.transition = 'transform ' + duration + 'ms cubic-bezier(0.15, 0.85, 0.25, 1)';
    piao.style.transform = 'rotateY(' + target + 'deg)';

    drawTimer = setTimeout(function () {
      phase = 'done';
      clearWinner();
      faces[winner].classList.add('winner');
      resultEl.innerHTML = 'Sorteado: <strong>' + faces[winner].querySelector('.label').textContent + '</strong>';
      launchCelebration();
      updateUI();
    }, duration + 60);
  }

  // ---- fogos + confetes ----
  function launchCelebration() {
    var session = ++fxSession;

    // confetes caindo do topo
    for (var i = 0; i < 220; i++) {
      particles.push({
        type: 'confetti',
        x: Math.random() * fxCanvas.width,
        y: -20 - Math.random() * 300,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 4,
        size: 6 + Math.random() * 6,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        life: 1
      });
    }

    // fogos de artifício (rajadas em sequência)
    var bursts = 6;
    for (var b = 0; b < bursts; b++) {
      (function (delay, sid) {
        setTimeout(function () {
          if (sid !== fxSession) return;
          var cx = fxCanvas.width * (0.2 + 0.6 * Math.random());
          var cy = fxCanvas.height * (0.15 + 0.35 * Math.random());
          var color = COLORS[(Math.random() * COLORS.length) | 0];
          for (var j = 0; j < 50; j++) {
            var ang = Math.random() * Math.PI * 2;
            var speed = 2 + Math.random() * 5;
            particles.push({
              type: 'firework',
              x: cx, y: cy,
              vx: Math.cos(ang) * speed,
              vy: Math.sin(ang) * speed,
              size: 2 + Math.random() * 2.5,
              color: color,
              life: 1,
              decay: 0.012 + Math.random() * 0.008
            });
          }
        }, delay);
      }(b * 380, session));
    }

    startFxLoop();
  }

  function startFxLoop() {
    if (fxRunning) return;
    fxRunning = true;
    fxLoop();
  }

  function fxLoop() {
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.type === 'confetti') {
        p.vy += 0.05;
        p.rot += p.vr;
        p.life -= 0.003;
      } else {
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.vy += 0.06;
        p.life -= p.decay;
      }

      if (p.life <= 0 || p.y > fxCanvas.height + 30) {
        particles.splice(i, 1);
        continue;
      }

      fxCtx.globalAlpha = Math.max(0, p.life);
      fxCtx.fillStyle = p.color;
      if (p.type === 'confetti') {
        fxCtx.save();
        fxCtx.translate(p.x, p.y);
        fxCtx.rotate(p.rot);
        fxCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        fxCtx.restore();
      } else {
        fxCtx.beginPath();
        fxCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        fxCtx.fill();
      }
    }
    fxCtx.globalAlpha = 1;

    if (particles.length > 0) {
      requestAnimationFrame(fxLoop);
    } else {
      fxRunning = false;
      fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    }
  }

  function clearFx() {
    fxSession++;
    particles = [];
    fxRunning = false;
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
  }

  // ▶ / ❚❚ : liga/desliga música + giro (stop volta tudo ao zero)
  muteBtn.addEventListener('click', function (event) {
    event.preventDefault();
    if (audio.paused) {
      audio.play();
      muteBtn.innerHTML = '❚❚';
      startSpinning();
    } else {
      fullReset();
    }
  });

  // "Sortear" / "Começar do zero"
  sortearBtn.addEventListener('click', function () {
    if (phase === 'spinning') {
      draw();
    } else if (phase === 'done') {
      fullReset();
    }
  });

  // seleção de participantes
  participantsBtn.addEventListener('click', function (event) {
    event.preventDefault();
    showSelector();
  });

  confirmBtn.addEventListener('click', function () {
    if (confirmBtn.disabled) return;
    selectorEl.classList.add('hidden');
    phase = 'idle';
    updateUI();
  });

  selectAllBtn.addEventListener('click', function () {
    selected = faces.map(function () { return true; });
    syncSelector();
    applySelection();
  });

  selectNoneBtn.addEventListener('click', function () {
    selected = faces.map(function () { return false; });
    syncSelector();
    applySelection();
  });

  buildSelector();
  updateUI();
}());
