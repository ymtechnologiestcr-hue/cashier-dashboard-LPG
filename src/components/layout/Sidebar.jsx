import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../../assets/logo.svg';

const CASH_DAY_CLOSED_KEY = 'cashier_day_closed';

const readCashDayClosedState = () => localStorage.getItem(CASH_DAY_CLOSED_KEY) === 'true';

const navItems = [
  { label: 'Dashboard', path: '/', icon: 'dashboard' },
  { label: 'Opening Cash', path: '/opening-cash', icon: 'notebook' },
  { label: 'Cash In', path: '/cash-in', icon: 'cashIn' },
  { label: 'Cash Out', path: '/cash-out', icon: 'cashOut' },
  { label: 'Live Position', path: '/live-position', icon: 'location' },
  // { label: 'Other Payments', path: '/other-payments', icon: 'payments' },
  { label: 'Closing', path: '/closing', icon: 'lock' },
  { label: 'Reports', path: '/reports', icon: 'chart' },
  { label: 'Settings', path: '/settings', icon: 'settings' },
];

const iconMap = {
  dashboard: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="7" height="9" x="3" y="3" rx="1"></rect>
      <rect width="7" height="5" x="14" y="3" rx="1"></rect>
      <rect width="7" height="9" x="14" y="12" rx="1"></rect>
      <rect width="7" height="5" x="3" y="16" rx="1"></rect>
    </svg>
  ),
  notebook: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
    </svg>
  ),
  cashIn: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 17V3"></path>
      <path d="m6 11 6 6 6-6"></path>
      <path d="M19 21H5"></path>
    </svg>
  ),
  cashOut: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m18 9-6-6-6 6"></path>
      <path d="M12 3v14"></path>
      <path d="M5 21h14"></path>
    </svg>
  ),
  location: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path>
    </svg>
  ),
  payments: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="14" x="2" y="5" rx="2"></rect>
      <line x1="2" x2="22" y1="10" y2="10"></line>
    </svg>
  ),
  lock: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),
  chart: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path>
      <path d="M14 2v5a1 1 0 0 0 1 1h5"></path>
      <path d="M8 18v-1"></path>
      <path d="M12 18v-6"></path>
      <path d="M16 18v-3"></path>
    </svg>
  ),
  settings: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
};

function Sidebar() {
  const [isCashDayClosed, setIsCashDayClosed] = useState(readCashDayClosedState());

  useEffect(() => {
    const handleCashDayStateChanged = () => {
      setIsCashDayClosed(readCashDayClosedState());
    };

    window.addEventListener('cashier-day-state-changed', handleCashDayStateChanged);
    window.addEventListener('storage', handleCashDayStateChanged);

    return () => {
      window.removeEventListener('cashier-day-state-changed', handleCashDayStateChanged);
      window.removeEventListener('storage', handleCashDayStateChanged);
    };
  }, []);

  const isLockedNavItem = (path) =>
    isCashDayClosed && (path === '/cash-in' || path === '/cash-out');

  return (
    <aside className="sidebar">
      <div>
        {/* <div className="sidebar-title">Operations</div> */}
        <div className="">
          <div className="">
            {/* <img src={logo} alt="Cashflow logo" /> */}
          </div>
          <div>
            <span className="brand-name">Suraj Gas Agency</span>

            <p className="brand-name">CASHIER</p>
            <p></p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isDisabled = isLockedNavItem(item.path);

          if (isDisabled) {
            return (
              <span
                key={item.path}
                className="nav-link disabled"
                aria-disabled="true"
                title="Submit opening cash to enable this menu"
              >
                <span className="nav-icon" aria-hidden="true">{iconMap[item.icon]}</span>
                {item.label}
              </span>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <span className="nav-icon" aria-hidden="true">{iconMap[item.icon]}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="status-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
            <path d="m9 12 2 2 4-4"></path>
          </svg>
        </span>
        <div>
          <p className="footer-title">Day Active</p>
          <p className="footer-meta">Started at 08:42 AM by Rajesh K.</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
