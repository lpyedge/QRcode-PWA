import { describe, it, expect } from 'vitest';
import { getAndDeleteShare, openShareDb, saveShare, type ShareRecord } from '$lib/utils/shareDb';

describe('shareDb', () => {
  it('gets and deletes a record atomically', async () => {
    const db = await openShareDb();
    const record: ShareRecord = {
      id: 'share-1',
      type: 'text',
      timestamp: Date.now(),
      data: { title: 'Title', text: 'Hello', url: 'https://example.com' },
      metadata: {}
    };

    await saveShare(db, record);

    const first = await getAndDeleteShare(db, record.id);
    expect(first).not.toBeNull();
    expect(first?.id).toBe(record.id);

    const second = await getAndDeleteShare(db, record.id);
    expect(second).toBeNull();

    db.close();
  });
});
