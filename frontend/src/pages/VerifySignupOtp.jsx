import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import useCaptchaSubmit from '../hooks/useCaptchaSubmit';
import CaptchaBranding from '../components/CaptchaBranding';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function VerifySignupOtp() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem('signupEmail') || '';
  const getCaptchaToken = useCaptchaSubmit();

  const [otp, setOtp] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) navigate('/signup', { replace: true });
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      return setMsg({ type: 'error', text: 'Please enter a 6-digit verification code.' });
    }
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await axios.post(`${API}/api/auth/signup/verify-otp`, {
        email,
        otp,
      });
      setMsg({ type: 'success', text: res.data.message });
      sessionStorage.removeItem('signupEmail');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Verification failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setMsg({ type: '', text: '' });
    try {
      const captchaToken = await getCaptchaToken('send_otp');
      const res = await axios.post(`${API}/api/auth/signup/resend-otp`, {
        email,
        captchaToken,
      });
      setMsg({ type: 'success', text: res.data.message });
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Resend failed.',
      });
    } finally {
      setResending(false);
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
          <h2>Verify Your Email</h2>
          <p>
            Enter the 6-digit verification code sent to <b>{email}</b>
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              autoFocus
              className="form-input otp-input-field"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Verifying Code...' : 'Verify Email'}
          </button>
        </form>

        {msg.text && (
          <div className={`alert-banner ${msg.type}`}>
            <span>{msg.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{msg.text}</span>
          </div>
        )}

        <div className="auth-footer" style={{ marginTop: '1.25rem' }}>
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-400)',
              fontWeight: '600',
              cursor: resending ? 'not-allowed' : 'pointer',
              textDecoration: 'underline',
              fontFamily: 'inherit',
              fontSize: 'inherit',
            }}
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>

        <div className="auth-footer" style={{ marginTop: '0.75rem' }}>
          <Link to="/signup">← Use a different email</Link>
        </div>

        <CaptchaBranding />
      </div>
    </div>
  );
}
