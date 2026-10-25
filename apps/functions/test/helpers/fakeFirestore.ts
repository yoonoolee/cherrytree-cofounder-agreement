/**
 * In-memory stand-in for a typed Firestore collection, for unit tests that `vi.mock` the
 * `src/lib/firebase.ts` module. Only the members the handlers use are implemented; `update`
 * merges top-level keys and keeps dotted field paths as literal keys so tests can assert on
 * exactly what was written.
 */
import { vi } from 'vitest';

type Doc = Record<string, unknown>;

export interface FakeDocRef {
  id: string;
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}

export interface FakeCollection {
  doc: (id: string) => FakeDocRef;
  store: Map<string, Doc>;
}

export function fakeCollection(initial: Record<string, Doc> = {}): FakeCollection {
  // Documents are kept by reference: build fresh fixtures per test rather than sharing them.
  const store = new Map<string, Doc>(Object.entries(initial));
  const refs = new Map<string, FakeDocRef>();

  const createRef = (id: string): FakeDocRef => ({
    id,
    get: vi.fn(async () => ({ id, exists: store.has(id), data: () => store.get(id) })),
    set: vi.fn(async (data: Doc, options?: { merge?: boolean }) => {
      store.set(id, options?.merge ? { ...store.get(id), ...data } : data);
    }),
    update: vi.fn(async (data: Doc) => {
      if (!store.has(id)) throw new Error(`No document to update: ${id}`);
      store.set(id, { ...store.get(id), ...data });
    }),
  });

  return {
    store,
    doc(id: string) {
      let ref = refs.get(id);
      if (!ref) {
        ref = createRef(id);
        refs.set(id, ref);
      }
      return ref;
    },
  };
}
