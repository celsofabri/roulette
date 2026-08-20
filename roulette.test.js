'use strict';

const test = require('node:test');
const assert = require('node:assert');
const Roulette = require('./logic.js');

test('computeGeometry: 12 faces de 150px', () => {
  const g = Roulette.computeGeometry(12, 150);
  assert.ok(Math.abs(g.radius - 280) < 0.1, `raio esperado ~280, veio ${g.radius}`);
  assert.strictEqual(g.seg, 30);
});

test('computeGeometry: 28 faces de 105px', () => {
  const g = Roulette.computeGeometry(28, 105);
  assert.ok(Math.abs(g.radius - 465.7) < 1, `raio esperado ~465.7, veio ${g.radius}`);
  assert.ok(Math.abs(g.seg - 12.857142857) < 0.001, `seg esperado ~12.857, veio ${g.seg}`);
});

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
  // winner=3, seg=30 => face frontal quando (3*30 + target) % 360 == 0
  const target = Roulette.computeTargetAngle(3, 30, 0, 4);
  const mod = ((3 * 30 + target) % 360 + 360) % 360;
  assert.ok(mod < 1e-9, `face 3 não está de frente (mod=${mod})`);
});

test('computeTargetAngle: funciona para qualquer vencedor e ângulo atual', () => {
  const N = 28;
  const seg = 360 / N;
  for (let w = 0; w < N; w++) {
    const currentAngle = (w * 137.5) % 360; // ângulo arbitrário, determinístico
    const fullSpins = 5;
    const target = Roulette.computeTargetAngle(w, seg, currentAngle, fullSpins);
    const total = w * seg + target;
    // distância até o múltiplo de 360 mais próximo (deve ser ~0)
    const diff = Math.abs(total / 360 - Math.round(total / 360)) * 360;
    assert.ok(diff < 1e-6, `face ${w} não está de frente (diff=${diff})`);
    assert.ok(target >= currentAngle, `alvo ${target} não avança a partir de ${currentAngle}`);
  }
});
