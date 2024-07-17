// math.test.js
const { add } = require('./math');

test('soma 1 + 2 para igualar 3', () => {
  expect(add(1, 2)).toBe(3);
});
