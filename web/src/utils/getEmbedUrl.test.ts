import { getEmbedUrl } from './getEmbedUrl.ts';

const PREVIEW = 'https://drive.google.com/file/d/abc123/preview';

describe('getEmbedUrl', () => {
  it('turns a Drive /file/d/ID/view link into the preview URL', () => {
    expect(getEmbedUrl('https://drive.google.com/file/d/abc123/view?usp=sharing')).toBe(PREVIEW);
  });

  it('accepts a /file/d/ID link without /view', () => {
    expect(getEmbedUrl('https://drive.google.com/file/d/abc123')).toBe(PREVIEW);
  });

  it('accepts an open?id=ID link', () => {
    expect(getEmbedUrl('https://drive.google.com/open?id=abc123&authuser=0')).toBe(PREVIEW);
  });

  it('returns a Drive link it cannot parse unchanged', () => {
    const url = 'https://drive.google.com/drive/folders/abc123';
    expect(getEmbedUrl(url)).toBe(url);
  });

  it('returns a non-Drive URL unchanged', () => {
    const url = 'https://storage.googleapis.com/agreements/acme.pdf';
    expect(getEmbedUrl(url)).toBe(url);
  });
});
