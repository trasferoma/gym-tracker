export type ReorderDirection = 'up' | 'down';

export function reindexPositions<T extends { readonly position: number }>(items: readonly T[]): T[] {
    return items.map((item, index) => ({ ...item, position: index }));
}

export function reorderByPosition<T extends { readonly id: string; readonly position: number }>(
        items: readonly T[], id: string, direction: ReorderDirection): T[] {
    const currentIndex = items.findIndex((item) => item.id === id);
    if (currentIndex < 0) {
        throw new Error(`Elemento non trovato: ${id}`);
    }
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const isOutOfBounds = targetIndex < 0 || targetIndex >= items.length;
    if (isOutOfBounds) {
        return [...items];
    }
    const swapped = [...items];
    const currentItem = swapped[currentIndex]!;
    const targetItem = swapped[targetIndex]!;
    swapped[currentIndex] = targetItem;
    swapped[targetIndex] = currentItem;
    return reindexPositions(swapped);
}
