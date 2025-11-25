import { useEffect } from 'react';

export function useScrollAnimation(options = {}) {
  useEffect(() => {
    const observerOptions = {
      threshold: options.threshold || 0.35,
      rootMargin: options.rootMargin || '0px 0px -200px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const contentObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('content-visible');
          contentObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('.scroll-section, .scroll-section-full');
    sections.forEach(section => observer.observe(section));

    // Observe individual content elements within scroll sections
    const contentElements = document.querySelectorAll('.scroll-section .section-header, .scroll-section p, .scroll-section ul, .scroll-section h3');
    contentElements.forEach(element => contentObserver.observe(element));

    return () => {
      sections.forEach(section => observer.unobserve(section));
      contentElements.forEach(element => contentObserver.unobserve(element));
    };
  }, [options.threshold, options.rootMargin]);
}
