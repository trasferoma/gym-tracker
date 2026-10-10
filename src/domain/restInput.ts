import type { SetValueParseResult } from './setInput';

const WHOLE_NUMBER_PATTERN = /^\d+$/;

export function parseRestSecondsInput(rawValue: string): SetValueParseResult<number> {
    const trimmedValue = rawValue.trim();
    if (!WHOLE_NUMBER_PATTERN.test(trimmedValue)) {
        return { valid: false };
    }
    const parsedValue = Number(trimmedValue);
    if (!Number.isSafeInteger(parsedValue)) {
        return { valid: false };
    }
    return { valid: true, value: parsedValue };
}
