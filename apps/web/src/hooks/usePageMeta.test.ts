import { renderHook } from '@testing-library/react';

import { usePageMeta } from './usePageMeta.ts';

function meta(selector: string): string | null {
  return document.querySelector(selector)?.getAttribute('content') ?? null;
}

function canonical(): string | null {
  return document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null;
}

beforeEach(() => {
  document.head.innerHTML = `
    <link rel="canonical" href="https://cherrytree.app/" />
    <meta property="og:url" content="https://cherrytree.app/" />
    <meta property="twitter:url" content="https://cherrytree.app/" />
    <meta name="description" content="default description" />
    <meta property="og:title" content="default og title" />
    <meta property="og:description" content="default og description" />
    <meta property="twitter:title" content="default twitter title" />
    <meta property="twitter:description" content="default twitter description" />
  `;
  document.title = 'before';
});

describe('usePageMeta', () => {
  it('sets the title and the description/social tags, falling back to title and description', () => {
    renderHook(() =>
      usePageMeta({ path: '/pricing', title: 'Pricing', description: 'Plans and prices' }),
    );

    expect(document.title).toBe('Pricing');
    expect(meta('meta[name="description"]')).toBe('Plans and prices');
    expect(meta('meta[property="og:title"]')).toBe('Pricing');
    expect(meta('meta[property="og:description"]')).toBe('Plans and prices');
    expect(meta('meta[property="twitter:title"]')).toBe('Pricing');
    expect(meta('meta[property="twitter:description"]')).toBe('Plans and prices');
  });

  it('prefers explicit social copy', () => {
    renderHook(() =>
      usePageMeta({
        path: '/pricing',
        title: 'Pricing',
        description: 'Plans',
        ogTitle: 'Cherrytree pricing',
        ogDescription: 'Pick a plan',
      }),
    );
    expect(meta('meta[property="og:title"]')).toBe('Cherrytree pricing');
    expect(meta('meta[property="twitter:description"]')).toBe('Pick a plan');
    expect(meta('meta[name="description"]')).toBe('Plans');
  });

  it('adds breadcrumb JSON-LD with absolute links and removes it on unmount', () => {
    const { unmount } = renderHook(() =>
      usePageMeta({
        path: '/about',
        title: 'About',
        description: 'Us',
        breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'About' }],
      }),
    );

    const script = document.getElementById('breadcrumb-schema');
    expect(script?.getAttribute('type')).toBe('application/ld+json');
    expect(JSON.parse(script?.textContent ?? '')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://cherrytree.app/' },
        { '@type': 'ListItem', position: 2, name: 'About' },
      ],
    });

    unmount();
    expect(document.getElementById('breadcrumb-schema')).toBeNull();
  });

  it("points the canonical URL, og:url and twitter:url at the page's own path", () => {
    renderHook(() => usePageMeta({ path: '/pricing', title: 'Pricing', description: 'Plans' }));
    expect(canonical()).toBe('https://cherrytree.app/pricing');
    expect(meta('meta[property="og:url"]')).toBe('https://cherrytree.app/pricing');
    expect(meta('meta[property="twitter:url"]')).toBe('https://cherrytree.app/pricing');
  });

  it('follows a route change to another page', () => {
    const { rerender } = renderHook(
      (path: string) => usePageMeta({ path, title: path, description: path }),
      { initialProps: '/pricing' },
    );
    rerender('/about');
    expect(canonical()).toBe('https://cherrytree.app/about');
    expect(meta('meta[property="og:url"]')).toBe('https://cherrytree.app/about');
  });

  it('puts back every tag it replaced on unmount', () => {
    const { unmount } = renderHook(() =>
      usePageMeta({ path: '/pricing', title: 'Pricing', description: 'Plans' }),
    );
    unmount();
    expect(document.title).toBe('before');
    expect(meta('meta[name="description"]')).toBe('default description');
    expect(canonical()).toBe('https://cherrytree.app/');
    expect(meta('meta[property="og:url"]')).toBe('https://cherrytree.app/');
    expect(meta('meta[property="og:title"]')).toBe('default og title');
    expect(meta('meta[property="twitter:url"]')).toBe('https://cherrytree.app/');
  });
});
