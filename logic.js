// Lógica pura da roleta (sem dependência de DOM), empacotada como UMD
// para funcionar no navegador (global `Roulette`) e no Node (module.exports).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Roulette = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Calcula o raio e o passo angular de um prisma regular de N faces.
  function computeGeometry(N, faceWidth) {
    var radius = faceWidth / (2 * Math.tan(Math.PI / N));
    var seg = 360 / N;
    return { radius: radius, seg: seg };
  }

  // Converte "nome-sobrenome.jpg" em "Nome Sobrenome" (sem acentos).
  function titleCaseFromFile(file) {
    var base = String(file).replace(/\.[^.]+$/, '');
    var words = base.split('-');
    var out = [];
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (!w) continue;
      out.push(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    }
    return out.join(' ');
  }

  // Monta a lista de pessoas a partir dos nomes de arquivo.
  function buildPeople(files) {
    return files.map(function (file) {
      return { file: file, name: titleCaseFromFile(file) };
    });
  }

  // Índices dos participantes marcados (truthy) no array `selected`.
  function activeIndices(selected) {
    var out = [];
    for (var i = 0; i < selected.length; i++) {
      if (selected[i]) out.push(i);
    }
    return out;
  }

  // Sorteia um índice entre os ativos. `rand` opcional (default Math.random).
  function pickWinner(active, rand) {
    if (!active || active.length === 0) return -1;
    var r = rand ? rand() : Math.random();
    var idx = Math.floor(r * active.length);
    if (idx >= active.length) idx = active.length - 1;
    return active[idx];
  }

  // Ângulo final para que a face `winner` fique de frente após `fullSpins` voltas.
  function computeTargetAngle(winner, seg, currentAngle, fullSpins) {
    var targetMod = ((360 - winner * seg) % 360 + 360) % 360;
    var currentMod = ((currentAngle % 360) + 360) % 360;
    var delta = (targetMod - currentMod + 360) % 360;
    return currentAngle + fullSpins * 360 + delta;
  }

  return {
    computeGeometry: computeGeometry,
    titleCaseFromFile: titleCaseFromFile,
    buildPeople: buildPeople,
    activeIndices: activeIndices,
    pickWinner: pickWinner,
    computeTargetAngle: computeTargetAngle
  };
}));
