import { useState, type ChangeEvent, type FormEvent } from 'react';
import { FunctionsError } from 'firebase/functions';
import type { CallableRequest } from '@cherrytree/shared';

import { usePageMeta } from '../hooks/usePageMeta.ts';
import MarketingNav from '../components/MarketingNav.tsx';
import MarketingFooter from '../components/MarketingFooter.tsx';
import MarketingGrain from '../components/MarketingGrain.tsx';
import { callFunction } from '../lib/functions.ts';

type ContactForm = CallableRequest<'sendContactMessage'>;
type Status = 'idle' | 'sending' | 'sent' | 'error';

const EMPTY_FORM: ContactForm = { name: '', email: '', message: '' };
const SEND_FAILED_MESSAGE =
  'Something went wrong sending your message. Please try again or email us directly at hello@cherrytree.app.';

function ContactPage() {
  usePageMeta({
    title: 'Contact Us — Cherrytree',
    description: "We'd love to hear from you. Get in touch with the Cherrytree team.",
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Contact' }],
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange =
    (field: keyof ContactForm) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = e.currentTarget; // read now: React nulls currentTarget after the handler
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');
    try {
      await callFunction('sendContactMessage', {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });
      setStatus('sent');
      setForm(EMPTY_FORM);
    } catch (error) {
      setStatus('error');
      // Only surface the server's message for validation errors (e.g. "Please enter a valid
      // email address.") — other error codes (network, internal) get a friendly fallback
      // instead of leaking an opaque SDK error string.
      setErrorMessage(
        error instanceof FunctionsError && error.code === 'functions/invalid-argument'
          ? error.message
          : SEND_FAILED_MESSAGE,
      );
    }
  };

  return (
    <div className="lp" style={{ minHeight: '100vh' }}>
      <MarketingGrain />
      <MarketingNav />

      {/* Hero */}
      <section className="lp-page-hero">
        <div className="lp-overline">Contact</div>
        <h1 className="lp-page-h1">Get in touch.</h1>
        <p className="lp-page-sub">We'd love to hear from you.</p>
      </section>

      {/* Form */}
      <section className="lp-page-section">
        <div className="lp-contact-form-wrap">
          {status === 'sent' ? (
            <div className="lp-form-success">
              <div className="lp-form-success-title">Message sent.</div>
              <p className="lp-form-success-body">
                Thanks for reaching out — we'll get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="lp-form-group">
                <label className="lp-form-label" htmlFor="contact-name">
                  Name
                </label>
                <input
                  id="contact-name"
                  className="lp-form-input"
                  type="text"
                  placeholder="Alex Chen"
                  value={form.name}
                  onChange={handleChange('name')}
                  required
                  maxLength={200}
                />
              </div>
              <div className="lp-form-group">
                <label className="lp-form-label" htmlFor="contact-email">
                  Email
                </label>
                <input
                  id="contact-email"
                  className="lp-form-input"
                  type="email"
                  placeholder="alex@startup.co"
                  value={form.email}
                  onChange={handleChange('email')}
                  required
                  maxLength={254}
                />
              </div>
              <div className="lp-form-group">
                <label className="lp-form-label" htmlFor="contact-message">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  className="lp-form-input lp-form-textarea"
                  placeholder="Tell us what's on your mind..."
                  value={form.message}
                  onChange={handleChange('message')}
                  required
                  maxLength={5000}
                  rows={6}
                />
              </div>
              {status === 'error' && <div className="lp-form-error">{errorMessage}</div>}
              <button className="lp-btn-submit" type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send message'}
              </button>
              <div className="lp-form-note">We'll get back to you soon.</div>
            </form>
          )}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

export default ContactPage;
