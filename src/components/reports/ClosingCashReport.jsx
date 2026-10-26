import { useState, useEffect, useMemo } from 'react';
import { getClosingCashReport, submitClosingCashReport } from '../../services/cashierApi';
import { exportToExcel, exportToPdf } from '../../utils/reportExportUtils';
import { toast } from 'sonner';

const defaultDenominations = [
  { label: '₹500', value: 500, count: 0 },
  { label: '₹200', value: 200, count: 0 },
  { label: '₹100', value: 100, count: 0 },
  { label: '₹50', value: 50, count: 0 },
  { label: '₹20', value: 20, count: 0 },
  { label: '₹10', value: 10, count: 0 },
  { label: '₹5', value: 5, count: 0 },
  { label: '₹2', value: 2, count: 0 },
  { label: '₹1', value: 1, count: 0 },
];

export default function ClosingCashReport() {
  const getTodayStr = () => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  };

  const todayStr = getTodayStr();

  const [closingDate, setClosingDate] = useState(todayStr);
  const [denominations, setDenominations] = useState(defaultDenominations);
  const [systemSummary, setSystemSummary] = useState({
    openingCashBalance: 0,
    totalCashIn: 0,
    totalCashOut: 0,
    systemClosingCashBalance: 0,
  });
  const [remarks, setRemarks] = useState('');
  const [cashierName, setCashierName] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('cashier_auth_user') || '{}');
      return u.name || 'Kiran Cashier';
    } catch {
      return 'Kiran Cashier';
    }
  });
  const [disposition, setDisposition] = useState('Hand over to Owner');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  const fetchClosingData = async (date) => {
    try {
      setLoading(true);
      const res = await getClosingCashReport({ date });
      if (res?.success) {
        if (res.systemClosingSummary) {
          setSystemSummary(res.systemClosingSummary);
        }
        if (res.standardDenominations && res.standardDenominations.length) {
          setDenominations(res.standardDenominations);
        } else {
          setDenominations(defaultDenominations);
        }
        if (res.closingHistory) {
          setHistory(res.closingHistory);
        }
        if (res.existingClosing) {
          setRemarks(res.existingClosing.differenceReason || res.existingClosing.note || '');
          if (res.existingClosing.cashierName) setCashierName(res.existingClosing.cashierName);
        } else {
          setRemarks('');
        }
      }
    } catch (err) {
      console.error('Fetch closing cash report error:', err);
      toast.error('Failed to load closing cash data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClosingData(closingDate);
  }, [closingDate]);

  // Denominations live calculation
  const totalPhysicalCash = useMemo(() => {
    return denominations.reduce((sum, d) => sum + d.value * (Number(d.count) || 0), 0);
  }, [denominations]);

  const systemClosingCash = systemSummary.systemClosingCashBalance;
  const cashDifference = Math.round((totalPhysicalCash - systemClosingCash) * 100) / 100;

  const handleCountChange = (index, value) => {
    const parsed = parseInt(value, 10);
    const count = Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setDenominations((prev) =>
      prev.map((d, i) => (i === index ? { ...d, count, subtotal: count * d.value } : d))
    );
  };

  const handleQuickAdd = (index, delta) => {
    setDenominations((prev) =>
      prev.map((d, i) => {
        if (i === index) {
          const newCount = Math.max(0, (Number(d.count) || 0) + delta);
          return { ...d, count: newCount, subtotal: newCount * d.value };
        }
        return d;
      })
    );
  };

  const handleSubmitClosing = async () => {
    if (cashDifference !== 0 && !remarks.trim()) {
      toast.error('Please enter remarks/reason explaining the cash difference.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        closingDate,
        denominations: denominations.map((d) => ({
          label: d.label,
          value: d.value,
          count: Number(d.count) || 0,
          subtotal: (Number(d.count) || 0) * d.value,
        })),
        totalPhysicalCash,
        systemClosingCash,
        cashDifference,
        differenceReason: remarks.trim(),
        reasonDisposition: disposition,
        cashierName,
      };

      const res = await submitClosingCashReport(payload);
      if (res?.success) {
        toast.success(res.message || 'Closing Cash Report submitted successfully');
        fetchClosingData(closingDate);
      }
    } catch (err) {
      console.error('Submit closing report error:', err);
      toast.error('Failed to submit closing report');
    } finally {
      setSubmitting(false);
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    try {
      // Sheet 1: Cash Denomination
      const denomHeaders = ['Currency Denomination', 'Number of Notes / Coins', 'Total Amount (₹)'];
      const denomRows = denominations.map((d) => [
        d.label,
        Number(d.count) || 0,
        ((Number(d.count) || 0) * d.value).toFixed(2),
      ]);
      const denomTotals = ['Total Physical Cash', '', totalPhysicalCash.toFixed(2)];

      // Sheet 2: Closing Cash Reconciliation
      const reconHeaders = ['Particulars', 'Amount (₹)'];
      const reconRows = [
        ['Opening Cash Balance', systemSummary.openingCashBalance.toFixed(2)],
        ['Add: Total Cash In', systemSummary.totalCashIn.toFixed(2)],
        ['Less: Total Cash Out', systemSummary.totalCashOut.toFixed(2)],
        ['System Closing Cash Balance', systemSummary.systemClosingCashBalance.toFixed(2)],
        ['Actual Physical Cash (from denomination)', totalPhysicalCash.toFixed(2)],
        ['Cash Difference (Physical - System)', cashDifference.toFixed(2)],
        ['Status', cashDifference === 0 ? 'Balanced' : cashDifference > 0 ? 'Excess' : 'Shortage'],
        ['Cashier Name', cashierName],
        ['Remarks / Notes', remarks || 'None'],
        ['Disposition', disposition],
      ];

      // Sheet 3: Closing History
      const histHeaders = ['Date', 'Time', 'Cashier', 'Physical Cash (₹)', 'System Cash (₹)', 'Difference (₹)', 'Status', 'Remarks'];
      const histRows = history.map((h) => [
        h.date,
        h.time,
        h.cashierName,
        h.physicalCash.toFixed(2),
        h.systemCash.toFixed(2),
        h.difference.toFixed(2),
        h.difference === 0 ? 'Balanced' : h.difference > 0 ? 'Excess' : 'Shortage',
        h.remarks,
      ]);

      const sheets = [
        { sheetName: 'Denomination Counter', headers: denomHeaders, data: denomRows, totals: denomTotals },
        { sheetName: 'Cash Reconciliation', headers: reconHeaders, data: reconRows },
        { sheetName: 'Date-wise Closing History', headers: histHeaders, data: histRows },
      ];

      const filename = `Closing_Cash_Report_${closingDate}.xlsx`;
      exportToExcel({ filename, sheets });
      toast.success('Closing Cash Report exported to Excel');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Excel');
    }
  };

  // PDF Export
  const handleExportPdf = () => {
    try {
      const denomHeaders = ['Denomination', 'Count (Notes/Coins)', 'Total Amount (₹)'];
      const denomData = denominations.map((d) => [
        d.label,
        String(Number(d.count) || 0),
        `₹ ${((Number(d.count) || 0) * d.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      ]);
      const denomTotals = [
        'Total Physical Cash',
        '',
        `₹ ${totalPhysicalCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      ];

      exportToPdf({
        filename: `Closing_Cash_Report_${closingDate}.pdf`,
        title: 'Closing Cash Report with Denomination',
        subtitle: `Cashier: ${cashierName} | Physical: ₹${totalPhysicalCash.toFixed(2)} | System: ₹${systemClosingCash.toFixed(2)} | Diff: ₹${cashDifference.toFixed(2)}`,
        dateRange: `Closing Date: ${closingDate}`,
        headers: denomHeaders,
        data: denomData,
        totals: denomTotals,
        orientation: 'portrait',
        notes: `Reconciliation: Opening ₹${systemSummary.openingCashBalance} + Cash In ₹${systemSummary.totalCashIn} - Cash Out ₹${systemSummary.totalCashOut} = System ₹${systemSummary.systemClosingCashBalance}. Difference: ₹${cashDifference} (${remarks || 'Balanced'}).`,
      });

      toast.success('Closing Cash Report exported to PDF');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF');
    }
  };

  return (
    <div className="report-submodule">
      {/* Header */}
      <div className="report-module-header">
        <div>
          <h2 className="report-module-title">Closing Cash Report with Denomination</h2>
          <p className="report-module-desc">
            Count currency denominations, calculate physical cash, and reconcile against system closing cash balance.
          </p>
        </div>
        <div className="report-header-actions">
          <button type="button" className="btn-export-excel" onClick={handleExportExcel}>
            <span className="export-icon">📊</span> Export Excel
          </button>
          <button type="button" className="btn-export-pdf" onClick={handleExportPdf}>
            <span className="export-icon">📄</span> Export PDF
          </button>
        </div>
      </div>

      {/* Date & Cashier Selection Bar */}
      <div className="closing-config-bar">
        <div className="config-field">
          <label>Closing Date</label>
          <input
            type="date"
            value={closingDate}
            onChange={(e) => setClosingDate(e.target.value)}
          />
        </div>

        <div className="config-field">
          <label>Cashier Name</label>
          <input
            type="text"
            value={cashierName}
            onChange={(e) => setCashierName(e.target.value)}
            placeholder="Cashier Name"
          />
        </div>

        <div className="config-field">
          <label>Cash Disposition</label>
          <select value={disposition} onChange={(e) => setDisposition(e.target.value)}>
            <option value="Hand over to Owner">Hand over to Owner</option>
            <option value="Deposit in Bank">Deposit in Bank</option>
            <option value="Retain in Safe">Retain in Safe</option>
          </select>
        </div>
      </div>

      {/* Main 2-Column Work Area */}
      <div className="closing-work-area-grid">
        {/* Left Column: Denomination Counter Table */}
        <div className="denomination-panel-card">
          <div className="panel-card-header">
            <div>
              <h3>💵 Currency Denomination Counter</h3>
              <p>Enter the number of notes/coins for each denomination</p>
            </div>
            <div className="denom-total-badge">
              <span>Physical Cash:</span>
              <strong>₹{totalPhysicalCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>

          <div className="table-wrapper-compact">
            <table className="denomination-table">
              <thead>
                <tr>
                  <th>Denomination</th>
                  <th style={{ width: '180px' }}>Number of Notes / Coins</th>
                  <th className="text-right">Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {denominations.map((d, idx) => {
                  const subtotal = (Number(d.count) || 0) * d.value;
                  return (
                    <tr key={d.label}>
                      <td>
                        <span className="denom-pill">{d.label}</span>
                      </td>
                      <td>
                        <div className="counter-input-box">
                          <button
                            type="button"
                            className="counter-btn"
                            onClick={() => handleQuickAdd(idx, -1)}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            className="denom-number-input"
                            value={d.count === 0 ? '' : d.count}
                            onChange={(e) => handleCountChange(idx, e.target.value)}
                            placeholder="0"
                          />
                          <button
                            type="button"
                            className="counter-btn"
                            onClick={() => handleQuickAdd(idx, 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="text-right font-mono font-semibold">
                        ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="report-totals-row">
                  <td colSpan="2" className="font-bold">Total Physical Cash</td>
                  <td className="text-right font-mono font-extrabold text-xl text-primary">
                    ₹{totalPhysicalCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Right Column: Closing Cash Reconciliation & Submission Card */}
        <div className="reconciliation-panel-card">
          <div className="panel-card-header">
            <div>
              <h3>⚖️ Closing Cash Reconciliation</h3>
              <p>Compares physical cash counted against system closing cash</p>
            </div>
          </div>

          <div className="reconciliation-breakdown">
            <div className="recon-row">
              <span className="recon-label">Opening Cash Balance</span>
              <span className="recon-val font-mono">
                ₹{systemSummary.openingCashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="recon-row recon-add">
              <span className="recon-label">Add: Total Cash In</span>
              <span className="recon-val font-mono text-accent">
                + ₹{systemSummary.totalCashIn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="recon-row recon-subtract">
              <span className="recon-label">Less: Total Cash Out</span>
              <span className="recon-val font-mono text-danger">
                - ₹{systemSummary.totalCashOut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="recon-divider"></div>

            <div className="recon-row recon-system-highlight">
              <span className="recon-label">System Closing Cash Balance</span>
              <span className="recon-val font-mono font-bold">
                ₹{systemClosingCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="recon-row recon-physical-highlight">
              <span className="recon-label">Actual Physical Cash (Denominations)</span>
              <span className="recon-val font-mono font-bold text-primary">
                ₹{totalPhysicalCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Difference Callout Banner */}
            <div
              className={`difference-card ${
                cashDifference === 0
                  ? 'diff-balanced'
                  : cashDifference > 0
                  ? 'diff-excess'
                  : 'diff-shortage'
              }`}
            >
              <div className="diff-header">
                <span className="diff-title">Cash Difference:</span>
                <span className="diff-amount font-mono">
                  {cashDifference === 0
                    ? '₹0.00 (Balanced)'
                    : cashDifference > 0
                    ? `+₹${cashDifference.toFixed(2)} (Excess)`
                    : `-₹${Math.abs(cashDifference).toFixed(2)} (Shortage)`}
                </span>
              </div>
              <p className="diff-note">
                {cashDifference === 0
                  ? 'Physical cash matches system closing balance perfectly.'
                  : cashDifference > 0
                  ? 'Cash in drawer exceeds system calculation. Please note down reason.'
                  : 'Cash in drawer is less than system calculation. Shortage explanation required.'}
              </p>
            </div>

            {/* Remarks / Explanation */}
            <div className="form-field-full">
              <label>Remarks / Difference Explanation {cashDifference !== 0 && <span className="text-danger">*</span>}</label>
              <textarea
                rows="2"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={cashDifference === 0 ? 'Optional closing notes or audit remarks...' : 'Explain the shortage or excess reason before submitting...'}
              />
            </div>

            {/* Submit Closing Report Button */}
            <button
              type="button"
              className="btn-submit-closing"
              onClick={handleSubmitClosing}
              disabled={submitting || (cashDifference !== 0 && !remarks.trim())}
            >
              {submitting ? 'Submitting Report...' : '✓ Submit & Audit Closing Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Date-wise Closing History Section */}
      <div className="closing-history-section">
        <div className="history-header">
          <div>
            <h3 className="history-title">📅 Date-wise Closing History & Verification Log</h3>
            <p className="history-subtitle">Past verified daily closing records with denomination breakdowns</p>
          </div>
        </div>

        <div className="report-table-wrapper">
          {history.length === 0 ? (
            <div className="report-empty-state">No previous closing records found.</div>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Closing Date</th>
                  <th>Time</th>
                  <th>Cashier</th>
                  <th className="text-right">Physical Cash</th>
                  <th className="text-right">System Cash</th>
                  <th className="text-right">Difference</th>
                  <th>Status</th>
                  <th>Disposition</th>
                  <th>Remarks</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={`hist-${item.id}`}>
                    <td className="font-semibold">{item.date}</td>
                    <td className="text-muted">{item.time}</td>
                    <td>{item.cashierName}</td>
                    <td className="text-right font-mono font-bold text-primary">₹{item.physicalCash.toFixed(2)}</td>
                    <td className="text-right font-mono">₹{item.systemCash.toFixed(2)}</td>
                    <td
                      className={`text-right font-mono font-semibold ${
                        item.difference === 0 ? 'text-accent' : item.difference > 0 ? 'text-amber' : 'text-danger'
                      }`}
                    >
                      {item.difference > 0 ? `+₹${item.difference.toFixed(2)}` : `₹${item.difference.toFixed(2)}`}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          item.difference === 0 ? 'badge-cash' : item.difference > 0 ? 'badge-commercial' : 'badge-rejected'
                        }`}
                      >
                        {item.difference === 0 ? 'Balanced' : item.difference > 0 ? 'Excess' : 'Shortage'}
                      </span>
                    </td>
                    <td>{item.disposition}</td>
                    <td className="text-muted text-sm">{item.remarks}</td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn-view-denom"
                        onClick={() => setSelectedHistoryItem(item)}
                      >
                        View Notes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: View Denominations Breakdown for a History Row */}
      {selectedHistoryItem && (
        <div className="modal-backdrop" onClick={() => setSelectedHistoryItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Closing Denominations - {selectedHistoryItem.date}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedHistoryItem(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-summary-grid">
                <div>
                  <span className="text-muted">Cashier:</span> <strong>{selectedHistoryItem.cashierName}</strong>
                </div>
                <div>
                  <span className="text-muted">Physical Total:</span>{' '}
                  <strong className="text-primary font-mono">₹{selectedHistoryItem.physicalCash.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-muted">System Total:</span>{' '}
                  <strong className="font-mono">₹{selectedHistoryItem.systemCash.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-muted">Difference:</span>{' '}
                  <strong className="font-mono">₹{selectedHistoryItem.difference.toFixed(2)}</strong>
                </div>
              </div>

              <table className="modal-table">
                <thead>
                  <tr>
                    <th>Denomination</th>
                    <th className="text-right">Count</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedHistoryItem.denominations && selectedHistoryItem.denominations.length ? (
                    selectedHistoryItem.denominations.map((d, i) => (
                      <tr key={i}>
                        <td className="font-semibold">{d.label}</td>
                        <td className="text-right font-mono">{d.count}</td>
                        <td className="text-right font-mono font-semibold">₹{(d.subtotal || d.value * d.count || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center text-muted">No denomination counts recorded</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {selectedHistoryItem.remarks && selectedHistoryItem.remarks !== '-' && (
                <div className="modal-remarks-box">
                  <strong>Remarks:</strong> {selectedHistoryItem.remarks}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="primary-button"
                onClick={() => setSelectedHistoryItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
