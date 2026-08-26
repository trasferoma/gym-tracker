import { describe, expect, it } from 'vitest';

import { APP_VERSION } from './appVersion';

describe('APP_VERSION', () => {
    it('rispetta il formato v<maggiore>.<minore>.<contatore a tre cifre>', () => {
        expect(APP_VERSION).toMatch(/^v\d+\.\d+\.\d{3}$/);
    });
});
