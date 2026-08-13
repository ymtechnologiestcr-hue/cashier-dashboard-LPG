import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useEffect, useMemo, useState } from 'react';
import {
  getCashOutExpenseRequests,
  getTodayOfficeExpenses,
  getTodaysCashFlow,
  recordOfficeExpense,
  reviewCashOutExpenseRequest,
  uploadSupportingDocument,
} from '../services/cashierApi';

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

// Resolve /uploads/... relative paths to a full URL using the same server as the API
const API_SERVER_ROOT = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api')
  .replace(/\/api$/, '');
const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_SERVER_ROOT}${url}`;
  return url;
};

const formatTimeAgo = (value) => {
  if (!value) {
    return 'Unknown time';
  }

  const target = new Date(value);
  const diffMs = Date.now() - target.getTime();

  if (Number.isNaN(diffMs) || diffMs < 0) {
    return target.toLocaleString('en-IN');
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${diffMinutes}m ago`;
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getInitials = (name) =>
  String(name || 'NA')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const formatOdometerRange = (startReading, endReading) => {
  const start = Number(startReading || 0);
  const end = Number(endReading || 0);

  if (start > 0 && end > 0) {
    return `Odomoter: ${start.toLocaleString('en-IN')} - ${end.toLocaleString('en-IN')}`;
  }

  if (start > 0) {
    return `Odomoter: ${start.toLocaleString('en-IN')} - -`;
  }

  return 'Odomoter: -';
};

