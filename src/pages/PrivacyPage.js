import React, { useEffect } from 'react';
import Header from '../components/Header';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { usePageMeta } from '../hooks/usePageMeta';
import Footer from '../components/Footer';

function PrivacyPage() {
  useScrollAnimation();

  // SEO meta tags
  usePageMeta({
    title: 'Privacy Policy - Cherrytree | Your Data Protection & Privacy',
    description: 'Cherrytree privacy policy. Learn how we collect, use, and protect your data when creating cofounder agreements. Your privacy and security are our priority.',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Privacy Policy' }
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-16 md:pb-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="hero-content">
            <h1 className="font-heading text-3xl sm:text-4xl md:text-[56px] font-normal mb-4 md:mb-6">
              Privacy<span style={{ marginLeft: '0.05em' }}>.</span>
            </h1>
            <p className="text-sm md:text-[16px] font-normal" style={{ color: '#716B6B' }}>
              Updated: November 2025
            </p>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[16px] leading-relaxed mb-6" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <strong>Your privacy is important to us.</strong> This Privacy Policy explains our practices regarding the collection, use and disclosure of information that we receive through our Services. This Privacy Policy does not apply to any third-party websites, services or applications, even if they are accessible through our Services.
          </p>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            In this Privacy Policy:
          </p>

          <ul className="bullet-list space-y-3 text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <li>We'll refer to our website as the "Site".</li>
            <li>We'll refer to all the products and services we provide, individually and collectively, as the "Services".</li>
            <li>We'll refer to you, the person or entity accessing our Site or using our Services, as "you" or "your" or (if you are a purchaser of our Services), our "customer".</li>
          </ul>
        </div>
      </section>

      {/* Definitions Section */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">Definitions</h2>

          <p className="text-[16px] leading-relaxed mb-6" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <strong>Data Controller:</strong> For general data protection regulation purposes, the "Data Controller" means the organization who decides the purposes for which, and the way in which, any Personal Information is processed. Our customers are the Data Controllers.
          </p>

          <p className="text-[16px] leading-relaxed mb-6" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <strong>Data Processor:</strong> A "Data Processor" is an organization which processes Personal Information for a Data Controller. We are the Data Processor for our customers. As a Data Processor, we are bound by the requirements of the General Data Protection Regulation (the "GDPR").
          </p>

          <p className="text-[16px] leading-relaxed mb-6" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <strong>Data Processing:</strong> Data processing is any operation or set of operations (whether automated or not) performed upon Personal Information. Examples of data processing explicitly listed in the text of the GDPR are: collection, recording, organizing, structuring, storing, adapting, altering, retrieving, consulting, using, disclosing by transmission, disseminating or making available, aligning or combining, restricting, erasure or destruction.
          </p>

          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <strong>Personal Information:</strong> Personal information is any information which is about you, from which you can be identified. Personal Information includes information such as an individual's name, address, telephone number, or e-mail address. Personal Information also includes information about an individual's activities, such as information about his or her activity on the Site or our services, and demographic information, such as date of birth, gender, geographic area, and preferences, when any of this information is linked to personal information that identifies that individual. Personal Information does not include aggregate or other non-personally identifiable information. Aggregate information is information that we collect about a group or category of products, services, or users that is not personally identifiable or from which individual identities are removed.
          </p>
        </div>
      </section>

      {/* How We Collect Section */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">How We Collect Personal Info</h2>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            We collect Personal Information in the following ways, including when acting as a Data Processor on behalf of our customers:
          </p>

          <ul className="bullet-list space-y-3 text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <li>Information you provide to us directly.</li>
            <li>Information we receive from our customers acting as Data Controllers.</li>
            <li>Information we may receive from third parties.</li>
          </ul>

          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            We may receive Personal Information about you from third parties and may combine it with other Personal Information we maintain. If we do so, this Privacy Policy governs the combined Personal Information in its personally identifiable form.
          </p>
        </div>
      </section>

      {/* What Info We Collect Section */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">What Info We Collect</h2>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            We may collect the following types of personal information from you:
          </p>

          <ul className="bullet-list space-y-3 text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <li>Your first and last name, username and email address.</li>
            <li>Your company's name.</li>
            <li>Your (and/or your company's) physical address.</li>
            <li>We may collect information you post to, or collect from, users of the Services. We use this information to operate, maintain, and provide to you the features and functionality of the Services.</li>
            <li>We may also collect and aggregate information about the use of our Site and our Services. That information includes browser and device data, such as IP address, device type, screen resolution, browser type, operating system name and version, language, as well as add-ons for your browser. The information may also include usage data, including the pages visited on and links clicked on our Site, the time spent on those pages, and the pages that led or referred you to our Site.</li>
          </ul>
        </div>
      </section>

      {/* How We Use That Info Section */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">How We Use That Info</h2>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            We will use your Personal Information, in compliance with this Privacy Policy, to help us deliver the Services to you. Any of the information we collect from you may be used in the following ways:
          </p>

          <ul className="bullet-list space-y-3 text-[16px] leading-relaxed mb-6" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <li>To operate, maintain, and provide to you the features and functionality of the Services.</li>
            <li>To compile statistics and analysis about use of our Site and our Services.</li>
            <li>To personalize your experience.</li>
            <li>To improve our Site and our Services — we continually strive to improve our site offerings based on the information and feedback we receive from you.</li>
            <li>To improve customer service — your Personal Information helps us to more effectively respond to your customer service requests and support needs.</li>
            <li>To send periodic emails — The email address you provide may be used to send you information, notifications that you request about changes to our Services, to alert you of updates, and to send periodic emails containing information relevant to your account.</li>
            <li>If you purchase our Services, then to enable you to purchase, renew and appropriately use a commercial license to our Services.</li>
            <li>We may also use Personal Information you provide to send you email marketing about Cherrytree products and services, invite you to participate in events or surveys, or otherwise communicate with you for marketing purposes. We allow you to opt-out from receiving marketing communications from us as described in the "Your Choices" section below.</li>
          </ul>

          <p className="text-[16px] leading-relaxed mb-6" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            We may also use your Personal Information where necessary for us to comply with a legal obligation, including to share information with government and regulatory authorities when required by law or in response to legal process, obligation, or request.
          </p>

          <p className="text-[16px] leading-relaxed mb-6" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            We cooperate with government and law enforcement officials or private parties to enforce and comply with the law. We may disclose your Personal Information to government or law enforcement officials or private parties as we believe necessary or appropriate: (i) to respond to claims, legal process (including subpoenas); (ii) to protect our property, rights and safety and the property, rights and safety of a third party or the public in general; and (iii) to stop any activity that we consider illegal, unethical or legally actionable activity.
          </p>

          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            We will request your consent before we use or disclose your Personal Information for a materially different purpose than those set forth in this Policy.
          </p>
        </div>
      </section>

      {/* Your Choice Section */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">Your Choice About Personal Info</h2>
          <p className="text-[16px] leading-relaxed mb-6" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            We may use the information we collect or receive to communicate directly with you. We may send email marketing communications about Cherrytree. If you do not want to receive such email messages, you will be given the option to opt out. We will try to comply with your request(s) as soon as reasonably practical. Additionally, even after you opt out from receiving marketing messages from us, you will continue to receive administrative messages from us regarding our Services (e.g., account verification, purchase and billing confirmations and reminders, changes/updates to features of the Service, technical and security notices).
          </p>

          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            In addition, you may opt out of allowing third-party online advertising networks to collect information from our Site by adjusting the browser settings on your computer or mobile device. Please refer to your mobile device or browser’s technical information for instructions on how to delete and disable cookies, and other tracking tools.
          </p>
        </div>
      </section>

      {/* Protection Section */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">Protection of Personal Information</h2>
          <p className="text-[16px] leading-relaxed mb-6" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Cherrytree cares about the security of your Personal Information, and we make reasonable efforts to ensure a level of security appropriate to the risk associated with the processing of your Personal Information. We maintain organizational, technical, and administrative procedures designed to protect your Personal Information against unauthorized access, deletion, loss, alteration, and misuse. Unfortunately, no data transmission or storage system can be guaranteed to be 100% secure. If you believe that your interaction with us is not secure, please contact us immediately.
          </p>

          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            You are responsible for maintaining the secrecy of your unique password and account information, and for controlling access to your email communications from Cherrytree. Your privacy settings may also be affected by changes to the functionality of third-party sites and services that you add to the Cherrytree Service, such as single sign on. Cherrytree is not responsible for the functionality or security measures of any third party. Upon becoming aware of a breach of your Personal Information, we will notify you as quickly as we can and will provide timely information relating to the breach as it becomes known in accordance with any applicable laws and regulations or as is reasonably requested by you.
          </p>
        </div>
      </section>

      {/* Internal Access Section */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">Cherrytree Internal Access</h2>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Designated members of our staff may access Personal Information to help our customers with any questions they have, including help using our Services, investigating security issues, or following up on bug fixes with a customer.
          </p>
        </div>
      </section>

      {/* 3rd Party Disclosure Section */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">3rd Party Disclosure</h2>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Except as set out below, we do not sell, trade, or otherwise transfer to outside parties your Personal Information.
          </p>

          <ul className="bullet-list space-y-3 text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <li>We may share your Personal Information with other companies owned by or under common ownership as Cherrytree, which also includes our subsidiaries (i.e., any organization we own or control).</li>
            <li>These companies will use your Personal Information in the same way as we can under this Privacy Policy, unless otherwise specified.</li>
            <li>We may disclose your Personal Information to third-party service providers (for example, payment processing and data storage and processing facilities) that we use to provide the Services.</li>
            <li>We limit the Personal Information provided to these service providers to that which is reasonably necessary for them to perform their functions, and we require them to agree to maintain the confidentiality of such Personal Information.</li>
            <li>We may contract with third-party service providers to assist us in better understanding our Site visitors.</li>
            <li>These service providers are not permitted to use the information collected on our behalf except to help us conduct and improve our business.</li>
            <li>We may also release your Personal Information when we believe release is appropriate to comply with the law, enforce our site policies, or protect our or others' rights, property, or safety.</li>
            <li>In particular, we may release your Personal Information to third parties as required to (i) satisfy any applicable law, regulation, subpoena/court order, legal process or other government request, (ii) enforce our Terms of Service, including the investigation of potential violations thereof, (iii) investigate and defend ourselves against any third party claims or allegations, (iv) protect against harm to the rights, property or safety of Cherrytree, its users or the public as required or permitted by law and (v) detect, prevent or otherwise address criminal (including fraud or stalking), security or technical issues.</li>
            <li>In the event that we enter into, or intend to enter into, a transaction that alters the structure of our business, such as a merger, reorganization, joint venture, assignment, sale, or change of ownership, we may share Personal Information for the purpose of facilitating and completing the transaction.</li>
          </ul>
        </div>
      </section>

      {/* Retention Section */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">Retention of Personal Info</h2>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            We retain your Personal Information for as long as we need to fulfill our Services. In addition, we retain Personal Information after we cease providing Services to you, to the extent necessary to comply with our legal obligations. Where we retain data, we do so in accordance with any limitation periods and records retention obligations that are imposed by applicable law.
          </p>
        </div>
      </section>

      {/* Your Consent Section */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">Your Consent</h2>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            By using our site, you consent to this Privacy Policy.
          </p>
        </div>
      </section>

      {/* Your Rights Section */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">Your Rights</h2>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Other rights you have include the rights to:
          </p>

          <ul className="bullet-list space-y-3 text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <li>Ask for a copy of your Personal Information.</li>
            <li>Ask us to correct your Personal Information that is inaccurate, incomplete, or outdated.</li>
            <li>Ask us to transfer your Personal Information to other organizations.</li>
            <li>Ask us to erase certain categories or types of information.</li>
            <li>If you choose to remove your Personal Information, you acknowledge that we may retain archived copies of your Personal Information in order to satisfy our legal obligations, or where we reasonably believe that we have a legitimate reason to do so.</li>
            <li>Ask us to restrict certain processing.</li>
            <li>You have the right to object to processing of Personal Information. Where we have asked for your consent to process information, you have the right to withdraw this consent at any time.</li>
          </ul>
        </div>
      </section>

      {/* Privacy Changes Section */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">Privacy Changes</h2>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            If we decide to change our privacy policy, we will post those changes on this page. If we are going to use Personal Data collected through the Site in a manner materially different from that stated at the time of collection, then we will notify users via email and/or by posting a notice on our Site for 30 days prior to such use or by other means as required by law.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">Contact Us</h2>
          <p className="text-[16px] leading-relaxed mb-6" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            If you would like to submit a data rights request or if you have any other questions, please email{' '}
            <a href="mailto:hello@cherrytree.app" className="underline hover:text-black transition">
              hello@cherrytree.app
            </a>.
          </p>

          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Cherrytree<br />
            Privacy Policy<br />
            Last Updated: Nov, 2025
          </p>
        </div>
      </section>

      <div className="pb-16 md:pb-24"></div>

      <Footer bgColor="#06271D" />
    </div>
  );
}

export default PrivacyPage;
