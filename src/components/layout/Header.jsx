import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AUTH_TOKEN_KEY = 'cashier_auth_token';
const AUTH_USER_KEY = 'cashier_auth_user';

const PAGE_META = {
  '/': { title: 'Dashboard', subtitle: "Real time overview of today's cash operations" },
  '/opening-cash': { title: 'Opening Cash', subtitle: 'Start your day by counting opening balance' },
  '/cash-in': { title: 'Cash In', subtitle: 'Verify driver collections, office sales and other receipts' },
  '/cash-out': { title: 'Cash Out', subtitle: 'Approve expenses and track outflow' },
  '/live-position': { title: 'Live Cash Position', subtitle: 'Real-time balance with inflow vs outflow' },
  '/other-payments': { title: 'Other Payments', subtitle: 'UPI, bank transfers and card transactions' },
  '/closing': { title: 'Closing Cash', subtitle: 'Reconcile and close the day' },
  '/reports': { title: 'Reports', subtitle: 'Daily, expense and collection reports' },
  '/settings': { title: 'Settings', subtitle: 'Security, roles and preferences' },
};

function formatDate(value) {
  if (!value) return '';
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Header({ dateRange = {}, onApplyRange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const meta = PAGE_META[location.pathname] || PAGE_META['/'];

  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(dateRange.startDate || '');
  const [to, setTo] = useState(dateRange.endDate || '');

  const [userName, setUserName] = useState('Rajesh K.');
  const [userInitials, setUserInitials] = useState('RK');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.name) {
          setUserName(user.name);
          const initials = user.name
            .split(' ')
            .filter(Boolean)
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
          setUserInitials(initials || 'U');
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    setFrom(dateRange.startDate || '');
    setTo(dateRange.endDate || '');
  }, [dateRange.startDate, dateRange.endDate]);

  const handleSignOut = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    navigate('/login');
  };

  const label = dateRange.startDate
    ? dateRange.startDate === dateRange.endDate
      ? formatDate(dateRange.startDate)
      : `${formatDate(dateRange.startDate)} – ${formatDate(dateRange.endDate)}`
    : 'All dates';

  const handleApply = () => {
    if (!from && !to) {
      onApplyRange?.({ startDate: '', endDate: '' });
    } else {
      const start = from || to;
      const end = to || from;
      onApplyRange?.({ startDate: start, endDate: end });
    }
    setOpen(false);
  };

  const handleClear = () => {
    setFrom('');
    setTo('');
    onApplyRange?.({ startDate: '', endDate: '' });
    setOpen(false);
  };

  return (
    <header className="page-header">
      <div>
        <p className="page-title">{meta.title}</p>
        <p className="page-description">{meta.subtitle}</p>
      </div>

      <div className="header-actions">
        <div className="date-filter">
          <button
            type="button"
            className="date-pill"
            onClick={() => setOpen((prev) => !prev)}
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <span className="date-pill-icon">📅</span>
            <span>{label}</span>
            <span className="date-pill-caret">▾</span>
          </button>

          {open && (
            <>
              <div className="date-popover-backdrop" onClick={() => setOpen(false)} />
              <div className="date-popover" role="dialog" aria-label="Select date range">
                <div className="date-field">
                  <label htmlFor="date-from">From</label>
                  <input
                    id="date-from"
                    type="date"
                    value={from}
                    max={to || undefined}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>
                <div className="date-field">
                  <label htmlFor="date-to">To</label>
                  <input
                    id="date-to"
                    type="date"
                    value={to}
                    min={from || undefined}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
                <div className="date-popover-actions">
                  <button type="button" className="date-btn ghost" onClick={handleClear}>
                    Clear
                  </button>
                  <button type="button" className="date-btn primary" onClick={handleApply}>
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button type="button" className="icon-button notification-button" aria-label="Notifications">
          <span>🔔</span>
        </button>
        <div className="profile-pill">
          <div className="avatar">{userInitials}</div>
          <div className="profile-details">
            <span className="profile-name">{userName}</span>
            {/* <small className="profile-role">Cashier</small> */}
          </div>
          <button type="button" className="logout-btn" onClick={handleSignOut}>Sign out</button>
        </div>
      </div>
    </header>
  );
}

export default Header;
