import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import useCaptchaSubmit from '../hooks/useCaptchaSubmit';
import CaptchaBranding from '../components/CaptchaBranding';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ResetPassword() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem('resetEmail') || '';
  const otp = sessionStorage.getItem('resetOtp') || '';
  const getCaptchaToken = useCaptchaSubmit();

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email || !otp) navigate('/forgot-password', { replace: true });
  }, [email, otp, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setIsError(false);

    if (newPassword.length < 8) {
      setIsError(true);
      return setMsg('Password must be at least 8 characters long.');
    }
    if (newPassword !== confirm) {
      setIsError(true);
      return setMsg('Passwords do not match.');
    }

    setLoading(true);
    try {
      const captchaToken = await getCaptchaToken('reset_password');
      const res = await axios.post(`${API}/api/auth/reset-password`, {
        email,
        otp,
        newPassword,
        captchaToken,
      });
      sessionStorage.removeItem('resetEmail');
      sessionStorage.removeItem('resetOtp');
      setMsg(res.data.message);
      setIsError(false);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setIsError(true);
      setMsg(err.response?.data?.message || err.message || 'Reset failed.');
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
          <h2>Reset Password</h2>
          <p>Create a new strong password for your account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reset-new-pass">New Password</label>
            <input
              id="reset-new-pass"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reset-confirm-pass">Confirm New Password</label>
            <input
              id="reset-confirm-pass"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>

        {msg && (
          <div className={`alert-banner ${isError ? 'error' : 'success'}`}>
            <span>{isError ? '⚠️' : '✅'}</span>
            <span>{msg}</span>
          </div>
        )}

        <div className="auth-footer">
          <Link to="/login">← Cancel and return to Login</Link>
        </div>

        <CaptchaBranding />
      </div>
    </div>
  );
}
