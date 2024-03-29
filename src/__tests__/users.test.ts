import { describe, expect, test } from '@jest/globals';

const sum = (a, b): Promise<void> => {
  return a + b;
};

describe('sum module', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });
});
