import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (!form.name.trim()) return setMsg({ type: 'error', text: 'Name is required.' });
    if (!form.email.trim()) return setMsg({ type: 'error', text: 'Email is required.' });
    if (!form.message.trim()) return setMsg({ type: 'error', text: 'Message is required.' });

    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/contact`, form);
      setMsg({ type: 'success', text: res.data.message });
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send message.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper wide">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-icon">§</div>
          <span className="brand-name">Legal RAG</span>
        </div>

        <div className="auth-header">
          <h2>Contact Support</h2>
          <p>Have a question, feedback, or need legal portal assistance?</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="contact-name">Your Name</label>
            <input
              id="contact-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. David Vance"
              required
              maxLength={100}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact-email">Email Address</label>
            <input
              id="contact-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              maxLength={254}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact-subject">Subject (Optional)</label>
            <input
              id="contact-subject"
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="How can our team help you?"
              maxLength={200}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact-message">Detailed Message</label>
            <textarea
              id="contact-message"
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Please describe your inquiry or requirements in detail..."
              required
              rows={5}
              maxLength={5000}
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Sending Message...' : 'Send Message'}
          </button>
        </form>

        {msg.text && (
          <div className={`alert-banner ${msg.type}`}>
            <span>{msg.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{msg.text}</span>
          </div>
        )}

        <div className="auth-footer">
          <Link to="/login">← Back to Workspace Login</Link>
        </div>
      </div>
    </div>
  );
}
