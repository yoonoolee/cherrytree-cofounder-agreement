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

    // Section headers re-animate every time they scroll into view
    const headerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('content-visible');
        } else {
          entry.target.classList.remove('content-visible');
        }
      });
    }, { threshold: 0.1 });

    const sections = document.querySelectorAll('.scroll-section, .scroll-section-full');
    sections.forEach(section => observer.observe(section));

    // Observe section headers separately so they re-animate
    const headerElements = document.querySelectorAll('.scroll-section .section-header');
    headerElements.forEach(element => headerObserver.observe(element));

    // Observe other content elements (one-time)
    const contentElements = document.querySelectorAll('.scroll-section p, .scroll-section ul, .scroll-section h3');
    contentElements.forEach(element => contentObserver.observe(element));

    return () => {
      sections.forEach(section => observer.unobserve(section));
      headerElements.forEach(element => headerObserver.unobserve(element));
      contentElements.forEach(element => contentObserver.unobserve(element));
    };
  }, [options.threshold, options.rootMargin]);
}
