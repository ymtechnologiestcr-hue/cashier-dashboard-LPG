import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { getLastClosingBalance, startCashierDay } from '../services/cashierApi';

const CASH_DAY_CLOSED_KEY = 'cashier_day_closed';

function OpeningCash() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [lastClosingBalance, setLastClosingBalance] = useState(null);

  const [denominations, setDenominations] = useState([
    { label: '₹500', value: 500, count: 0 },
    { label: '₹200', value: 200, count: 0 },
    { label: '₹100', value: 100, count: 0 },
    { label: '₹50', value: 50, count: 0 },
    { label: '₹20', value: 20, count: 0 },
    { label: '₹10', value: 10, count: 0 },
  ]);
  const [coinAmount, setCoinAmount] = useState(0);

  const totalNotes = denominations.reduce((sum, d) => sum + d.count, 0);
  const totalBalance =
    denominations.reduce((sum, d) => sum + d.value * d.count, 0) + Number(coinAmount || 0);

  useEffect(() => {
    async function loadLastClosing() {
      try {
        const response = await getLastClosingBalance();
        if (response?.success) {
          setLastClosingBalance(response.total_cash);
        }
      } catch (err) {
        console.error('Failed to fetch last closing balance:', err);
      }
    }

    loadLastClosing();
  }, []);

  const handleStartDay = async () => {
    setMessage('');
    setError('');

    if (lastClosingBalance !== null && lastClosingBalance !== 0 && Number(totalBalance) !== Number(lastClosingBalance)) {
      setError(`Opening balance must match last closing balance of ₹${lastClosingBalance.toLocaleString('en-IN')}`);
      return;
    }

    const response = await startCashierDay({
      totalAmount: totalBalance,
      denominations: [
        ...denominations.map((denom) => ({
          label: denom.label,
          value: denom.value,
          count: denom.count,
          subtotal: denom.value * denom.count,
        })),
        { label: 'Coins', value: Number(coinAmount || 0), count: 1, subtotal: Number(coinAmount || 0) },
      ],
    });

    if (response?.success) {
      localStorage.setItem(CASH_DAY_CLOSED_KEY, 'false');
      window.dispatchEvent(new Event('cashier-day-state-changed'));
      setMessage(response.message);
    } else {
      setError(response?.message || 'Unable to start day.');
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="page-content">
        <Header />
        <main className="page-main">

          <div className="opening-cash-grid">
            <section className="denomination-card">
              <h2>Denomination Entry</h2>
              <p className="card-subtitle">Count each note carefully — this becomes your day's opening balance</p>

              <div className="denomination-list">
                {denominations.map((denom, index) => (
                  <div key={denom.label} className="denomination-row">
                    <div className="denom-value">{denom.label}</div>
                    <span className="denom-multiply">×</span>
                    <input
                      className="denom-input"
                      type="number"
                      min="0"
                      value={denom.count}
                      onChange={(event) => {
                        const count = Number(event.target.value);
                        if (Number.isNaN(count) || count < 0) return;
                        setDenominations((prev) =>
                          prev.map((item, idx) =>
                            idx === index ? { ...item, count } : item
                          )
                        );
                      }}
                    />
                    <div className="denom-unit">notes</div>
                    <div className="denom-right">
                      <span className="denom-label">Subtotal</span>
                      <span className="denom-subtotal">₹{(denom.value * denom.count).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}

                <div className="denomination-row">
                  <div className="denom-value">Coins</div>
                  <span className="denom-multiply">₹</span>
                  <input
                    className="denom-input"
                    type="number"
                    min="0"
                    value={coinAmount}
                    placeholder="Total"
                    onChange={(event) => {
                      const amount = Number(event.target.value);
                      if (Number.isNaN(amount) || amount < 0) return;
                      setCoinAmount(amount);
                    }}
                  />
                  <div className="denom-unit">total</div>
                  <div className="denom-right">
                    <span className="denom-label">Subtotal</span>
                    <span className="denom-subtotal">₹{Number(coinAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="opening-summary">
              <div className="summary-card teal">
                <div className="summary-label">TOTAL OPENING BALANCE</div>
                <h3 className="summary-amount">₹{totalBalance.toLocaleString('en-IN')}</h3>
                <div className="summary-details">
                  <div className="detail-item">
                    <span>Total notes</span>
                    <strong>{totalNotes}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Date</span>
                    <strong>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                  </div>
                </div>
              </div>

              <button className="start-day-button" type="button" onClick={handleStartDay}>
                Start Day ⊙
              </button>

              {lastClosingBalance !== null && (
                <div style={{ marginTop: '24px', backgroundColor: '#fdf8ec', borderRadius: '12px', padding: '20px', border: '1px solid #f0e6d2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ backgroundColor: '#f3e8d2', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a5a19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <strong style={{ fontSize: '13px', color: '#8a5a19', letterSpacing: '0.5px' }}>YESTERDAY</strong>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#4b5563' }}>
                    <span>Closing balance</span>
                    <strong style={{ color: '#111827' }}>₹{lastClosingBalance.toLocaleString('en-IN')}</strong>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px', color: '#4b5563' }}>
                    <span>Petty cash</span>
                    <strong style={{ color: '#111827' }}>₹0</strong>
                  </div>
                  
                  <div style={{ borderTop: '1px solid #f0e6d2', margin: '0 -20px', padding: '0 20px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#111827', fontWeight: 'bold' }}>
                    <span>Carried forward</span>
                    <span>₹{lastClosingBalance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {message && <div className="success-box" style={{ marginTop: '16px' }}>{message}</div>}
              {error && <div className="error-box" style={{ marginTop: '16px' }}>{error}</div>}

              <div className="info-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                <p>
                  You can't proceed until opening balance is entered. Once started, the day is logged with timestamp.
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default OpeningCash;
