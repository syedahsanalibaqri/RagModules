import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import useCaptchaSubmit from '../hooks/useCaptchaSubmit';
import CaptchaBranding from '../components/CaptchaBranding';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const getCaptchaToken = useCaptchaSubmit();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setIsError(false);

    try {
      const captchaToken = await getCaptchaToken('forgot_password');
      const res = await axios.post(`${API}/api/auth/forgot-password`, {
        email,
        captchaToken,
      });
      sessionStorage.setItem('resetEmail', email);
      setMsg(res.data.message);
      setIsError(false);
      setTimeout(() => {
        navigate('/verify-otp', { state: { email } });
      }, 1200);
    } catch (err) {
      setIsError(true);
      setMsg(err.response?.data?.message || err.message || 'Something went wrong.');
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
          <h2>Forgot Password</h2>
          <p>Enter your email to receive a secure password reset code</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="forgot-email">Account Email</label>
            <input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Sending Code...' : 'Send Reset Code'}
          </button>
        </form>

        {msg && (
          <div className={`alert-banner ${isError ? 'error' : 'success'}`}>
            <span>{isError ? '⚠️' : '✅'}</span>
            <span>{msg}</span>
          </div>
        )}

        <div className="auth-footer">
          Remembered your password?
          <Link to="/login">Back to Sign In</Link>
        </div>

        <CaptchaBranding />
      </div>
    </div>
  );
}
