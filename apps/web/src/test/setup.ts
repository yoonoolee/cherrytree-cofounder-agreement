import '@testing-library/jest-dom/vitest';

// The URL tags index.html ships with; usePageMeta rewrites them per page.
beforeEach(() => {
  document.head.innerHTML = `
    <link rel="canonical" href="https://cherrytree.app/" />
    <meta property="og:url" content="https://cherrytree.app/" />
    <meta property="twitter:url" content="https://cherrytree.app/" />
  `;
});
