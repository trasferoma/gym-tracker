export const MUSCLE_GROUPS = [
    'Petto',
    'Schiena',
    'Spalle',
    'Bicipiti',
    'Tricipiti',
    'Gambe',
    'Addominali',
    'Polpacci',
    'Glutei',
    'Avambracci',
    'Altro'
] as const;

export type MuscleGroupName = (typeof MUSCLE_GROUPS)[number];
