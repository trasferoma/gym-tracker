import { gymTrackerDatabase } from './gymTrackerDatabase';

const LAST_BACKUP_DATE_KEY = 'lastBackupDate';

export async function readLastBackupDate(): Promise<string | undefined> {
    const entry = await gymTrackerDatabase.appMeta.get(LAST_BACKUP_DATE_KEY);
    return entry?.value;
}

export async function writeLastBackupDate(date: string): Promise<void> {
    await gymTrackerDatabase.appMeta.put({ key: LAST_BACKUP_DATE_KEY, value: date });
}

export async function clearLastBackupDate(): Promise<void> {
    await gymTrackerDatabase.appMeta.delete(LAST_BACKUP_DATE_KEY);
}
