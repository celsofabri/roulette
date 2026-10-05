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
    'carla-joia.png', 'celso-fabri.jpg', 'david-rezende.png', 'debora-ellen.jpg',
    'douglas-queiroz.jpg', 'gabrielly-silva.png', 'glenda-faria.png', 'guilherme-hernandez.jpg',
    'luciana-correa.png', 'luisa-larrieu.png', 'paula-assis.jpg', 'talissa-dahlke.jpg',
    'thalyta-nascimento.jpg', 'vitor-shoji.jpg'
  ];
  var FACE = 150;          // largura de cada face (px)
  var RADIUS = 280;        // raio do carrossel (px)
  var SEG_VISUAL = 30;     // espaçamento visual (graus) entre a face central e as laterais
  var PASSWORD = '123faster';

  document.documentElement.style.setProperty('--face', FACE + 'px');

  // palco e controles
  var piao = document.getElementById('piao');
  var playBtn = document.getElementById('play');
  var muteBtn = document.getElementById('mute');
  var audio = document.querySelector('audio');
  var sortearBtn = document.getElementById('sortear');
  var resultEl = document.getElementById('result');
  var wrapper = document.getElementById('wrapper');

  // seleção de participantes
  var selectorEl = document.getElementById('selector');
  var selectorGrid = document.getElementById('selector-grid');
  var confirmBtn = document.getElementById('confirm');
  var selectAllBtn = document.getElementById('select-all');
  var selectNoneBtn = document.getElementById('select-none');
  var participantsBtn = document.getElementById('participants');

  // telas de abertura
  var landingEl = document.getElementById('landing');
  var gateEl = document.getElementById('gate');
  var builderEl = document.getElementById('builder');
  var modeCustomBtn = document.getElementById('mode-custom');
  var modeFasterBtn = document.getElementById('mode-faster');
  var gateBackBtn = document.getElementById('gate-back');
  var gateEnterBtn = document.getElementById('gate-enter');
  var gatePasswordEl = document.getElementById('gate-password');
  var gateErrorEl = document.getElementById('gate-error');
  var builderBackBtn = document.getElementById('builder-back');
  var builderStartBtn = document.getElementById('builder-start');
  var builderNamesEl = document.getElementById('builder-names');

  var fxCanvas = document.getElementById('fx');
  var fxCtx = fxCanvas.getContext('2d');

  // estado do carrossel
  var people = [];
  var N = 0;
  var SEG = 0;
  var faces = [];
  var selected = [];
  var angle = 0;
  var phase = 'idle';           // idle | spinning | paused | drawing | done | select
  var raf = null;
  var lastT = 0;
  var muted = false;
  var SPEED = 360 / 4000;       // graus por ms (1 volta a cada 4s)

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

  // responsivo: encolhe o carrossel para caber na tela (sem alterar o tamanho de projeto)
  function fitToScreen() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var scale = Math.min(1, (w - 40) / 720, (h - 160) / 720);
    if (scale < 0.35) scale = 0.35;
    wrapper.style.transform = 'scale(' + scale + ')';
  }
  window.addEventListener('resize', fitToScreen);
  fitToScreen();

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  // ---- montagem do carrossel ----
  function buildFaces(showPhotos) {
    piao.innerHTML = '';
    var frag = document.createDocumentFragment();
    people.forEach(function (p) {
      var face = document.createElement('div');
      face.className = 'face ' + (showPhotos ? 'photo' : 'name-only');
      face.setAttribute('data-name', p.name);
      if (showPhotos) {
        var img = document.createElement('img');
        img.src = 'fotos/' + p.file;
        img.alt = p.name;
        var label = document.createElement('span');
        label.className = 'label';
        label.textContent = p.name;
        face.appendChild(img);
        face.appendChild(label);
      } else {
        var nameEl = document.createElement('span');
        nameEl.className = 'name';
        nameEl.textContent = p.name;
        face.appendChild(nameEl);
      }
      frag.appendChild(face);
    });
    piao.appendChild(frag);
  }

  function setupWheel(peopleList, showPhotos) {
    people = peopleList;
    N = people.length;
    SEG = 360 / N;
    buildFaces(showPhotos);
    faces = Array.prototype.slice.call(document.querySelectorAll('#piao .face'));
    selected = faces.map(function () { return true; });
    buildSelector(showPhotos);
    resetTo('idle', false);
  }

  function updateFaces() {
    for (var i = 0; i < N; i++) {
      var off = Roulette.coverflowOffset(i, SEG, angle, N);
      faces[i].style.opacity = Roulette.coverflowOpacity(off);
      faces[i].style.transform =
        'rotateY(' + (off * SEG_VISUAL).toFixed(2) + 'deg) translateZ(' + RADIUS + 'px)';
    }
  }

  function clearWinner() {
    faces.forEach(function (f) { f.classList.remove('winner'); });
  }

  function updateUI() {
    playBtn.innerHTML = (phase === 'spinning') ? '❚❚' : '▶';

    if (phase === 'spinning') {
      sortearBtn.style.display = '';
      sortearBtn.textContent = 'Sortear';
    } else if (phase === 'done') {
      sortearBtn.style.display = '';
      sortearBtn.textContent = 'Começar do zero';
    } else {
      sortearBtn.style.display = 'none';
    }

    // música toca durante o giro, a desaceleração e após o sorteio, salvo se estiver mutado
    if (muted || (phase !== 'spinning' && phase !== 'drawing' && phase !== 'done')) {
      audio.pause();
    } else {
      var p = audio.play();
      if (p && p.catch) p.catch(function () {});
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

  function buildSelector(showPhotos) {
    selectorGrid.innerHTML = '';
    faces.forEach(function (f, i) {
      var name = f.getAttribute('data-name');
      var p = document.createElement('div');
      p.className = 'person selected';
      if (showPhotos) {
        var imgSrc = f.querySelector('img').getAttribute('src');
        p.innerHTML =
          '<img src="' + imgSrc + '" alt="' + name + '">' +
          '<div class="name">' + name + '</div>' +
          '<div class="check">&#10003;</div>';
      } else {
        p.classList.add('no-photo');
        p.innerHTML =
          '<div class="name">' + name + '</div>' +
          '<div class="check">&#10003;</div>';
      }
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
    updateFaces();
    raf = requestAnimationFrame(loop);
  }

  function startSpinning() {
    cancelAnimationFrame(raf);
    phase = 'spinning';
    lastT = performance.now();
    raf = requestAnimationFrame(loop);
    updateUI();
  }

  function pauseSpin() {
    cancelAnimationFrame(raf);
    phase = 'paused';
    updateUI();
  }

  function resumeSpin() {
    phase = 'spinning';
    lastT = performance.now();
    raf = requestAnimationFrame(loop);
    updateUI();
  }

  function resetTo(phaseTarget, showPanel) {
    cancelAnimationFrame(raf);
    phase = phaseTarget;
    angle = 0;
    updateFaces();
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
    var fullSpins = 5 + Math.floor(Math.random() * 3); // 5 a 7 voltas
    var target = Roulette.computeTargetAngle(winner, SEG, angle, fullSpins);

    var startAngle = angle;
    var startTime = performance.now();
    var duration = 6000; // desaceleração longa para suspense

    function step(now) {
      var t = Math.min(1, (now - startTime) / duration);
      var e = easeOut(t);
      angle = startAngle + (target - startAngle) * e;
      updateFaces();
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        angle = target;
        updateFaces();
        phase = 'done';
        clearWinner();
        faces[winner].classList.add('winner');
        resultEl.innerHTML = 'Sorteado: <strong>' + faces[winner].getAttribute('data-name') + '</strong>';
        launchCelebration();
        updateUI();
      }
    }
    raf = requestAnimationFrame(step);
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

  // ---- abertura: alternância entre as telas ----
  function showOverlay(el) {
    landingEl.classList.add('hidden');
    gateEl.classList.add('hidden');
    builderEl.classList.add('hidden');
    if (el) el.classList.remove('hidden');
  }

  // ▶ / ❚❚ : rodar e pausar (retoma da mesma posição)
  playBtn.addEventListener('click', function (event) {
    event.preventDefault();
    if (phase === 'spinning') {
      pauseSpin();
    } else if (phase === 'paused') {
      resumeSpin();
    } else if (phase === 'idle') {
      startSpinning();
    }
  });

  // ♪ : ligar/desligar a música (independente do giro)
  muteBtn.addEventListener('click', function (event) {
    event.preventDefault();
    muted = !muted;
    muteBtn.classList.toggle('muted', muted);
    updateUI();
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

  // fluxo 1: criar lista de participantes (só nomes)
  modeCustomBtn.addEventListener('click', function () {
    showOverlay(builderEl);
    builderNamesEl.value = '';
    builderNamesEl.focus();
  });

  builderBackBtn.addEventListener('click', function () {
    showOverlay(landingEl);
  });

  builderStartBtn.addEventListener('click', function () {
    var peopleList = Roulette.parseNames(builderNamesEl.value);
    if (peopleList.length === 0) return;
    setupWheel(peopleList, false);
    showOverlay(null);
  });

  // fluxo 2: Roleta Faster (com fotos, protegida por senha)
  modeFasterBtn.addEventListener('click', function () {
    showOverlay(gateEl);
    gatePasswordEl.value = '';
    gateErrorEl.classList.add('hidden');
    gatePasswordEl.focus();
  });

  gateBackBtn.addEventListener('click', function () {
    showOverlay(landingEl);
  });

  function tryPassword() {
    if (gatePasswordEl.value === PASSWORD) {
      setupWheel(Roulette.buildPeople(FILES), true);
      showOverlay(null);
    } else {
      gateErrorEl.classList.remove('hidden');
      gatePasswordEl.value = '';
      gatePasswordEl.focus();
    }
  }

  gateEnterBtn.addEventListener('click', tryPassword);
  gatePasswordEl.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') tryPassword();
  });

  // estado inicial: tela de abertura
  showOverlay(landingEl);
}());
