import { useEffect } from 'react';

/**
 * Custom hook to update page title and meta tags for SEO
 * @param {Object} params
 * @param {string} params.title - Page title
 * @param {string} params.description - Page description
 * @param {string} params.ogTitle - Open Graph title (optional, defaults to title)
 * @param {string} params.ogDescription - Open Graph description (optional, defaults to description)
 * @param {Array} params.breadcrumbs - Breadcrumb items (optional) - [{name: "Home", url: "/"}, {name: "About"}]
 */
export function usePageMeta({ title, description, ogTitle, ogDescription, breadcrumbs }) {
  useEffect(() => {
    // Update page title
    document.title = title;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    // Update Open Graph title
    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) {
      ogTitleTag.setAttribute('content', ogTitle || title);
    }

    // Update Open Graph description
    const ogDescriptionTag = document.querySelector('meta[property="og:description"]');
    if (ogDescriptionTag) {
      ogDescriptionTag.setAttribute('content', ogDescription || description);
    }

    // Update Twitter title
    const twitterTitleTag = document.querySelector('meta[property="twitter:title"]');
    if (twitterTitleTag) {
      twitterTitleTag.setAttribute('content', ogTitle || title);
    }

    // Update Twitter description
    const twitterDescriptionTag = document.querySelector('meta[property="twitter:description"]');
    if (twitterDescriptionTag) {
      twitterDescriptionTag.setAttribute('content', ogDescription || description);
    }

    // Add breadcrumb schema if provided
    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": crumb.name,
          ...(crumb.url && { "item": `https://cherrytree.app${crumb.url}` })
        }))
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(breadcrumbSchema);
      script.id = 'breadcrumb-schema';
      document.head.appendChild(script);
    }

    // Cleanup: restore default on unmount
    return () => {
      document.title = 'Cherrytree - Create Cofounder Agreements';
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Cherrytree makes it easy to create cofounder agreements and determine equity splits.');
      }
      // Remove breadcrumb schema
      const existingBreadcrumbScript = document.getElementById('breadcrumb-schema');
      if (existingBreadcrumbScript) {
        document.head.removeChild(existingBreadcrumbScript);
      }
    };
  }, [title, description, ogTitle, ogDescription, breadcrumbs]);
}
