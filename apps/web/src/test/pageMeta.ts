/** The names in the BreadcrumbList JSON-LD that `usePageMeta` appended, in page order. */
export function breadcrumbs(): string[] {
  const script = document.getElementById('breadcrumb-schema');
  if (!script) return [];
  const schema = JSON.parse(script.textContent ?? '') as { itemListElement: { name: string }[] };
  return schema.itemListElement.map((item) => item.name);
}

/** The canonical URL, og:url and twitter:url `usePageMeta` set; one value when they agree. */
export function pageUrl(): string | string[] {
  const urls = [
    document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    document.querySelector('meta[property="og:url"]')?.getAttribute('content'),
    document.querySelector('meta[property="twitter:url"]')?.getAttribute('content'),
  ].map(String);
  return new Set(urls).size === 1 ? urls[0]! : urls;
}
