import type { QueryDocumentSnapshot } from 'firebase/firestore';

import { castConverter } from './firestore.ts';

interface Doc {
  name: string;
  count: number;
}

const converter = castConverter<Doc>();

describe('castConverter', () => {
  it('writes the object as-is', () => {
    const data = { name: 'a', count: 1 };
    expect(converter.toFirestore(data)).toBe(data);
  });

  it('reads the snapshot data as-is, passing the options through', () => {
    const data = { name: 'a', count: 1 };
    const snapshot = { data: vi.fn(() => data) } as unknown as QueryDocumentSnapshot;
    const options = { serverTimestamps: 'estimate' } as const;

    expect(converter.fromFirestore(snapshot, options)).toBe(data);
    expect(snapshot.data).toHaveBeenCalledWith(options);
  });
});
