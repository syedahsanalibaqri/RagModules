import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import useCaptchaSubmit from '../hooks/useCaptchaSubmit';
import CaptchaBranding from '../components/CaptchaBranding';
import GoogleLoginButton from '../components/GoogleLoginButton';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Signup() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const getCaptchaToken = useCaptchaSubmit();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (form.password !== form.confirmPassword) {
      return setMsg({ type: 'error', text: 'Passwords do not match.' });
    }
    if (form.password.length < 8) {
      return setMsg({
        type: 'error',
        text: 'Password must be at least 8 characters long.',
      });
    }

    setLoading(true);
    try {
      const captchaToken = await getCaptchaToken('signup');
      const res = await axios.post(`${API}/api/auth/signup`, {
        ...form,
        captchaToken,
      });
      setMsg({ type: 'success', text: res.data.message });
      sessionStorage.setItem('signupEmail', res.data.email);
      setTimeout(() => navigate('/signup/verify-otp'), 1500);
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Signup failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-icon">§</div>
          <span className="brand-name">Legal RAG</span>
        </div>

        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Get started with your intelligent legal research suite</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="signup-name">Full Name</label>
            <input
              id="signup-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Sarah Jenkins"
              required
              maxLength={100}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-email">Email Address</label>
            <input
              id="signup-email"
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
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-confirm">Confirm Password</label>
            <input
              id="signup-confirm"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              required
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or sign up with</span>
        </div>

        <div className="google-btn-wrapper">
          <GoogleLoginButton onError={(m) => setMsg({ type: 'error', text: m })} />
        </div>

        {msg.text && (
          <div className={`alert-banner ${msg.type}`}>
            <span>{msg.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{msg.text}</span>
          </div>
        )}

        <div className="auth-footer">
          Already have an account?
          <Link to="/login">Sign in</Link>
        </div>

        <CaptchaBranding />
      </div>
    </div>
  );
}
