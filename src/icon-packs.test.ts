import { it, expect } from 'vitest';
import { getExtraPath } from './icon-packs';

it('should return the correct extra path for an icon pack', () => {
  const iconPackName = 'simple-icons';
  const expectedPath = 'simple-icons-16.5.0/icons/';

  const path = getExtraPath(iconPackName);

  expect(path).toEqual(expectedPath);
});

it('should return `undefined` for an icon pack that does not exist', () => {
  const iconPackName = 'non-existent-icon-pack';

  const path = getExtraPath(iconPackName);

  expect(path).toBeUndefined();
});
