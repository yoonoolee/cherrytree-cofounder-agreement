import React from 'react';
import { useNavigate } from 'react-router-dom';

function AboutPage() {
  const navigate = useNavigate();

  const logos = ['Hubble', 'a16z', 'Berkeley', 'Stanford', 'Sequoia'];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <svg width="32" height="32" viewBox="22 22 56 56" xmlns="http://www.w3.org/2000/svg">
                <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="black"/>
              </svg>
              <span className="text-xl font-semibold">Cherrytree</span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-medium mb-12" style={{ fontFamily: 'Inter, sans-serif' }}>
            Big ideas grow with the right company.
          </h1>
        </div>
      </section>

      {/* Mission */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-3xl font-medium mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Our mission:
          </p>
          <p className="text-4xl font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
            to create cofounder magic
          </p>
        </div>
      </section>

      {/* Founder Story */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-medium mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            Our Story
          </h2>
          <div className="space-y-4 text-gray-700 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <p>
              Tim, the founder, started Cherrytree after experiencing the challenges of building with cofounders firsthand.
            </p>
            <p>
              He's taught over 1,000 entrepreneurship students, authored a book on cofounder dynamics, and assembled a team of coaches, attorneys, and AI experts to help founders navigate one of the most critical decisions they'll make.
            </p>
            <p>
              The company has worked with hundreds of teams across various industries, from tech startups to traditional businesses, helping them establish fair and sustainable partnerships from day one.
            </p>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600 mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
            Trusted by teams from
          </p>
          <div className="flex flex-wrap justify-center gap-12">
            {logos.map((logo, i) => (
              <div key={i} className="text-gray-400 font-medium text-lg">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hiring */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-medium mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            Join Our Team
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <h3 className="text-xl font-semibold mb-2">Student Internship (Part-time)</h3>
            <p className="text-gray-600 mb-4" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
              Cherrytree seeks an intern excited about startups. The role involves hands-on work across business operations including research, growth strategies, project coordination, and fundraising.
            </p>
            <p className="text-gray-600 mb-6" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
              Remote position with preference for San Francisco or Berkeley candidates.
            </p>
            <button className="bg-[#000000] text-white px-6 py-3 rounded-lg hover:bg-[#1a1a1a] transition">
              Apply Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg width="24" height="24" viewBox="22 22 56 56" xmlns="http://www.w3.org/2000/svg">
                <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="white"/>
              </svg>
              <span className="text-white font-semibold">Cherrytree</span>
            </div>
            <p className="text-sm">Cofounder coaching for early-stage teams</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/dashboard')} className="hover:text-white transition">Contract Creator</button></li>
              <li><button onClick={() => navigate('/equity-calculator-1')} className="hover:text-white transition">Equity Calculator</button></li>
              <li><button onClick={() => navigate('/pricing')} className="hover:text-white transition">Pricing</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://cherrytree.beehiiv.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Newsletter</a></li>
              <li><a href="#" className="hover:text-white transition">Coaching</a></li>
              <li><a href="#" className="hover:text-white transition">Attorney Services</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/about')} className="hover:text-white transition">About</button></li>
              <li><a href="#" className="hover:text-white transition">Contact</a></li>
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-800 text-sm text-center">
          © {new Date().getFullYear()} Cherrytree. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default AboutPage;
