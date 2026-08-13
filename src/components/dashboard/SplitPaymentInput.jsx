import { useMemo } from 'react';

export const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
];

export const createPaymentRow = (mode = 'CASH') => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  mode,
  amount: '',
  transactionId: '',
});

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString('en-IN');
}

function SplitPaymentInput({
  totalAmount = 0,
  payments,
  onChange,
  mode,
  onModeChange,
  label = 'Payment Mode',
}) {
  const splitTotal = useMemo(
    () => payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [payments]
  );
  const isBalanced = Math.round(splitTotal * 100) === Math.round(Number(totalAmount || 0) * 100);

  const isSplit = mode === 'SPLIT';

  const updatePayment = (id, field, value) => {
    onChange(
      payments.map((payment) =>
        payment.id === id ? { ...payment, [field]: value } : payment
      )
    );
  };

  const handleModeChange = (nextMode) => {
    onModeChange(nextMode);
    if (nextMode === 'SINGLE') {
      onChange([payments[0] ? { ...payments[0] } : createPaymentRow()]);
    } else if (payments.length < 2) {
      onChange([
        payments[0] ? { ...payments[0] } : createPaymentRow('CASH'),
        createPaymentRow('UPI'),
      ]);
    }
  };

  const addPayment = () => {
    onChange([...payments, createPaymentRow('UPI')]);
  };

  const removePayment = (id) => {
    if (!isSplit || payments.length <= 2) {
      return;
    }
    onChange(payments.filter((payment) => payment.id !== id));
  };

  return (
    <div className="split-payment-card">
      <div className="split-payment-header">
        <label>{label}</label>
        <div className="split-payment-toggle" role="tablist" aria-label="Payment mode type">
          <button
            type="button"
            className={mode === 'SINGLE' ? 'active' : ''}
            onClick={() => handleModeChange('SINGLE')}
          >
            Single
          </button>
          <button
            type="button"
            className={mode === 'SPLIT' ? 'active' : ''}
            onClick={() => handleModeChange('SPLIT')}
          >
            Split
          </button>
        </div>
      </div>

      <div className="split-payment-rows">
        {payments.map((payment) => {
          const needsReference = payment.mode !== 'CASH';

          return (
            <div className="split-payment-row" key={payment.id}>
              <select
                value={payment.mode}
                onChange={(event) => updatePayment(payment.id, 'mode', event.target.value)}
              >
                {PAYMENT_MODES.map((paymentMode) => (
                  <option key={paymentMode.value} value={paymentMode.value}>
                    {paymentMode.label}
                  </option>
                ))}
              </select>
              <div className="split-payment-amount">
                <span>&#8377;</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={payment.amount}
                  onChange={(event) => updatePayment(payment.id, 'amount', event.target.value)}
                  placeholder="0"
                />
              </div>
              <input
                type="text"
                value={payment.transactionId}
                onChange={(event) => updatePayment(payment.id, 'transactionId', event.target.value)}
                placeholder={needsReference ? 'UTR / Txn ID' : '-'}
                disabled={!needsReference}
              />
              <button
                type="button"
                className="split-payment-remove"
                onClick={() => removePayment(payment.id)}
                disabled={!isSplit || payments.length <= 2}
                aria-label="Remove payment method"
              >
                x
              </button>
            </div>
          );
        })}
      </div>

      {isSplit && (
        <div className="split-payment-footer">
          <button type="button" className="split-payment-add" onClick={addPayment}>
            + Add method
          </button>
          <span className={isBalanced ? 'is-balanced' : ''}>
            Split total: &#8377;{formatCurrency(splitTotal)}
          </span>
        </div>
      )}
    </div>
  );
}

export default SplitPaymentInput;
