import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function VerifyOtp() {
  const { state } = useLocation();
  const email = state?.email || sessionStorage.getItem('resetEmail') || '';
  const [otp, setOtp] = useState('');
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setIsError(true);
      return setMsg('Please enter a 6-digit OTP.');
    }
    setLoading(true);
    setMsg('');
    setIsError(false);

    try {
      await axios.post(`${API}/api/auth/verify-otp`, { email, otp });
      sessionStorage.setItem('resetEmail', email);
      sessionStorage.setItem('resetOtp', otp);
      navigate('/reset-password');
    } catch (err) {
      setIsError(true);
      setMsg(err.response?.data?.message || err.message || 'Verification failed.');
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
          <h2>Verify Reset Code</h2>
          <p>
            Enter the 6-digit code sent to <b>{email || 'your email'}</b>
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
            {loading ? 'Verifying Code...' : 'Verify Code'}
          </button>
        </form>

        {msg && (
          <div className={`alert-banner ${isError ? 'error' : 'success'}`}>
            <span>{isError ? '⚠️' : '✅'}</span>
            <span>{msg}</span>
          </div>
        )}

        <div className="auth-footer">
          <Link to="/forgot-password">← Request a new code</Link>
        </div>
      </div>
    </div>
  );
}
