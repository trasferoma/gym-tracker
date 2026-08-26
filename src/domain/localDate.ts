const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function todayLocalDate(): string {
    return toLocalDate(new Date());
}

export function parseLocalDate(value: string): Date {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7));
    const day = Number(value.slice(8, 10));
    return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function isValidLocalDate(value: string): boolean {
    if (!LOCAL_DATE_PATTERN.test(value)) {
        return false;
    }
    const yearText = value.slice(0, 4);
    const monthText = value.slice(5, 7);
    const dayText = value.slice(8, 10);
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const parsedDate = new Date(year, month - 1, day);
    return parsedDate.getFullYear() === year && parsedDate.getMonth() === month - 1 && parsedDate.getDate() === day;
}
