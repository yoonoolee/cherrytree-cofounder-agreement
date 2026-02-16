import React, { useEffect } from 'react';
import Header from '../components/Header';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { usePageMeta } from '../hooks/usePageMeta';
import Footer from '../components/Footer';

function TermsPage() {
  useScrollAnimation();

  // SEO meta tags
  usePageMeta({
    title: 'Terms of Service - Cherrytree | User Agreement & Legal Terms',
    description: 'Cherrytree terms of service and user agreement. Review the legal terms and conditions for using our cofounder agreement platform and services.',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Terms of Service' }
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
              Terms<span style={{ marginLeft: '0.05em' }}>.</span>
            </h1>
            <p className="text-sm md:text-[16px] font-normal" style={{ color: '#716B6B' }}>
              Updated: December 2025
            </p>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            These <strong>Terms of Service</strong> govern your access to, and use of, our Site, and our provision of a variety of services.
          </p>

          <ul className="bullet-list space-y-3 text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <li>We'll refer to these Terms of Service as the “Terms”, and to our website as the “Site”.</li>
            <li>We'll refer to Cherrytree as “Cherrytree” or “we” or “us” or “our”.</li>
            <li>We'll refer to all the services we provide, individually and collectively, and including our Product, as the “Services”.</li>
            <li>We'll refer to you, the person or entity agreeing to these Terms, as “you” or “your”, and (to the extent you license, purchase, or use any Product), a “Customer”.</li>
          </ul>
        </div>
      </section>

      {/* Agreement to Terms */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">1. Agreement to Terms</h2>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            By accessing or using the Site, and/or using a Service (including a Product), you agree to these Terms. If you do not agree with these Terms, you must not use the Site or Services.
          </p>
        </div>
      </section>

      {/* Changes to Terms */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">2. Changes to Terms or Services</h2>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            We may modify the Terms at any time. If we do so, we'll let you know either by posting the modified Terms on the Site, or through other communications. If you continue to use the Site and the Services after we've let you know that the Terms have been modified, you are indicating to us that you agree to be bound by the modified Terms, and to license our Products as further detailed below.
          </p>
        </div>
      </section>

      {/* Nature of Services */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">3. Nature of Services</h2>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>A. Not Legal Advice</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            The content, information, tools, and services provided by Cherrytree (the "Services") are for general informational and educational purposes only and do not constitute legal advice. We are not lawyers or a law firm and we do not provide legal or tax advice. None of our representatives are lawyers and they also do not provide legal or tax advice. Use of the Services does not create an attorney-client relationship between you and Cherrytree, its affiliates, or any of its personnel. As the law differs in each legal jurisdiction and may be interpreted or applied differently depending on your location or situation, the information on the Site is not a substitute for the advice of a lawyer. For any legal matters, you must consult a licensed attorney.
          </p>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            The Services offer you ways to access legal information and handle legal matters yourself with do-it-yourself forms. These self-help services are your own responsibility as is determining whether you require assistance from an attorney to review the materials. The accuracy, completeness, adequacy, or currency are not warranted or guaranteed.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>B. Not Intended For</h3>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            The Services are not designed, and should not be relied upon, for the purpose of forming, incorporating, structuring, or otherwise establishing a legal entity, preparing or filing regulatory submissions, or executing any legally binding agreement. Users are solely responsible for obtaining independent legal counsel prior to taking any action that may have legal or regulatory consequences.
          </p>
        </div>
      </section>

      {/* Your Right to Use the Site */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">4. Your Right to Use the Site; Your Restrictions</h2>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>A. Things you can do</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Subject to your compliance with these Terms, Cherrytree grants you a personal, limited, non-exclusive, non-transferable, non-sublicenseable license to electronically access and use the Site solely as provided for in these Terms.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>B. Things you can't do</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            You will not (and you will not allow any other person to) do any of the following:
          </p>

          <ul className="bullet-list space-y-3 text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <li>circumvent or manipulate the Cherrytree fee structure, billing process, or other fees owed to Cherrytree;</li>
            <li>access or attempt to access any Cherrytree systems, programs, data or accounts that are not made available for public or your use;</li>
            <li>except as allowed with respect to backups of your data, copy, reproduce, republish, upload, post, transmit, resell or distribute in any way any material from the Site;</li>
            <li>work around any technical limitations in the Site, use any tool to enable features or functionalities that are otherwise disabled in the Site, or decompile, disassemble, or otherwise reverse engineer the Site except as otherwise permitted by applicable law;</li>
            <li>perform or attempt to perform any actions that would interfere with the proper working of the Site, prevent access to or the use of the Site by Cherrytree's other licensees or customers, or impose an unreasonable or disproportionately large load on Cherrytree's infrastructure;</li>
            <li>frame or utilize framing techniques to enclose any trademark, logo, or other proprietary information (including images, text, page layout, or form) of Cherrytree or the Site or use any Cherrytree trademark or service marks, unless authorized to do so in writing by Cherrytree;</li>
            <li>attempt to access or search the Site or download content from the Site through the use of any engine, software, tool, agent, device or mechanism (including spiders, robots, crawlers, data mining tools or the like) other than the software and/or search agents provided by Cherrytree or other generally available third-party web browsers;</li>
            <li>impersonate or misrepresent your affiliation with any person or entity; or</li>
            <li>otherwise use the Site except as expressly allowed under the Terms.</li>
          </ul>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            The license granted in these Terms does not include any right of resale of any Cherrytree Product or Service; or any collection and use of any service listings, descriptions, or prices; any derivative use of any Cherrytree Service or its contents. No Cherrytree Service may be reproduced, duplicated, copied, sold, resold, visited, or otherwise exploited for any commercial purpose without express written consent of Cherrytree. The licenses granted by Cherrytree terminate if you do not comply with these Terms of Use.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>C. Our Rights to Monitor and Enforce</h3>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            We reserve the right, but not the obligation, to: (1) monitor the Site for violations of these Terms; (2) take appropriate legal action against anyone who, in our sole descretion, violates these Terms; (3) in our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable any of your contributions; (4) otherwise manage the Site in a manner designed to protect our rights and property.
          </p>
        </div>
      </section>

      {/* Intellectual Property Rights */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">5. Intellectual Property Rights</h2>
          
          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>A. Cherrytree's Ownership of IP</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            The content, organization, graphics, design, compilation, know-how, concepts, methodologies, procedures, digital conversion and other matters related to the Site are protected under applicable copyrights, trademarks and other proprietary rights. Cherrytree, the Cherrytree logo, and other Cherrytree trademarks, service marks, graphics, and logos used in connection with the Service are trademarks or registered trademarks of Cherrytree. Other trademarks, service marks, graphics, and logos used in connection with the Service may be the trademarks of their respective owners. Cherrytree and its licensors exclusively own all rights, title and interest in and to any software programs, tools, utilities, processes, inventions, devices, methodologies, specifications, documentation, techniques and materials of any kind used or developed by Cherrytree or its personnel in connection with the Products and performing the Services (collectively "Cherrytree Materials"), including all worldwide patent rights, copyright rights, trade secret rights, know-how and any other intellectual property rights ("Intellectual Property Rights") therein. You will have no rights in any trademarks, the Cherrytree Materials or the Site except as expressly set forth in these Terms.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>B. Your Ownership of IP</h3>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            For purposes of these Terms, “Customer Data” means all non- public data provided by you to the us to enable provision of the Services. You own all right, title and interest in and to your Customer Data.
          </p>

        </div>
      </section>

      {/* Use of the Services */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">6. Use of the Services; Providing Us Information</h2>
          
          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>A. You'll Start by Creating an Account; Information You Must Provide</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            You will need to register with Cherrytree to become a Customer. You agree to provide accurate, complete registration information, and will keep that information current. You agree that Cherrytree may store and use your registration information to maintain your account.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>B. Information You Must NOT Provide; DISCLAIMERS</h3>
          <ul className="bullet-list space-y-3 text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <li>Confidential Information of Third Parties. Despite anything to the contrary in these Terms, under no circumstances will you upload to the Site or otherwise provide to Cherrytree any data or information (including but not limited to third-party product or pricing information) which you are restricted from disclosing pursuant to any confidentiality (or similar) agreement with any third party. CHERRYTREE EXPRESSLY DISCLAIMS ALL LIABILITY WITH RESPECT TO ANY SUCH THIRD PARTY CONFIDENTIAL INFORMATION.</li>
            <li>Personal Data. Despite anything to the contrary in these Terms, you shall not upload or provide to Cherrytree any sensitive data including, without limitation: (1) protected health information regulated under HIPAA or HITECH; (2) cardholder data as defined under PCI DSS; or (3) nonpublic personal information ("NPI") as defined under the Gramm-Leach-Bliley Act (GLBA), which generally includes financial information provided by consumers to financial institutions. For clarity, general contact information such as email addresses, names, and phone numbers, when not combined with sensitive financial or health information, are not considered NPI under this policy. Cherrytree expressly disclaims all liability with respect to any prohibited data.</li>
          </ul>

        </div>
      </section>

      {/* How We'll Use Your Information */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">7. How We'll Use Your Information; Our Privacy Policy</h2>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Your Privacy is important to Cherrytree. With this in mind, we will protect your personal information in accordance with our Privacy Policy. We do not use data from our customers for any purpose other than to provide the Services to our customers. We do not train any models on customer data.
          </p>
        </div>
      </section>

      {/* Data Security */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">8. Data Security; Disclaimer</h2>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>A. The Security of Your Information is Important to Cherrytree</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Cherrytree takes reasonable administrative, physical, and electronic measures designed to protect from unauthorized access, use or disclosure of the information that we collect from you.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>B. You Have Security Responsibilities</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            You agree to: (1) keep your password and online ID secure and strictly confidential, providing it only to Authorized Users of your account; (2) instruct each person to whom you give your online ID and password that he or she is not to disclose it to any unauthorized person; (3) notify us immediately and select a new online ID and password if you believe your password may have become known to an unauthorized person; and (4) notify us immediately if you are contacted by anyone requesting your online ID and password. When you give someone your online ID and online password, you are authorizing that person to access and use your account, and you are responsible for any and all transactions that person performs while using your account, even those transactions that are fraudulent or that you did not intend or want performed. You agree to indemnify and hold harmless Cherrytree from and against any and all liability arising in any way from the access to the Site by persons to whom you have provided your online ID and/or online password. In addition, you are responsible for your information technology infrastructure, including computers, servers, software, databases, electronic systems (including database management systems) and networks, whether operated directly by you or through the use of third-party services. You agree to abide by all applicable local, state, national, and international laws and regulations in connection with using the Services, including, without limitation, all laws regarding the transmission of technical data exported from the United States through the Service and all privacy and data protection laws, rules and regulations.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>C. Some Third Parties May have Incidental Access to Your Information</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Cherrytree works with other companies to provide information technology services to users of the Site. These companies may have access to Cherrytree's databases, but only for the purposes of providing service to Cherrytree. For example, a third party (such as AWS) may obtain access to Your Information in an effort to update database software. These companies will operate under consumer confidentiality agreements with Cherrytree.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>D. The Internet is Not Guaranteed to be Safe.</h3>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Please be aware that no method of transmitting information over the Internet or storing information is completely secure. Accordingly, we cannot guarantee the absolute security of any information. CHERRYTREE SHALL HAVE NO LIABILITY TO YOU FOR ANY UNAUTHORIZED ACCESS, USE, CORRUPTION OR LOSS OF ANY OF YOUR INFORMATION, EXCEPT TO THE EXTENT THAT SUCH UNAUTHORIZED ACCESS, USE, CORRUPTION, OR LOSS IS DUE SOLELY TO CHERRYTREE'S GROSS NEGLIGENCE OR MISCONDUCT.
          </p>

        </div>
      </section>

      {/* Ordering Products and Services */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">9. Purchasing Products and Services from Cherrytree</h2>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>A. Definitions</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            For the purposes of these Terms:
          </p>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <strong>Product</strong> means the online tool or digital content made available to you by Cherrytree as part of a one-time purchase, including any associated Documentation or updates provided at no additional cost.
          </p>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <strong>Documentation</strong> means any instruction manuals, user guides, or other information provided by Cherrytree in connection with the Product.
          </p>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <strong>Order</strong> means the one-time purchase of a Product that you select and successfully pay for through the Site. Your Order constitutes your license to access and use the Product under these Terms.
          </p>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <strong>Delivery</strong> occurs when access to the Product is provided to you electronically via the Site or email.
          </p>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <strong>Authorized Users</strong> means any individuals you designate to access the Product under your license, if applicable. Each Authorized User must use a unique account to access the Product unless otherwise allowed.
          </p>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <strong>Update</strong> means enhancements, modifications, or additions to the Product or Documentation as may be made available from time to time by us to you.
          </p>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <strong>Use</strong> shall mean the legal use by Customer of the Product and Documentation and/or Services in accordance with the terms and condition of these Terms and in a manner consistent with the Specifications, subject to any applicable Usage Limitation.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>B. How to Order Products</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            You can select Products for purchase by browsing our Product offerings on our pricing page, selecting the Product(s) you want to license, and successfully completing the payments process. 1. An Order submitted by you to Cherrytree corresponding to Products for which you've successfully completed the payments process constitutes the agreement for Cherrytree to provide the Products and for you to receive and pay for such Products. 2. Cherrytree shall have no responsibility to provide any Product with respect to Orders submitted where you have not successfully completed the online payments process.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>C. Your Order Cannot Contain Additional Terms or Conditions</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            These Terms set out the complete and exclusive statement of the contract between you and Cherrytree with respect to your purchase of Products. Any additional or conflicting provisions contained in an Order from you are expressly rejected.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>D. International Access</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            If you access and use this Site outside the United States you are responsible for complying with your local laws and regulations.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>E. Products are Delivered Electronically</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            All Products, Updates and Documentation licensed by you pursuant to these Terms will be delivered electronically (such as by electronic mail, file transfer or other means of electronic transmission, or by giving you access to such Products, Updates and Documentation).
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>F. Usage Limitations</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Your access to the Product may be subject to Usage Limitations. Usage Limitations may include, among other things, the specific features of the Product you are licensed to use, the maximum number of Authorized Users, the amount of allotted storage, or other restrictions set forth in our Product offerings on the pricing page. If your use exceeds any Usage Limitation, you may be required to obtain an additional license or pay additional fees as determined by Cherrytree, and you agree to pay any such fees.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>G. Intellectual Property Rights</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Ownership of Intellectual Property shall be as set for in Section 5.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>H. Restrictions on Our License Grant to You For the Product</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            You agree that you (and your Authorized Users) will not without our express written permission: (1) reverse compile, disassemble, decompile or engineer, copy, modify or adapt the whole or any part of the Product; (2) make the Product or Documentation or Services available to, or use the Product, Documentation or Services for the benefit of, anyone other than you or your customers; (3) assign, transfer, sell, resell, license, sublicense, distribute, rent or lease the Product, Documentation or Services, or include any Product, Documentation or Services in a service bureau or outsourcing offering; (4) permit direct or indirect access to or use of the Product, Documentation or Services in a way that circumvents a contractual usage limit; (5) copy the Product, Documentation or Services or any part, feature, function or user interface thereof (except as expressly otherwise permitted under these Terms). Despite any of the foregoing, nothing in this paragraph or the Agreement is intended to change or restrict the terms of any free or open source software license. In the case of any conflict between this Agreement and terms and conditions of any free or open source software license, the terms and conditions of such license shall control.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>I. Your License Grant to Us</h3>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Despite anything to the contrary, we shall have the right collect and analyze data and other information relating to the provision, use and performance of various aspects of the Product and Services and related systems and technologies (including, without limitation, information concerning Customer Data and data derived therefrom), and we will be free (during and after the term hereof) to (1) use such information and data to improve and enhance the Product and Services and for other development, diagnostic and corrective purposes in connection with the Product and Services and other of our offerings, and (2) disclose such data solely in aggregate or other de-identified form in connection with our business.
          </p>

        </div>
      </section>

      {/* Termination of Product Subscriptions */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">10. Termination of Product Access</h2>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>A. Termination by You or by Us</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Either party may terminate your access to the Product under these Terms immediately if the other party commits a material breach of any term of these Terms and, in the case of a breach that can be remedied, such breach is not remedied within thirty (30) days of written notice requesting remedy.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>B. Termination by Us</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Cherrytree may terminate your access to the Product if we reasonably determine that your use:
          </p>

          <ul className="bullet-list space-y-3 text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <li>Violates any applicable law or regulation; or</li>
            <li>Poses a threat to the security, reliability, or operation of the Product, our systems, or the data of other users.</li>
          </ul>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>C. Effect of Termination</h3>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Termination of your access under this Section does not affect any other rights or remedies available to either party under these Terms or at law. Upon termination, you must immediately cease using the Product and destroy or uninstall any copies of the Product and Documentation in your possession or control. At our request, you will certify in writing that you have complied with this obligation.
          </p>

        </div>
      </section>

      {/* Payment Terms */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">11. Payment Terms</h2>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>A. Invoicing and Payment</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Cherrytree's right to payment for any Product or Service purchased by you shall accrue on the date the Product or Service is delivered to you. All stated prices are exclusive of any taxes, fees, and duties or other amounts, however designated, and including without limitation value added and withholding taxes that are levied or based upon such charges, or upon these Terms. Any taxes related to the Product, Documentation or Services purchased or licensed pursuant to these Terms including, but not limited to, withholding taxes, will be paid by you, or you will present an exemption certificate acceptable to the taxing authorities.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>B. Refund Policy</h3>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            If you contact us, we can help you resolve any issues you may have, provide a refund, or offer credit for future services. When you contact us, explain all the details relating to the Service you are not satisfied with. If a refund request is not made within 30 days of purchase, we cannot provide a refund. Except as expressly provided in these Terms or where prohibited by law, the maximum liability of Cherrytree is the amount paid to Cherrytree by the customer.
          </p>

        </div>
      </section>

      {/* Limited Warranty */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">12. Limited Warranty</h2>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>A. Our Warranty to You</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Subject to each of the other provisions of these Terms, we warrant, solely to you as a Customer, that for a period of thirty (30) days after the Product is initially Delivered to you (the "Warranty Period"), the Product, (and, in the case of an On-Premise Subscription, when installed properly) will be capable of functioning substantially in accordance with the Specifications. That warranty will not apply, however, if (1) you fail to notify us during the Warranty Period of any warranty claim; or (2) if you fail to implement all Updates to the Product made available at no charge to you during the Warranty Period.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>B. How We'll Fix a Warranty Breach</h3>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            If we breach the warranty set forth in this Section, your sole and exclusive remedy, and our sole obligation, shall be to remedy such breach as set forth in this Section. At our sole discretion, we will, at our expense, either: (1) repair or replace the defective Product to enable it to perform substantially in accordance with the Specifications; or (2) terminate these Terms and refund to you the fees paid by you to us for the defective Product.
          </p>

          <h3 className="text-[20px] font-semibold mb-3" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif' }}>C. WARRANTY DISCLAIMER</h3>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            EXCEPT AS SET FORTH IN THIS SECTION, WE MAKE NO WARRANTIES OR REPRESENTATIONS WITH RESPECT TO ANY PRODUCTS, SERVICES, DOCUMENTATION OR OTHER TANGIBLE OR INTANGIBLE MATERIALS PROVIDED BY US, AND WE HEREBY DISCLAIM ALL OTHER WARRANTIES OR GUARANTEES WITH RESPECT TO THE PRODUCT AND SERVICES, WHETHER STATUTORY, WRITTEN, ORAL, EXPRESS OR IMPLIED INCLUDING, WITHOUT LIMITATION, ANY WARRANTY OF MERCHANTABILITY, NON-INFRINGEMENT, SUITABILITY, FITNESS FOR A PARTICULAR PURPOSE AND ANY WARRANTIES ARISING OUT OF COURSE OF DEALING OR USAGE OF TRADE. WE DO NOT WARRANT THAT THE PRODUCT, SERVICES OR DOCUMENTATION PROVIDED UNDER THIS AGREEMENT WILL OPERATE WITHOUT INTERRUPTION OR BE ERROR FREE OR THAT OUR SERVICES OR PRODUCT OR DOCUMENTATION WILL SUCCEED IN RESOLVING ANY PROBLEM.
          </p>

        </div>
      </section>

      {/* Links to Third Party Websites */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">13. Links to Third Party Websites or Resources</h2>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            The Site may contain links to third-party websites or resources. We provide these links only as a convenience and are not responsible for the content, products or services on or available from those websites or resources or links displayed on such sites. You acknowledge sole responsibility for, and assume all risk arising from, your use of any third-party websites or resources.
          </p>
        </div>
      </section>

      {/* Important Disclaimers */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">14. Important Disclaimers</h2>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            EXCEPT AS MAY BE OTHERWISE EXPRESSLY SET FORTH IN THESE TERMS, THE SITE AND THE SERVICE ARE PROVIDED "AS IS," WITHOUT WARRANTY OF ANY KIND. IN ADDITION TO THE DISCLAIMERS IN SECTION 13 ABOVE, CHERRYTREE DOES NOT REPRESENT OR WARRANT THAT SERVICES, PRODUCTS OR DOCUMENTATION ARE ACCURATE, COMPLETE, RELIABLE, CURRENT OR ERROR-FREE OR THAT THE SITE OR SERVICE ITS SERVERS, OR ANY APPLICATIONS ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
          </p>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            YOU ACKNOWLEDGE THAT THE NATURE OF INTERNET-BASED SERVICE DELIVERY IS SUCH THAT CONFIDENTIALITY AND PERFORMANCE CANNOT BE COMPLETELY ASSURED. WE SHALL HAVE NO LIABILITY TO YOU FOR ANY UNAUTHORIZED ACCESS, USE, CORRUPTION OR LOSS OF ANY OF CUSTOMER DATA, EXCEPT TO THE EXTENT THAT SUCH UNAUTHORIZED ACCESS, USE, CORRUPTION, OR LOSS IS DUE SOLELY TO OUR GROSS NEGLECT OR MISCONDUCT. Despite any other provision of the Agreement, in the case of loss or PHI or other personally identifiable information due to our actions or inactions, your sole remedy shall be for is to restore such PHI and /or other personally identifiable information from the latest available backup.
          </p>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            To the fullest extent permitted by law, Cherrytree shall not be liable for any indirect, incidental, consequential, special, or punitive damages, including loss of profits, data, goodwill, or business opportunities, even if advised of the possibility of such damages.
          </p>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            The Site and the Service may be temporarily unavailable from time to time for maintenance or other reasons. Cherrytree assumes no responsibility for any error, omission, interruption, deletion, defect, delay in operation or transmission, communications line failure, data loss, theft or destruction or unauthorized access to, or alteration of, any communications.
          </p>
        </div>
      </section>

      {/* Indemnity */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">15. Indemnity</h2>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            You agree to defend, indemnify and hold harmless Cherrytree, its affiliates, officers, directors, employees and agents from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees) arising from: (1) your use of and access to the Cherrytree Site or Service; (2) your violation of any term of these Terms of Use; (3) your violation of any third- party right, including without limitation any copyright, property, or privacy right; or (4) any claim that any of Your Information caused damage to a third party. This defense and indemnification obligation will survive these Terms and your use of the Cherrytree Site. You hereby agree to waive the application of any law that may limit the efficacy of the foregoing agreement to defend and indemnify Cherrytree and its affiliates, officers, directors, employees and agents.
          </p>
        </div>
      </section>

      {/* Limitation of Liability */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">16. Limitation of Liability</h2>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Cherrytree shall have no liability for any loss, damage, or injury resulting from your or any third parties' negligence, lack of training, use or misuse, or misapplication of any Product or Service.
          </p>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            You agree to indemnify, defend, and hold harmless Cherrytree and its employees from any claims, damages and actions of any kind or nature arising from or caused by the use or misuse of any Service.
          </p>
          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            IN NO EVENT WILL CHERRYTREE BE LIABLE TO YOU OR TO ANY THIRD PARTY FOR ANY INDIRECT, SPECIAL, INCIDENTAL, PUNITIVE, EXEMPLARY OR CONSEQUENTIAL DAMAGES (INCLUDING LOSS OF USE, DATA, BUSINESS OR PROFITS) OR FOR COSTS OF PROCURING SUBSTITUTE SERVICES, ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT, THE SERVICES, THE SITE, OR ANY RESEARCH OR EXPERIMENT OR OTHER WORK PERFORMED USING ANY PRODUCTS OR SERVICES PURCHASED THROUGH THE SITE, HOWEVER CAUSED AND REGARDLESS OF THE THEORY OF LIABILITY, EVEN IF CHERRYTREE HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. CHERRYTREE'S TOTAL LIABILITY TO YOU, FROM ALL CAUSES OF ACTION AND ALL THEORIES OF LIABILITY, WILL BE LIMITED TO AND WILL NOT EXCEED THE AMOUNTS PAID TO CHERRYTREE BY YOU UNDER THESE TERMS IN THE SIX (6) MONTH PERIOD IMMEDIATELY PRECEDING ANY CLAIM MADE UNDER THIS AGREEMENT.
          </p>
        </div>
      </section>

      {/* General Terms */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">17. General Terms</h2>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            These Terms constitute the entire and exclusive understanding and agreement between Cherrytree and you regarding the Services, and supersede and replace any and all prior oral or written understandings or agreements between Cherrytree and you regarding the Site and the Services. If for any reason a court of competent jurisdiction finds any provision of these Terms invalid or unenforceable, that provision will be enforced to the maximum extent permissible and the other provisions of these Terms will remain in full force and effect.
          </p>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            You may not assign or transfer these Terms, by operation of law or otherwise, without Cherrytree's prior written consent. Any attempt by you to assign or transfer these Terms, without such consent, will be null and of no effect. Cherrytree may freely assign or transfer these Terms without restriction. Subject to the foregoing, these Terms will bind and inure to the benefit of the parties, their successors and permitted assigns.
          </p>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            All notices must be in writing and in the English language and will be deemed given only when sent by mail (return receipt requested), hand-delivered, sent by documented overnight delivery service to the party to whom the notice is directed, at its address indicated in the signature box to these Terms (or such other address as to which the other party has been notified), or sent by email if receipt is electronically confirmed.
          </p>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Cherrytree's failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. The waiver of any such right or provision will be effective only if in writing and signed by a duly authorized representative of Cherrytree. Except as expressly set forth in these Terms, the exercise by either party of any of its remedies under these Terms will be without prejudice to its other remedies under these Terms or otherwise.
          </p>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Neither party will be liable hereunder by reason of any failure or delay in the performance of its obligations hereunder on account of events beyond the reasonable control of such party, which may include without limitation denial-of-service attacks, strikes, shortages, riots, insurrection, fires, flood, storm, explosions, acts of God, war, terrorism, governmental action, labor conditions, earthquakes and material.
          </p>

          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            These Terms and all matters arising out of, or relating to, these Terms will be governed by the laws of the State of Delaware, without regard to its conflict of laws provisions. Any legal action or proceeding arising out of or related to this Agreement shall be brought in the courts of the State of Delaware.
          </p>

        </div>
      </section>

      {/* Data Collection and Consent */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">18. Data Collection and Consent</h2>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            In our commitment to provide Cherrytree, we collect and use certain personal information about our users. This section explains what data we collect, how we use it, and the consent mechanisms in place. Our data collection practices are designed exclusively to enhance your experience with our service.
          </p>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Types of Data Collected We may collect the following types of data:
          </p>
          <ul className="bullet-list space-y-3 text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <li>Personal Information: This includes your name, email address, contact details, and any other information you provide when using our service.</li>
            <li>Usage Data: Information on how you interact with our service, including preferences, settings, and engagement with various features.</li>
          </ul>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Purpose of Data Collection Each type of data we collect serves a specific purpose:
          </p>
          <ul className="bullet-list space-y-3 text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <li>Personal Information is used to create and manage your account, provide customer support, and communicate important service updates.</li>
            <li>Usage Data helps us understand how our service is used and guides us in improving functionality and user experience.</li>
          </ul>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Consent Mechanism Consent for data collection is obtained through:
          </p>
          <ul className="bullet-list space-y-3 text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <li>Explicit acceptance of these Terms of Service: specific consent is required during account creation.</li>
            <li>We ensure that your consent is freely given, specific, informed, and unambiguous as per data protection regulations.</li>
          </ul>

          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Withdrawal of Consent:
          </p>
          <ul className="bullet-list space-y-3 text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            <li>You may withdraw your consent for data collection and processing at any time by contacting us directly through {' '}
              <a href="mailto:hello@cherrytree.app" className="underline hover:text-black transition">
                hello@cherrytree.app
              </a>.
            </li>
            <li>Please note that withdrawing consent may affect the availability and functionality of certain service features.</li>
          </ul>


        </div>
      </section>

      {/* Contact Information */}
      <section className="scroll-section py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-header font-heading-transform-origin-left text-[32px] font-normal mb-4">19. Contact Information</h2>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            If you have any questions about these Terms or the Services please contact us at {' '} 
            <a href="mailto:hello@cherrytree.app" className="underline hover:text-black transition">
                hello@cherrytree.app
            </a>.
          </p>

          <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Cherrytree<br />
            Terms of Service<br />
            Last Updated: December 2025
          </p>
        </div>
      </section>

      <div className="pb-16 md:pb-24"></div>

      <Footer bgColor="#06271D" />
    </div>
  );
}

export default TermsPage;
