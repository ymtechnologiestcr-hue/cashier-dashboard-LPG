import { useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { closeCashierDay, getTodaysCashFlow } from '../services/cashierApi';

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
  const [cashFlow, setCashFlow] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [disposition, setDisposition] = useState('owner');
  const [closeNote, setCloseNote] = useState('');

  useEffect(() => {
    async function loadSystemCash() {
      try {
        const response = await getTodaysCashFlow();
        if (response?.success) {
          setCashFlow(response);
          setSystemCash(response.currentBalance || 0);
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

  const handleCloseDay = () => {
    setMessage('');
    setError('');

    if (difference !== 0 && !differenceReason.trim()) {
      setError('Please explain the difference before closing the day.');
      return;
    }

    setIsModalOpen(true);
  };

  const submitCloseDay = async () => {

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
      reasonDisposition: disposition === 'owner' ? 'Hand over to Owner' : 'Deposit in Bank',
      note: closeNote.trim() || null,
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
      setIsModalOpen(false);
      setDisposition('owner');
      setCloseNote('');
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
              <div className="summary-card closing-summary-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <p className="section-label" style={{ color: '#6b7280', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>System Calculated</p>
                  <p className="section-label" style={{ color: '#6b7280', fontWeight: '600', fontSize: '11px', margin: 0 }}>Total</p>
                </div>
                
                {cashFlow && (
                  <>
                    <h2 style={{ color: '#111827', fontSize: '32px', marginBottom: '24px', fontWeight: '700' }}>
                      ₹{((cashFlow.currentBalance || 0) + (cashFlow.breakdown?.online || 0) + (cashFlow.breakdown?.bank || 0)).toLocaleString('en-IN')}
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', background: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '16px', letterSpacing: '0.5px' }}>CASH</span>
                        <strong style={{ fontSize: '15px', color: '#111827' }}>₹{(cashFlow.currentBalance || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '16px', letterSpacing: '0.5px' }}>UPI</span>
                        <strong style={{ fontSize: '15px', color: '#111827' }}>₹{(cashFlow.breakdown?.online || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '16px', letterSpacing: '0.5px' }}>BANK</span>
                        <strong style={{ fontSize: '15px', color: '#111827' }}>₹{(cashFlow.breakdown?.bank || 0).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', color: '#4b5563', fontSize: '13px', alignItems: 'flex-start' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                      <p style={{ margin: 0 }}>UPI & Bank auto-reconcile. Only <strong style={{ color: '#111827' }}>Cash</strong> is matched against physical count.</p>
                    </div>
                  </>
                )}
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

      {isModalOpen && (
        <div className="close-modal-overlay">
          <div className="close-modal-content">
            <div className="close-modal-header">
              <div>
                <h2>Close Day</h2>
                <p>Confirm cash handover and lock the day</p>
              </div>
              <button className="close-modal-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <div className="close-modal-body">
              <div className="close-modal-total-card">
                <span className="close-modal-label">TOTAL CLOSING AMOUNT</span>
                <p className="close-modal-total-value">₹{physicalTotal.toLocaleString('en-IN')}</p>
              </div>

              <div className="close-modal-row">
                <div className="close-modal-col">
                  <span className="close-modal-label">In-office Cash</span>
                  <div className="petty-cash-input">
                    <span>₹</span>
                    <input 
                      type="number" 
                      value={pettyCash} 
                      onChange={(e) => setPettyCash(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="close-modal-col">
                  <span className="close-modal-label">BALANCE TOTAL</span>
                  <div className="balance-total-card">
                    {/* <span className="balance-total-label">Handover / Deposit</span> */}
                    <span className="balance-total-value">
                      ₹{Math.max(0, physicalTotal - Number(pettyCash || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="close-modal-label">REASON / DISPOSITION</span>
                <div className="disposition-toggle">
                  <button 
                    className={`disposition-btn ${disposition === 'owner' ? 'active' : ''}`}
                    onClick={() => setDisposition('owner')}
                  >
                    Hand over to Owner
                  </button>
                  <button 
                    className={`disposition-btn ${disposition === 'bank' ? 'active' : ''}`}
                    onClick={() => setDisposition('bank')}
                  >
                    Deposit in Bank
                  </button>
                </div>
              </div>

              <div>
                <span className="close-modal-label">NOTE (OPTIONAL)</span>
                <textarea 
                  className="close-modal-note" 
                  placeholder="Handed to..."
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                />
              </div>
            </div>

            <div className="close-modal-footer">
              <button className="close-modal-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="close-modal-submit" onClick={submitCloseDay}>
                ✓ Submit & Close Day
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Closing;
