import React, { useEffect } from 'react';
import Header from '../components/Header';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { usePageMeta } from '../hooks/usePageMeta';
import Footer from '../components/Footer';

function AttorneyPage() {
  useScrollAnimation();

  // SEO meta tags
  usePageMeta({
    title: 'Attorney Review - Cherrytree | Professional Legal Support for Cofounders',
    description: 'Get your cofounder agreement reviewed by experienced attorneys. Professional legal support to ensure your startup agreements are fair, enforceable, and protect all parties.',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Attorney' }
    ]
  });

  // Trigger hero content fade-in on mount
  useEffect(() => {
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      setTimeout(() => {
        heroContent.classList.add('section-visible');
      }, 100);
    }
  }, []);

  // Attorney data
  const attorneys = [
    { id: 1, name: 'Attorney Name', title: 'Practice Area', location: 'Location', description: 'Experienced attorney specializing in startup law and corporate formation.' },
    { id: 2, name: 'Attorney Name', title: 'Practice Area', location: 'Location', description: 'Focused on intellectual property and technology transactions.' },
    { id: 3, name: 'Attorney Name', title: 'Practice Area', location: 'Location', description: 'Expert in venture capital financing and founder agreements.' },
    { id: 4, name: 'Attorney Name', title: 'Practice Area', location: 'Location', description: 'Specializing in business formation and contract negotiations.' },
    { id: 5, name: 'Attorney Name', title: 'Practice Area', location: 'Location', description: 'Dedicated to helping early-stage startups navigate legal challenges.' },
    { id: 6, name: 'Attorney Name', title: 'Practice Area', location: 'Location', description: 'Provides counsel on equity structures and founder disputes.' },
    { id: 7, name: 'Attorney Name', title: 'Practice Area', location: 'Location', description: 'Experienced in corporate governance and regulatory compliance.' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-6 md:pb-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="hero-content">
            <h1 className="font-heading text-3xl sm:text-4xl md:text-[56px] font-normal mb-4 md:mb-6">
              Attorney<span style={{ marginLeft: '0.05em' }}>.</span>
            </h1>
            <p className="text-sm md:text-[16px] font-normal" style={{ color: '#716B6B' }}>
              Coming soon... This is only for Pro members.
            </p>
          </div>
        </div>
      </section>

      {/* Attorney Profiles Grid */}
      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {attorneys.map((attorney) => (
              <div key={attorney.id} className="flex flex-col">
                {/* Placeholder Image */}
                <div className="w-full aspect-square bg-gray-200 rounded-lg mb-4"></div>

                {/* Attorney Info */}
                <h3 className="text-[18px] font-normal mb-1">{attorney.name}</h3>
                <p className="text-[14px]" style={{ color: '#716B6B' }}>{attorney.title}</p>
                <p className="text-[14px] mb-2" style={{ color: '#716B6B' }}>{attorney.location}</p>
                <p className="text-[14px]" style={{ color: '#716B6B' }}>{attorney.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default AttorneyPage;
