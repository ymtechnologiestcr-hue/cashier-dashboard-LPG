import React, { useState } from 'react';

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

function PaymentGatewayModal({ payingExpense, availableCash, onClose, onConfirm, reviewing }) {
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentTxnId, setPaymentTxnId] = useState('');
  const [paymentError, setPaymentError] = useState('');

  if (!payingExpense) return null;

  const handlePay = () => {
    setPaymentError('');
    const trimmedTxnId = paymentTxnId.trim();

    if (paymentMode !== 'CASH' && !trimmedTxnId) {
      setPaymentError('Transaction ID is required for non-cash payments.');
      return;
    }

    // `payingExpense.amount` might be a formatted string or a number
    const numericAmount = typeof payingExpense.amount === 'string' 
      ? Number(payingExpense.amount.replace(/[^0-9.-]+/g, '')) 
      : Number(payingExpense.amount || 0);

    if (
      paymentMode === 'CASH' &&
      availableCash !== null &&
      numericAmount > availableCash
    ) {
      setPaymentError(
        `Insufficient cash balance. Available ${formatCurrency(availableCash)}, expense ${formatCurrency(numericAmount)}. Pay via UPI/Card/Bank Transfer instead.`
      );
      return;
    }

    onConfirm({
      paymentMode,
      transactionId: trimmedTxnId,
    });
  };

  return (
    <div className="cashout-payment-backdrop" onClick={onClose}>
      <div className="cashout-payment-modal" onClick={(event) => event.stopPropagation()}>
        <div className="cashout-payment-header">
          <p className="cashout-payment-kicker">Secure Payment Gateway</p>
          <button className="icon-btn" onClick={onClose}>×</button>
        </div>

        <div className="cashout-payment-hero">
          <p>Paying to</p>
          <strong>{payingExpense.createdByName || payingExpense.label || 'Unknown'}</strong>
          <span>{payingExpense.category}</span>
          <h3>{typeof payingExpense.amount === 'string' && payingExpense.amount.startsWith('₹') ? payingExpense.amount : formatCurrency(payingExpense.amount)}</h3>
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
            disabled={reviewing}
            onClick={handlePay}
          >
            {reviewing ? 'Processing...' : `Pay ${typeof payingExpense.amount === 'string' && payingExpense.amount.startsWith('₹') ? payingExpense.amount : formatCurrency(payingExpense.amount)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentGatewayModal;
