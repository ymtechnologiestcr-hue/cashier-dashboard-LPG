import { useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { closeCashierDay, getClosingSummary } from '../services/cashierApi';

const CASH_DAY_CLOSED_KEY = 'cashier_day_closed';

const initialDenominations = [
  { label: '₹500', value: 500, count: 0 },
  { label: '₹200', value: 200, count: 0 },
  { label: '₹100', value: 100, count: 0 },
  { label: '₹50', value: 50, count: 0 },
  { label: '₹20', value: 20, count: 0 },
  { label: '₹10', value: 10, count: 0 },
];

function Closing() {
  const [denominations, setDenominations] = useState(initialDenominations);
  const [coinAmount, setCoinAmount] = useState(0);
  // Cash kept aside as petty cash for the next day. Saved with the closing and
  // read back on the Opening Cash page.
  const [pettyCash, setPettyCash] = useState(0);
  const [differenceReason, setDifferenceReason] = useState('');
  const [systemCash, setSystemCash] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSystemCash() {
      try {
        const response = await getClosingSummary();
        if (response?.success) {
          setSystemCash(response.cashTotal || 0);
        }
      } catch (err) {
        console.error('Load closing summary failed:', err);
      }
    }

    loadSystemCash();
  }, []);

  const notesTotal = useMemo(
    () => denominations.reduce((sum, denom) => sum + denom.value * Number(denom.count || 0), 0),
    [denominations]
  );

  const physicalTotal = notesTotal + Number(coinAmount || 0);

  const difference = physicalTotal - systemCash;

  const handleCountChange = (index, value) => {
    const count = Number(value);
    if (Number.isNaN(count) || count < 0) return;
    setDenominations((prev) => prev.map((denom, idx) => (idx === index ? { ...denom, count } : denom)));
  };

  const handleCoinChange = (value) => {
    const amount = Number(value);
    if (Number.isNaN(amount) || amount < 0) return;
    setCoinAmount(amount);
  };

  const handlePettyCashChange = (value) => {
    const amount = Number(value);
    if (Number.isNaN(amount) || amount < 0) return;
    setPettyCash(amount);
  };

  const handleCloseDay = async () => {
    setMessage('');
    setError('');

    if (difference !== 0 && !differenceReason.trim()) {
      setError('Please explain the difference before closing the day.');
      return;
    }

    const response = await closeCashierDay({
      closingAmount: physicalTotal,
      denominations: [
        ...denominations.map((denom) => ({
          label: denom.label,
          value: denom.value,
          count: denom.count,
          subtotal: denom.value * denom.count,
        })),
        { label: 'Coins', value: Number(coinAmount || 0), count: 1, subtotal: Number(coinAmount || 0) },
      ],
      differenceReason: differenceReason.trim() || null,
      pettyCash: Number(pettyCash || 0),
    });

    if (response?.success) {
      localStorage.setItem(CASH_DAY_CLOSED_KEY, 'true');
      window.dispatchEvent(new Event('cashier-day-state-changed'));
      // Day is closed: the "since last close" window is now empty, so the
      // system-calculated cash resets to 0.
      setSystemCash(0);
      setDenominations(initialDenominations);
      setCoinAmount(0);
      setPettyCash(0);
      setDifferenceReason('');
      setMessage(response.message);
    } else {
      setError(response?.message || 'Unable to close day.');
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="page-content">
        <Header />
        <main className="page-main">

          <section className="closing-grid">
            <div className="closing-card">
              <div className="card-heading">
                <div>
                  <p className="section-label">Physical Cash Count</p>
                  <h2>Count notes carefully. System will detect any mismatch.</h2>
                </div>
              </div>
              <div className="denomination-grid">
                {denominations.map((denom, index) => (
                  <div key={denom.label} className="denomination-pair">
                    <span>{denom.label}</span>
                    <input
                      type="number"
                      min="0"
                      value={denom.count}
                      onChange={(event) => handleCountChange(index, event.target.value)}
                    />
                    <strong>₹{(denom.value * denom.count).toLocaleString('en-IN')}</strong>
                  </div>
                ))}
                <div className="denomination-pair">
                  <span>Coins</span>
                  <input
                    type="number"
                    min="0"
                    value={coinAmount}
                    onChange={(event) => handleCoinChange(event.target.value)}
                    placeholder="₹ total"
                  />
                  <strong>₹{Number(coinAmount || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div className="denomination-pair">
                  <span>Petty Cash</span>
                  <input
                    type="number"
                    min="0"
                    value={pettyCash}
                    onChange={(event) => handlePettyCashChange(event.target.value)}
                    placeholder="₹ total"
                  />
                  <strong>₹{Number(pettyCash || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>
              <p className="close-day-note">
                Petty cash is recorded with the closing and shown on the next Start
                Day. It is not part of the physical count above.
              </p>
            </div>

            <div className="closing-summary-column">
              <div className="summary-card closing-summary-card">
                <p className="section-label" style={{ color: '#000' }}>System Calculated</p>
                <h2 style={{ color: '#000' }}>₹{systemCash.toLocaleString('en-IN')}</h2>
              </div>
              <div className="summary-card closing-summary-card">
                <p className="section-label" style={{ color: '#000' }}>Physical Count</p>
                <h2 style={{ color: '#000' }}>₹{physicalTotal.toLocaleString('en-IN')}</h2>
              </div>
              <div className="difference-card">
                <div className="difference-title-row">
                  <span className="difference-label">Difference</span>
                  <span className="difference-icon">⚠️</span>
                </div>
                <h2 className="difference-value">₹{difference.toLocaleString('en-IN', { signDisplay: 'always' })}</h2>
                <p className="difference-note">
                  {difference === 0
                    ? 'Balanced. Ready to close.'
                    : 'Cash mismatch detected. Please provide reason before closing.'}
                </p>
                <label className="form-field">
                  Reason for difference
                  <input
                    type="text"
                    value={differenceReason}
                    onChange={(event) => setDifferenceReason(event.target.value)}
                    placeholder="Reason for difference (required if mismatch)"
                  />
                </label>
                <div className="difference-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setDenominations(initialDenominations);
                      setCoinAmount(0);
                    }}
                  >
                    Reset Counts
                  </button>
                  <button type="button" className="primary-button" onClick={handleCloseDay}>
                    Close Day
                  </button>
                </div>
              </div>
              {message && <div className="success-box">{message}</div>}
              {error && <div className="error-box">{error}</div>}
              <p className="close-day-note">After closing, edits require admin override</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Closing;
