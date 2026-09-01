export type SetIssueLevel = 'warning' | 'critical';

export function nextSetIssueLevel(current: SetIssueLevel | undefined): SetIssueLevel | undefined {
    if (current === undefined) {
        return 'warning';
    }
    if (current === 'warning') {
        return 'critical';
    }
    return undefined;
}
