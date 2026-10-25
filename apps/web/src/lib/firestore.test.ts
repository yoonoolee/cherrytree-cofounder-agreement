import type { QueryDocumentSnapshot } from 'firebase/firestore';
import { z } from 'zod';

import { schemaConverter } from './firestore.ts';

const converter = schemaConverter(z.object({ name: z.string(), count: z.number() }));

function snapshot(data: unknown) {
  return { data: vi.fn(() => data) } as unknown as QueryDocumentSnapshot;
}

describe('schemaConverter', () => {
  it('writes the object as-is', () => {
    const data = { name: 'a', count: 1 };
    expect(converter.toFirestore(data)).toBe(data);
  });

  it('reads and validates the snapshot data, estimating pending server timestamps', () => {
    const snap = snapshot({ name: 'a', count: 1, extra: true });

    expect(converter.fromFirestore(snap)).toEqual({ name: 'a', count: 1 });
    expect(snap.data).toHaveBeenCalledWith({ serverTimestamps: 'estimate' });
  });

  it('passes explicit snapshot options through', () => {
    const snap = snapshot({ name: 'a', count: 1 });
    converter.fromFirestore(snap, { serverTimestamps: 'previous' });
    expect(snap.data).toHaveBeenCalledWith({ serverTimestamps: 'previous' });
  });

  it('rejects a document that does not match the schema', () => {
    expect(() => converter.fromFirestore(snapshot({ name: 'a' }))).toThrow();
  });
});
