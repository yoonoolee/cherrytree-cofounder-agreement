import { useEffect } from 'react';

/** Public origin of the marketing site; canonical and social URLs always point here. */
const SITE_URL = 'https://cherrytree.app';

/** One BreadcrumbList item; the last crumb (current page) has no url. */
interface Breadcrumb {
  name: string;
  url?: string;
}

export interface PageMeta {
  /** Page title */
  title: string;
  /** Page description */
  description: string;
  /** The page's own path, e.g. `/pricing`; sets the canonical URL, og:url and twitter:url. */
  path: string;
  /** Open Graph title (defaults to title) */
  ogTitle?: string;
  /** Open Graph description (defaults to description) */
  ogDescription?: string;
  /** Breadcrumb items, e.g. [{name: "Home", url: "/"}, {name: "About"}] */
  breadcrumbs?: readonly Breadcrumb[];
}

/** Sets `attribute` on the element matching `selector` and returns a function that restores it. */
function setAttribute(selector: string, attribute: string, value: string): () => void {
  const element = document.querySelector(selector);
  if (!element) return () => {};
  const previous = element.getAttribute(attribute);
  element.setAttribute(attribute, value);
  return () => {
    if (previous === null) element.removeAttribute(attribute);
    else element.setAttribute(attribute, previous);
  };
}

/**
 * Sets the page title, description, canonical URL and social tags for SEO and link previews,
 * and puts back what it replaced on unmount.
 */
export function usePageMeta({
  title,
  description,
  path,
  ogTitle,
  ogDescription,
  breadcrumbs,
}: PageMeta) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    const previousTitle = document.title;
    document.title = title;

    const restores = [
      setAttribute('meta[name="description"]', 'content', description),
      setAttribute('link[rel="canonical"]', 'href', url),
      setAttribute('meta[property="og:url"]', 'content', url),
      setAttribute('meta[property="og:title"]', 'content', ogTitle || title),
      setAttribute('meta[property="og:description"]', 'content', ogDescription || description),
      setAttribute('meta[property="twitter:url"]', 'content', url),
      setAttribute('meta[property="twitter:title"]', 'content', ogTitle || title),
      setAttribute('meta[property="twitter:description"]', 'content', ogDescription || description),
    ];

    let breadcrumbScript: HTMLScriptElement | null = null;
    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          ...(crumb.url && { item: `${SITE_URL}${crumb.url}` }),
        })),
      };

      breadcrumbScript = document.createElement('script');
      breadcrumbScript.type = 'application/ld+json';
      breadcrumbScript.text = JSON.stringify(breadcrumbSchema);
      breadcrumbScript.id = 'breadcrumb-schema';
      document.head.appendChild(breadcrumbScript);
    }

    return () => {
      document.title = previousTitle;
      restores.forEach((restore) => restore());
      breadcrumbScript?.remove();
    };
  }, [title, description, path, ogTitle, ogDescription, breadcrumbs]);
}
