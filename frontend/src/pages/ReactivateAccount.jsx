import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ReactivateAccount() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || token.length < 32) {
      setStatus('error');
      setMessage('Invalid reactivation link. Please check your email.');
      return;
    }
    const reactivate = async () => {
      try {
        const res = await axios.post(`${API}/api/auth/reactivate/${token}`);
        setStatus('success');
        setMessage(res.data.message);
        setTimeout(() => navigate('/login'), 3000);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Reactivation failed.');
      }
    };
    reactivate();
  }, [token, navigate]);

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-brand">
          <div className="brand-icon">§</div>
          <span className="brand-name">Legal RAG</span>
        </div>

        {status === 'loading' && (
          <div className="auth-header">
            <h2>Reactivating Account...</h2>
            <p>Verifying your cryptographic reactivation token</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="auth-header">
              <h2 style={{ color: '#34d399' }}>Account Reactivated!</h2>
              <p>{message}</p>
            </div>
            <div className="alert-banner success">
              <span>✅</span>
              <span>Redirecting to login portal in 3 seconds...</span>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="auth-header">
              <h2 style={{ color: '#f87171' }}>Reactivation Failed</h2>
              <p>{message}</p>
            </div>
            <div className="alert-banner error" style={{ marginBottom: '1.5rem' }}>
              <span>⚠️</span>
              <span>Token is expired or already used.</span>
            </div>
            <button onClick={() => navigate('/login')} className="btn-primary">
              Return to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