// Local (not UTC) YYYY-MM-DD so the default range matches the cashier's calendar day.
function todayIso() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function CashOut() {
  const [dateRange, setDateRange] = useState(() => {
    const today = todayIso();
    return { startDate: today, endDate: today };
  });
  const [selectedCategory, setSelectedCategory] = useState('Utility');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [officePaymentMode, setOfficePaymentMode] = useState('CASH');
  const [officeTxnId, setOfficeTxnId] = useState('');
  const [officeError, setOfficeError] = useState('');
  const [todayExpenses, setTodayExpenses] = useState([]);
  const [availableCash, setAvailableCash] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [expenseRequests, setExpenseRequests] = useState([]);
  const [expenseSummary, setExpenseSummary] = useState({ pendingApprovals: 0, approvedToday: 0 });
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [payingExpense, setPayingExpense] = useState(null);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentTxnId, setPaymentTxnId] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [reviewingId, setReviewingId] = useState(null);

  const statsCards = useMemo(
    () => [
      {
        key: 'available-cash',
        label: 'Available Cash',
        value: availableCash === null ? '—' : formatCurrency(availableCash),
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
        ),
      },
      {
        key: 'pending',
        label: 'Pending Approvals',
        value: String(expenseSummary.pendingApprovals || 0),
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
        ),
      },
      {
        key: 'approved',
        label: 'Approved Today',
        value: formatCurrency(expenseSummary.approvedToday || 0),
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
        ),
      },
      // {
      //   key: 'avg-time',
      //   label: 'Avg Approved Time',
      //   value: expenseSummary.avgApprovedTime || '5s',
      //   icon: (
      //     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path></svg>
      //   ),
      // },
    ],
    [expenseSummary, availableCash]
  );

  const fetchOfficeExpenses = async () => {
    try {
      const res = await getTodayOfficeExpenses(dateRange);
      if (res.success) setTodayExpenses(res.data || []);
    } catch (err) {
      // ignore for now
    }
  };

  const fetchExpenseRequests = async () => {
    try {
      const res = await getCashOutExpenseRequests(dateRange);
      if (res.success) {
        setExpenseRequests(res.data || []);
        setExpenseSummary(res.summary || { pendingApprovals: 0, approvedToday: 0 });
      }
    } catch (err) {
      alert('Failed to fetch expense requests');
    }
  };

  const fetchAvailableCash = async () => {
    try {
      const res = await getTodaysCashFlow(dateRange);
      if (res.success) {
        setAvailableCash(Number(res.currentBalance || 0));
      }
    } catch (err) {
      // Non-blocking: enforcement still happens server-side on submit.
    }
  };

  useEffect(() => {
    fetchOfficeExpenses();
    fetchExpenseRequests();
    fetchAvailableCash();
  }, [dateRange]);

  const handleSelectCategory = (cat) => setSelectedCategory(cat);

  const handleSubmit = async () => {
    setOfficeError('');
    if (!selectedCategory || amount === '') return alert('Please enter category and amount');
    const numeric = Number(amount.toString().replace(/[^0-9.-]+/g, '')) || 0;

    const trimmedTxnId = officeTxnId.trim();
    if (officePaymentMode !== 'CASH' && !trimmedTxnId) {
      setOfficeError('Transaction ID is required for non-cash payments.');
      return;
    }

    if (officePaymentMode === 'CASH' && availableCash !== null && numeric > availableCash) {
      setOfficeError(
        `Insufficient cash balance. Available ${formatCurrency(availableCash)}, expense ${formatCurrency(numeric)}. Pay via UPI/Card/Bank Transfer instead.`
      );
      return;
    }

    setSubmitting(true);
    try {
      let billUrl = null;
      if (receiptFile) {
        const uploadRes = await uploadSupportingDocument(receiptFile);
        billUrl = uploadRes?.url || null;
      }

      await recordOfficeExpense({
        category: selectedCategory,
        amount: numeric,
        description,
        bill_url: billUrl,
        payment_mode: officePaymentMode,
        transaction_id: trimmedTxnId || null,
      });
      setAmount('');
      setDescription('');
      setReceiptFile(null);
      setOfficePaymentMode('CASH');
      setOfficeTxnId('');
      await fetchOfficeExpenses();
      await fetchAvailableCash();
    } catch (err) {
      setOfficeError(err?.message || 'Failed to submit expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpenseReview = async (expenseId, status, paymentDetails = {}) => {
    setReviewingId(expenseId);
    setPaymentError('');
    try {
      await reviewCashOutExpenseRequest(expenseId, status, paymentDetails);
      if (selectedExpense?.id === expenseId) {
        setSelectedExpense(null);
      }
      if (payingExpense?.id === expenseId) {
        setPayingExpense(null);
      }
      await fetchExpenseRequests();
      await fetchAvailableCash();
    } catch (err) {
      const message = err?.message || `Failed to ${status === 'APPROVED' ? 'approve' : 'reject'} expense`;
      // Keep the payment modal open so the cashier can switch mode / fix the amount.
      if (payingExpense?.id === expenseId) {
        setPaymentError(message);
      } else {
        alert(message);
      }
    } finally {
      setReviewingId(null);
    }
  };

  const openApprovePaymentModal = (expense) => {
    setPaymentError('');
    setPaymentMode('UPI');
    setPaymentTxnId('');
    setPayingExpense(expense);
  };

  const closeApprovePaymentModal = () => {
    if (payingExpense && reviewingId === payingExpense.id) {
      return;
    }
    setPayingExpense(null);
    setPaymentError('');
  };

  const handleApproveAndPay = async () => {
    if (!payingExpense) {
      return;
    }

    setPaymentError('');
    const trimmedTxnId = paymentTxnId.trim();

    if (paymentMode !== 'CASH' && !trimmedTxnId) {
      setPaymentError('Transaction ID is required for non-cash payments.');
      return;
    }

    if (
      paymentMode === 'CASH' &&
      availableCash !== null &&
      Number(payingExpense.amount || 0) > availableCash
    ) {
      setPaymentError(
        `Insufficient cash balance. Available ${formatCurrency(availableCash)}, expense ${formatCurrency(payingExpense.amount)}. Pay via UPI/Card/Bank Transfer instead.`
      );
      return;
    }

    await handleExpenseReview(payingExpense.id, 'APPROVED', {
      paymentMode,
      transactionId: trimmedTxnId,
    });
  };

  const categories = ['Salary', 'Utility', 'Repair', 'Stationery', 'Travel', 'Other'];

  const expenseImages = selectedExpense?.billUrl
    ? [{ label: 'Bill Photo', url: resolveImageUrl(selectedExpense.billUrl) }]
    : [];

  const odometerImages = [
    selectedExpense?.startOdometerImageUrl
      ? { label: 'Start Odometer', url: resolveImageUrl(selectedExpense.startOdometerImageUrl) }
      : null,
    selectedExpense?.endOdometerImageUrl
      ? { label: 'End Odometer', url: resolveImageUrl(selectedExpense.endOdometerImageUrl) }
      : null,
  ].filter(Boolean);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="page-content">
        <Header dateRange={dateRange} onApplyRange={setDateRange} />
        <main className="page-main">

          <div className="cash-out-grid">
            <div className="stats-row">
              {statsCards.map((stat) => (
                <div key={stat.key} className="stat-card">
                  <div className={`stat-icon ${stat.key}`}>{stat.icon}</div>
                  <p className="stat-label">{stat.label}</p>
                  <p className="stat-value">{stat.value}</p>
                </div>
              ))}
            </div>

            <section className="expense-section">
              <h2>Driver Expense Requests</h2>
              <p>Quick approve — average review time 5 seconds</p>

              <div className="expense-list">
                {expenseRequests.length ? (
                  expenseRequests.map((expense) => (
                    <div key={expense.id} className="expense-item">
                      <div className="expense-left">
                        <div className="expense-avatar">{getInitials(expense.createdByName)}</div>
                        <div className="expense-details">
                          <strong>{expense.createdByName}</strong>
                          <p>{expense.category} · {formatTimeAgo(expense.createdAt)}</p>
                          <p>{formatOdometerRange(expense.startOdometerReading, expense.endOdometerReading)}</p>
                        </div>
                      </div>
                      <div className="expense-right">
                        <span className="expense-amount">{formatCurrency(expense.amount)}</span>
                        <button className="icon-btn" onClick={() => setSelectedExpense(expense)}>👁</button>
                        <button
                          className="approve-pay-btn"
                          disabled={reviewingId === expense.id}
                          onClick={() => openApprovePaymentModal(expense)}
                        >
                          {reviewingId === expense.id ? 'Processing...' : '✓ Approve & Pay'}
                        </button>
                        <button
                          className="reject-btn"
                          disabled={reviewingId === expense.id}
                          onClick={() => handleExpenseReview(expense.id, 'REJECTED')}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="expense-item expense-item-empty">No pending expense requests</div>
                )}
              </div>
            </section>

            <div className="expense-entry-grid">
              <section className="expense-entry">
                <h2>Office Expense Entry</h2>
                <p>Add operational expenses</p>

                <form className="office-expense-form">
                  <div className="form-group">
                    <label>Category</label>
                    <div className="category-buttons">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          className={`cat-btn ${selectedCategory === cat ? 'active' : ''}`}
                          onClick={() => handleSelectCategory(cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Amount</label>
                    <input value={amount} onChange={(e) => setAmount(e.target.value)} type="text" placeholder="₹ 0" />
                  </div>

                  <div className="form-field">
                    <label>Description</label>
                    <input value={description} onChange={(e) => setDescription(e.target.value)} type="text" placeholder="What is this for?" />
                  </div>

                  <div className="form-group">
                    <label>Payment Mode</label>
                    <div className="category-buttons">
                      {[
                        { value: 'CASH', label: 'Cash' },
                        { value: 'UPI', label: 'UPI' },
                        { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                        { value: 'CARD', label: 'Card' },
                      ].map((mode) => (
                        <button
                          key={mode.value}
                          type="button"
                          className={`cat-btn ${officePaymentMode === mode.value ? 'active' : ''}`}
                          onClick={() => {
                            setOfficePaymentMode(mode.value);
                            setOfficeError('');
                          }}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-field">
                    <label>
                      {officePaymentMode === 'CASH' ? 'Transaction ID (optional)' : 'Transaction ID'}
                    </label>
                    <input
                      value={officeTxnId}
                      onChange={(e) => setOfficeTxnId(e.target.value)}
                      type="text"
                      placeholder={officePaymentMode === 'CASH' ? 'Optional reference' : 'Enter transaction ID'}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Upload Receipt</label>
                      <input
                        id="receipt-file-upload"
                        type="file"
                        accept="image/*,.pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      />
                      <label htmlFor="receipt-file-upload" className="file-upload-small" style={{ cursor: 'pointer' }}>
                        <p>⬇ {receiptFile ? receiptFile.name : 'Upload Receipt'}</p>
                      </label>
                    </div>
                  </div>

                  {officeError ? <p className="cashout-payment-error">{officeError}</p> : null}

                  <button type="button" disabled={submitting} onClick={handleSubmit} className="submit-expense-btn">{submitting ? 'Submitting...' : 'Submit Expense'}</button>
                </form>
              </section>

              <section className="recent-expenses">
                <h2>Recent Office Expenses</h2>
                <p className="section-date">Today</p>

                <div className="expense-category-list">
                  {todayExpenses.length ? (
                    todayExpenses.map((expense) => (
                      <div key={expense.id} className="expense-category-item">
                        <div className="category-label">{expense.category}</div>
                        <p className="expense-item-name">
                          {expense.description || '-'}
                          {expense.paymentMode ? ` · ${expense.paymentMode.replace('_', ' ')}` : ''}
                        </p>
                        <span className="expense-item-amount">₹{Number(expense.amount).toLocaleString('en-IN')}</span>
                      </div>
                    ))
                  ) : (
                    <div className="expense-category-item">No expenses recorded today</div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {selectedExpense ? (
        <div className="cashout-modal-backdrop" onClick={() => setSelectedExpense(null)}>
          <div className="cashout-modal" onClick={(event) => event.stopPropagation()}>
            <div className="cashout-modal-header">
              <div>
                <h3>{selectedExpense.createdByName}</h3>
                <p>{selectedExpense.category} · {formatCurrency(selectedExpense.amount)}</p>
              </div>
              <button className="icon-btn" onClick={() => setSelectedExpense(null)}>×</button>
            </div>

            <div className="cashout-modal-sections">
              <section className="cashout-modal-section">
                <h4>Expense Images</h4>
                {expenseImages.length ? (
                  <div className="cashout-modal-grid">
                    {expenseImages.map((item) => (
                      <div key={item.label} className="cashout-photo-card">
                        <p>{item.label}</p>
                        <img src={item.url} alt={item.label} className="cashout-photo" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="cashout-photo-empty">No expense bill image</div>
                )}
              </section>

              <section className="cashout-modal-section">
                <h4>Odometer Images</h4>
                {odometerImages.length ? (
                  <div className="cashout-modal-grid">
                    {odometerImages.map((item) => (
                      <div key={item.label} className="cashout-photo-card">
                        <p>{item.label}</p>
                        <img src={item.url} alt={item.label} className="cashout-photo" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="cashout-photo-empty">No odometer images</div>
                )}
              </section>
            </div>

            <div className="cashout-modal-footer">
              <button
                className="reject-btn"
                disabled={reviewingId === selectedExpense.id}
                onClick={() => handleExpenseReview(selectedExpense.id, 'REJECTED')}
              >
                Reject
              </button>
              <button
                className="approve-pay-btn"
                disabled={reviewingId === selectedExpense.id}
                onClick={() => openApprovePaymentModal(selectedExpense)}
              >
                {reviewingId === selectedExpense.id ? 'Processing...' : 'Approve & Pay'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {payingExpense ? (
        <div className="cashout-payment-backdrop" onClick={closeApprovePaymentModal}>
          <div className="cashout-payment-modal" onClick={(event) => event.stopPropagation()}>
            <div className="cashout-payment-header">
              <p className="cashout-payment-kicker">Secure Payment Gateway</p>
              <button className="icon-btn" onClick={closeApprovePaymentModal}>×</button>
            </div>

            <div className="cashout-payment-hero">
              <p>Paying to</p>
              <strong>{payingExpense.createdByName}</strong>
              <span>{payingExpense.category}</span>
              <h3>{formatCurrency(payingExpense.amount)}</h3>
            </div>

            <div className="cashout-payment-body">
              {availableCash !== null ? (
                <p className="cashout-payment-balance">Available cash: {formatCurrency(availableCash)}</p>
              ) : null}
              <label className="cashout-payment-label">Select payment method</label>
              <div className="cashout-payment-methods">
                {[
                  { value: 'UPI', label: 'UPI' },
                  { value: 'CARD', label: 'Card' },
                  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                  { value: 'CASH', label: 'Cash' },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    className={`cashout-method-btn ${paymentMode === method.value ? 'active' : ''}`}
                    onClick={() => setPaymentMode(method.value)}
                  >
                    {method.label}
                  </button>
                ))}
              </div>

              <label className="cashout-payment-label">
                {paymentMode === 'UPI' ? 'UPI ID / Transaction ID' : paymentMode === 'BANK_TRANSFER' ? 'Bank Transfer ID / UTR' : paymentMode === 'CARD' ? 'Card Transaction ID' : 'Reference (optional for cash)'}
              </label>
              <input
                type="text"
                className="cashout-payment-input"
                value={paymentTxnId}
                onChange={(event) => setPaymentTxnId(event.target.value)}
                placeholder={paymentMode === 'CASH' ? 'Optional reference' : 'Enter transaction ID'}
              />

              {paymentError ? <p className="cashout-payment-error">{paymentError}</p> : null}

              <button
                type="button"
                className="cashout-pay-confirm-btn"
                disabled={reviewingId === payingExpense.id}
                onClick={handleApproveAndPay}
              >
                {reviewingId === payingExpense.id ? 'Processing...' : `Pay ${formatCurrency(payingExpense.amount)}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CashOut;
