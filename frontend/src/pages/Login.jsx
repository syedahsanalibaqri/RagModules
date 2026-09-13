import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import useCaptchaSubmit from '../hooks/useCaptchaSubmit';
import CaptchaBranding from '../components/CaptchaBranding';
import GoogleLoginButton from '../components/GoogleLoginButton';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const getCaptchaToken = useCaptchaSubmit();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);

    try {
      const captchaToken = await getCaptchaToken('login');
      const res = await axios.post(`${API}/api/auth/login`, {
        email,
        password,
        captchaToken,
      });

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', res.data.token);
      storage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;

      if (data?.emailNotVerified) {
        sessionStorage.setItem('signupEmail', email);
        setMsg('Please verify your email first. Redirecting...');
        setTimeout(() => navigate('/signup/verify-otp'), 1500);
      } else if (data?.accountDeactivated) {
        setMsg(
          'Your account is deactivated. Check your email for the reactivation link.'
        );
      } else {
        setMsg(data?.message || err.message || 'Login failed.');
      }
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
          <h2>Welcome Back</h2>
          <p>Sign in to access your secure legal workspace</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="form-input"
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="link-inline">
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <div className="google-btn-wrapper">
          <GoogleLoginButton onError={(m) => setMsg(m)} />
        </div>

        {msg && (
          <div className="alert-banner error">
            <span>⚠️</span>
            <span>{msg}</span>
          </div>
        )}

        <div className="auth-footer">
          Don't have an account?
          <Link to="/signup">Sign up</Link>
        </div>

        <CaptchaBranding />
      </div>
    </div>
  );
}
