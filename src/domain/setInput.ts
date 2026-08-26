export type SetValueParseResult<T> =
    | { readonly valid: true; readonly value: T }
    | { readonly valid: false };

export function parseRepetitionsInput(rawValue: string): SetValueParseResult<number> {
    const trimmedValue = rawValue.trim();
    if (trimmedValue.length === 0) {
        return { valid: false };
    }
    const parsedValue = Number(trimmedValue);
    const isValidRepetitions = Number.isInteger(parsedValue) && parsedValue > 0;
    if (!isValidRepetitions) {
        return { valid: false };
    }
    return { valid: true, value: parsedValue };
}

export function parseWeightInput(rawValue: string): SetValueParseResult<number> {
    const normalizedValue = rawValue.trim().replace(',', '.');
    if (normalizedValue.length === 0) {
        return { valid: false };
    }
    const parsedValue = Number(normalizedValue);
    const isValidWeight = Number.isFinite(parsedValue) && parsedValue >= 0;
    if (!isValidWeight) {
        return { valid: false };
    }
    return { valid: true, value: parsedValue };
}
