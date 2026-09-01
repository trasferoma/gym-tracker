import { describe, expect, it } from 'vitest';

import { nextSetIssueLevel } from './setIssue';

describe('nextSetIssueLevel', () => {
    it('cicla tra assente, warning, critical e di nuovo assente', () => {
        expect(nextSetIssueLevel(undefined)).toBe('warning');
        expect(nextSetIssueLevel('warning')).toBe('critical');
        expect(nextSetIssueLevel('critical')).toBe(undefined);
    });
});
