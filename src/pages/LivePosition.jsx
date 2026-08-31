import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useEffect, useState } from 'react';
import { getTodaysCashFlow } from '../services/cashierApi';

function LivePosition() {
  const [cashFlow, setCashFlow] = useState({ openingBalance: 0, inflow: { total: 0, count: 0 }, outflow: { total: 0, count: 0 }, cashInflow: 0, cashOutflow: 0, currentBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({});

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function fetchData() {
      try {
        const res = await getTodaysCashFlow(dateRange);
        if (isMounted && res.success) {
          setCashFlow(res);
        }
      } catch (err) {
        console.error('Failed to fetch cash flow:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    // Fetch immediately, then poll so approvals (PR penalty, name change, new
    // connection, transfer voucher, etc.) reflect in the live position without
    // a manual refresh.
    fetchData();
    const intervalId = setInterval(fetchData, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [dateRange]);

  const { openingBalance, inflow, outflow, currentBalance } = cashFlow;
  const cashInflow = cashFlow.cashInflow ?? inflow.total;
  const cashOutflow = cashFlow.cashOutflow ?? outflow.total;
  const breakdown = cashFlow.breakdown ?? { cash: cashInflow, online: 0, bank: 0 };

  // Generate dummy hourly data for chart (in production, fetch from backend)
  const inflowPoints = [0, 8, 15, 22, 30, 35, 40, 45, 50, 58, 65, 72, inflow.total];
  const outflowPoints = [0, 2, 4, 6, 8, 12, 14, 16, 18, 22, 26, 30, outflow.total];
  const labels = ['9', '10', '11', '12', '1', '2', '3', '4', '5', '6', '7', '8', 'Now'];

  const maxValue = Math.max(...inflowPoints, ...outflowPoints, 1);

  const inflowPath = inflowPoints
    .map((value, index) => `${(index / (inflowPoints.length - 1)) * 100}% ${(100 - (value / maxValue) * 100)}%`)
    .join(',');
  const outflowPath = outflowPoints
    .map((value, index) => `${(index / (outflowPoints.length - 1)) * 100}% ${(100 - (value / maxValue) * 100)}%`)
    .join(',');

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="page-content">
        <Header dateRange={dateRange} onApplyRange={setDateRange} />
        <main className="page-main">
          {loading ? (
            <div className="loading-shell" style={{ minHeight: '400px' }}>Loading live position...</div>
          ) : (
            <>
              <section className="live-hero-card">
                <div className="live-hero-top">
              <span className="live-badge">LIVE · UPDATING EVERY SECOND</span>
              <span className="live-status">Healthy Range</span>
            </div>
            <div className="live-hero-body">
              <div>
                <p className="live-hero-label">Current Cash Balance</p>
                <h2 className="live-hero-value">₹{currentBalance.toLocaleString('en-IN')}</h2>
                <p className="live-hero-meta">Opening ₹{openingBalance.toLocaleString('en-IN')} + Cash In ₹{cashInflow.toLocaleString('en-IN')} – Cash Out ₹{cashOutflow.toLocaleString('en-IN')}</p>
              </div>
              <div className="live-hero-chip">
                <span className="live-chip-dot" />
                <span>All good</span>
              </div>
            </div>

            <div className="live-breakdown-row">
              <div className="live-breakdown-item">
                <span className="live-breakdown-label">Cash</span>
                <span className="live-breakdown-value">₹{Number(breakdown.cash || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="live-breakdown-item">
                <span className="live-breakdown-label">Online</span>
                <span className="live-breakdown-value">₹{Number(breakdown.online || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="live-breakdown-item">
                <span className="live-breakdown-label">Bank</span>
                <span className="live-breakdown-value">₹{Number(breakdown.bank || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </section>

          <section className="live-grid">
            <div className="chart-card live-chart-card">
              <div className="card-heading">
                <div>
                  <p className="section-label">Inflow vs Outflow</p>
                  <h2>Balance trend</h2>
                </div>
                <div className="legend-pill-row">
                  <span className="legend-pill">
                    <span className="legend-dot success" /> Inflow
                  </span>
                  <span className="legend-pill">
                    <span className="legend-dot danger" /> Outflow
                  </span>
                </div>
              </div>
              <div className="chart-visual live-chart-visual">
                <svg viewBox="0 0 600 240" className="chart-svg" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="inflowGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="outflowGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="4"
                    points={inflowPath}
                  />
                  <polyline
                    fill="none"
                    stroke="#f87171"
                    strokeWidth="4"
                    points={outflowPath}
                  />
                  <polygon
                    fill="url(#inflowGradient)"
                    points={`${inflowPath},100%,100% 0%,100%`}
                  />
                  <polygon
                    fill="url(#outflowGradient)"
                    points={`${outflowPath},100%,100% 0%,100%`}
                  />
                </svg>
                <div className="chart-axis live-chart-axis">
                  {labels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="live-summary-column">
              <div className="info-card info-card-green">
                <p className="info-label">Inflow</p>
                <h3>₹{inflow.total.toLocaleString('en-IN')}</h3>
                <p className="info-meta">{inflow.count} transactions today</p>
              </div>
              <div className="info-card info-card-red">
                <p className="info-label">Outflow</p>
                <h3>₹{outflow.total.toLocaleString('en-IN')}</h3>
                <p className="info-meta">{outflow.count} expenses approved</p>
              </div>
              {/* <div className="alert-card">
                <span className="alert-icon">⚠️</span>
                <div>
                  <p className="alert-title">Large transaction at 2:48 PM</p>
                  <p>₹48,000 from Hotel Greenview — verify before close.</p>
                </div>
              </div> */}
            </div>
          </section>
          </>
          )}
        </main>
      </div>
    </div>
  );
}

export default LivePosition;
