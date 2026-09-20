/** The names in the BreadcrumbList JSON-LD that `usePageMeta` appended, in page order. */
export function breadcrumbs(): string[] {
  const script = document.getElementById('breadcrumb-schema');
  if (!script) return [];
  const schema = JSON.parse(script.textContent ?? '') as { itemListElement: { name: string }[] };
  return schema.itemListElement.map((item) => item.name);
}
