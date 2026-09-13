import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AccountSettings() {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const getToken = () =>
    localStorage.getItem('token') || sessionStorage.getItem('token') || null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const handleDeactivate = async () => {
    if (!password) {
      setIsError(true);
      return setMsg('Password is required.');
    }

    const token = getToken();
    if (!token) return navigate('/login');

    setLoading(true);
    setMsg('');
    setIsError(false);
    try {
      const res = await axios.post(
        `${API}/api/auth/deactivate`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg(res.data.message);
      setIsError(false);
      setTimeout(() => {
        handleLogout();
      }, 2500);
    } catch (err) {
      setIsError(true);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setTimeout(() => navigate('/login'), 1500);
      }
      setMsg(err.response?.data?.message || 'Deactivation failed.');
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
          <h2>Account Dashboard</h2>
          <p>Manage your profile, security, and account preferences</p>
        </div>

        {/* Profile Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '1.25rem',
                color: '#fff',
                overflow: 'hidden',
              }}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (user?.name || 'U').charAt(0).toUpperCase()
              )}
            </div>

            <div>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: '#f8fafc' }}>
                {user?.name || 'Authorized Member'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {user?.email || 'Logged in user'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            Sign Out
          </button>
        </div>

        {/* Danger Zone */}
        <div
          style={{
            padding: '1.35rem',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '14px',
            background: 'rgba(239, 68, 68, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
            <h3 style={{ color: '#f87171', fontSize: '1rem', fontWeight: '700' }}>
              Danger Zone
            </h3>
          </div>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              lineHeight: '1.5',
            }}
          >
            Deactivating your account disables all active sessions. A reactivation link will be sent to your email to restore your account anytime within 30 days.
          </p>

          {!showModal ? (
            <button
              onClick={() => setShowModal(true)}
              className="btn-danger"
            >
              Deactivate Account
            </button>
          ) : (
            <div style={{ marginTop: '0.85rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.825rem',
                  fontWeight: '600',
                  color: '#cbd5e1',
                  marginBottom: '0.45rem',
                }}
              >
                Confirm password or type CONFIRM:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password or CONFIRM"
                className="form-input"
                style={{ marginBottom: '0.75rem' }}
              />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleDeactivate}
                  disabled={loading}
                  className="btn-danger"
                  style={{ opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? 'Processing...' : 'Confirm Deactivation'}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setPassword('');
                    setMsg('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {msg && (
          <div className={`alert-banner ${isError ? 'error' : 'success'}`}>
            <span>{isError ? '⚠️' : '✅'}</span>
            <span>{msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
