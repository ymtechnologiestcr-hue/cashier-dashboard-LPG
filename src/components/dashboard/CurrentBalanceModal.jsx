import React, { useEffect, useState } from 'react';
import './CurrentBalanceModal.css';
import { getCashFlowEntries } from '../../services/cashierApi';

function CurrentBalanceModal({ date, metrics, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getCashFlowEntries(date)
      .then((res) => {
        if (active) {
          setEntries(res.entries || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Failed to load entries');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [date]);

  const cashInEntries = entries.filter((e) => e.direction === 'IN');
  const cashOutEntries = entries.filter((e) => e.direction === 'OUT');

  // Find summary metrics
  const openingStr = metrics.find((m) => m.title === 'Opening Balance')?.value || '₹0';
  const cashInStr = metrics.find((m) => m.title === 'Total Cash In')?.value || '₹0';
  const cashOutStr = metrics.find((m) => m.title === 'Total Cash Out')?.value || '₹0';
  const currentStr = metrics.find((m) => m.title === 'Current Balance')?.value || '₹0';

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getModeClass = (mode) => {
    return mode?.toLowerCase() === 'cash' ? 'cash' : '';
  };

  return (
    <div className="cb-modal-overlay">
      <div className="cb-modal-content">
        <div className="cb-modal-header">
          <div>
            <h2>Current Balance · Line Items</h2>
            <p>All cash in and cash out transactions for today</p>
          </div>
          <div className="cb-header-actions">
            <button className="btn-export">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export
            </button>
            <button className="btn-close" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="cb-modal-body">
          <div className="cb-summary-row">
            {metrics.map((metric) => (
              <div className="cb-summary-card" key={metric.title}>
                <span className="cb-summary-label">{metric.title.toUpperCase()}</span>
                <span
                  className={`cb-summary-value ${
                    metric.title.includes('Cash In') || metric.title.includes('Current Balance')
                      ? 'success'
                      : metric.title.includes('Cash Out')
                      ? 'danger'
                      : 'primary'
                  }`}
                >
                  {metric.value}
                </span>
              </div>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading entries...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>{error}</div>
          ) : (
            <div className="cb-tables-grid">
              {/* Cash In Table */}
              <div className="cb-table-panel">
                <div className="cb-table-header success-bg">
                  <div className="cb-table-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                      <polyline points="16 7 22 7 22 13"></polyline>
                    </svg>
                    Cash In
                    <span className="cb-count">- {cashInEntries.length} entries</span>
                  </div>
                  <span>{cashInStr}</span>
                </div>
                <div className="cb-table-wrapper">
                  <table className="cb-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Ref</th>
                        <th>Source</th>
                        <th>Type</th>
                        <th>Mode</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashInEntries.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8' }}>
                            No entries found
                          </td>
                        </tr>
                      ) : (
                        cashInEntries.map((entry, idx) => (
                          <tr key={idx}>
                            <td className="col-time">{formatTime(entry.timestamp)}</td>
                            <td className="col-ref">{entry.reference_id}</td>
                            <td className="col-source">{entry.source || 'Unknown'}</td>
                            <td className="col-type">{entry.description || entry.type}</td>
                            <td className="col-mode">
                              <span className={`mode-pill ${getModeClass(entry.payment_mode)}`}>{entry.payment_mode}</span>
                            </td>
                            <td className="col-amount success">+{entry.amount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cash Out Table */}
              <div className="cb-table-panel">
                <div className="cb-table-header danger-bg">
                  <div className="cb-table-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
                      <polyline points="16 17 22 17 22 11"></polyline>
                    </svg>
                    Cash Out
                    <span className="cb-count">- {cashOutEntries.length} entries</span>
                  </div>
                  <span>{cashOutStr}</span>
                </div>
                <div className="cb-table-wrapper">
                  <table className="cb-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Ref</th>
                        <th>Payee</th>
                        <th>Type</th>
                        <th>Mode</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashOutEntries.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8' }}>
                            No entries found
                          </td>
                        </tr>
                      ) : (
                        cashOutEntries.map((entry, idx) => (
                          <tr key={idx}>
                            <td className="col-time">{formatTime(entry.timestamp)}</td>
                            <td className="col-ref">{entry.reference_id}</td>
                            <td className="col-source">{entry.payee || 'Unknown'}</td>
                            <td className="col-type">{entry.description || entry.type}</td>
                            <td className="col-mode">
                              <span className={`mode-pill ${getModeClass(entry.payment_mode)}`}>{entry.payment_mode}</span>
                            </td>
                            <td className="col-amount danger">-{entry.amount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="cb-modal-footer">
          <div className="cb-formula">
            Opening {openingStr} + Cash In {cashInStr} - Cash Out {cashOutStr}
          </div>
          <div className="cb-final-balance">
            Current Balance <span>{currentStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CurrentBalanceModal;
