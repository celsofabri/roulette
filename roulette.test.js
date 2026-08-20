'use strict';

const test = require('node:test');
const assert = require('node:assert');
const Roulette = require('./logic.js');

test('titleCaseFromFile: converte kebab-case sem acentos', () => {
  assert.strictEqual(Roulette.titleCaseFromFile('celso-fabri.jpg'), 'Celso Fabri');
  assert.strictEqual(Roulette.titleCaseFromFile('rodrigo-dangelo.jpg'), 'Rodrigo Dangelo');
  assert.strictEqual(Roulette.titleCaseFromFile('luciana-correa.png'), 'Luciana Correa');
  assert.strictEqual(Roulette.titleCaseFromFile('joao-bonucci.png'), 'Joao Bonucci');
});

test('buildPeople: gera file + name a partir dos arquivos', () => {
  const people = Roulette.buildPeople(['carla-joia.png', 'celso-fabri.jpg']);
  assert.deepStrictEqual(people, [
    { file: 'carla-joia.png', name: 'Carla Joia' },
    { file: 'celso-fabri.jpg', name: 'Celso Fabri' }
  ]);
});

test('activeIndices: retorna índices marcados', () => {
  assert.deepStrictEqual(Roulette.activeIndices([true, false, true, false]), [0, 2]);
  assert.deepStrictEqual(Roulette.activeIndices([false, false, false]), []);
  assert.deepStrictEqual(Roulette.activeIndices([true, true]), [0, 1]);
});

test('pickWinner: respeita o rand e o conjunto ativo', () => {
  assert.strictEqual(Roulette.pickWinner([5, 9, 12], () => 0), 5);
  assert.strictEqual(Roulette.pickWinner([5, 9, 12], () => 0.999999), 12);
  assert.strictEqual(Roulette.pickWinner([], () => 0), -1);
});

test('computeTargetAngle: deixa a face sorteada de frente', () => {
  const target = Roulette.computeTargetAngle(3, 30, 0, 4);
  const diff = Math.abs((3 * 30 + target) / 360 - Math.round((3 * 30 + target) / 360)) * 360;
  assert.ok(diff < 1e-9, `face 3 não está de frente (diff=${diff})`);
});

test('computeTargetAngle: funciona para qualquer vencedor e ângulo atual', () => {
  const N = 28;
  const seg = 360 / N;
  for (let w = 0; w < N; w++) {
    const currentAngle = (w * 137.5) % 360; // ângulo arbitrário, determinístico
    const fullSpins = 5;
    const target = Roulette.computeTargetAngle(w, seg, currentAngle, fullSpins);
    const total = w * seg + target;
    const diff = Math.abs(total / 360 - Math.round(total / 360)) * 360;
    assert.ok(diff < 1e-6, `face ${w} não está de frente (diff=${diff})`);
    assert.ok(target < currentAngle, `alvo ${target} não retrocede a partir de ${currentAngle}`);
  }
});

test('computeTargetAngle: gira no sentido decrescente e não zera a volta', () => {
  // face 0 já alinhada: mesmo assim deve girar uma volta completa a mais
  const target = Roulette.computeTargetAngle(0, 30, 0, 4);
  assert.strictEqual(target, -1800);
  const diff = Math.abs((0 * 30 + target) / 360 - Math.round((0 * 30 + target) / 360)) * 360;
  assert.ok(diff < 1e-9);
});

test('coverflowOffset: frente=0, vizinhas=±1 e opostas no fundo', () => {
  const n = 29;
  const seg = 360 / n;
  assert.strictEqual(Roulette.coverflowOffset(0, seg, 0, n), 0);
  assert.strictEqual(Roulette.coverflowOffset(1, seg, 0, n), 1);
  assert.strictEqual(Roulette.coverflowOffset(28, seg, 0, n), -1);
  // as faces opostas ficam longe da frente (|offset| ≈ 14)
  assert.ok(Math.abs(Roulette.coverflowOffset(14, seg, 0, n)) > 13);
  assert.ok(Math.abs(Roulette.coverflowOffset(15, seg, 0, n)) > 13);
});

test('coverflowOffset: uma volta completa retorna à mesma face', () => {
  const n = 29;
  const seg = 360 / n;
  assert.ok(Math.abs(Roulette.coverflowOffset(0, seg, -360, n)) < 1e-9);
});

test('coverflowOpacity: centro=1, vizinhas=0.5, demais=0', () => {
  assert.strictEqual(Roulette.coverflowOpacity(0), 1);
  assert.strictEqual(Roulette.coverflowOpacity(0.4), 1);
  assert.strictEqual(Roulette.coverflowOpacity(1), 0.5);
  assert.strictEqual(Roulette.coverflowOpacity(-1), 0.5);
  assert.strictEqual(Roulette.coverflowOpacity(1.5), 0.5);
  assert.strictEqual(Roulette.coverflowOpacity(2), 0);
});
