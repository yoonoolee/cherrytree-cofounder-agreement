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

    const sections = document.querySelectorAll('.scroll-section');
    sections.forEach(section => observer.observe(section));

    return () => {
      sections.forEach(section => observer.unobserve(section));
    };
  }, [options.threshold, options.rootMargin]);
}
