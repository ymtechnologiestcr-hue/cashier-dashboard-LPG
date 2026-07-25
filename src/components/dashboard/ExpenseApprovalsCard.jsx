import React, { useState } from 'react';
import PaymentGatewayModal from './PaymentGatewayModal';
import { reviewCashOutExpenseRequest } from '../../services/cashierApi';

function ExpenseApprovalsCard({ approvals, onSuccess, availableCash = null }) {
  const [payingExpense, setPayingExpense] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);

  const handleReview = async (expenseId, status, paymentDetails = {}) => {
    setReviewingId(expenseId);
    try {
      await reviewCashOutExpenseRequest(expenseId, status, paymentDetails);
      if (payingExpense && payingExpense.id === expenseId) {
        setPayingExpense(null);
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      alert(err?.message || `Failed to ${status === 'APPROVED' ? 'approve' : 'reject'} expense`);
    } finally {
      setReviewingId(null);
    }
  };

  const handleConfirmPayment = (paymentDetails) => {
    if (payingExpense) {
      handleReview(payingExpense.id, 'APPROVED', paymentDetails);
    }
  };

  return (
    <section className="summary-card">
      <div className="card-heading summary-heading-block">
        <div>
          <p className="summary-title">Expense Approvals</p>
          <h2 className="summary-subtitle">Awaiting your review</h2>
        </div>
        <a href="#" className="view-link">View all →</a>
      </div>
      <div className="approvals-list">
        {approvals.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '13px' }}>No pending approvals</p>
        ) : (
          approvals.map((item) => (
            <div key={item.id || item.label} className="approval-card">
              <div className="approval-top-row">
                <p className="approval-name" style={{ color: "black" }}>{item.label}</p>
                <p className="expense-amount approval-amount">{item.amount}</p>
              </div>
              <p className="approval-meta">{item.category} · {item.time}</p>
              <div className="approval-button-row">
                <button
                  className="approve-button"
                  disabled={reviewingId === item.id}
                  onClick={() => setPayingExpense(item)}
                >
                  {reviewingId === item.id && payingExpense?.id === item.id ? 'Processing...' : 'Approve'}
                </button>
                <button
                  className="reject-button"
                  disabled={reviewingId === item.id}
                  onClick={() => handleReview(item.id, 'REJECTED')}
                >
                  {reviewingId === item.id && (!payingExpense || payingExpense.id !== item.id) ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <PaymentGatewayModal
        payingExpense={payingExpense}
        availableCash={availableCash}
        onClose={() => setPayingExpense(null)}
        onConfirm={handleConfirmPayment}
        reviewing={reviewingId === payingExpense?.id}
      />
    </section>
  );
}

export default ExpenseApprovalsCard;
