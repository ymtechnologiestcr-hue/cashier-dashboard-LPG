import { useState, useEffect } from 'react';
import ReportFilterBar from './ReportFilterBar';
import { getConsolidatedCashReport } from '../../services/cashierApi';
import { exportToExcel, exportToPdf } from '../../utils/reportExportUtils';
import { toast } from 'sonner';

export default function ConsolidatedCashReport() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    statement: [],
    openingCashBalance: 0,
    totalCashIn: 0,
    totalCashOut: 0,
    closingCashBalance: 0,
    cashInBreakdown: {},
    cashOutBreakdown: {},
    formula: 'Closing Cash = Opening Cash + Cash In - Cash Out',
    notes: '',
  });
  const [filterInfo, setFilterInfo] = useState({ label: 'Today', startDate: '', endDate: '' });

  const [filters, setFilters] = useState({
    timeframe: 'today',
    startDate: '',
    endDate: '',
  });

  const fetchData = async (currentFilters) => {
    try {
      setLoading(true);
      const res = await getConsolidatedCashReport(currentFilters);
      if (res?.success) {
        setData(res.data);
        if (res.filter) setFilterInfo(res.filter);
      }
    } catch (err) {
      console.error('Fetch consolidated cash report error:', err);
      toast.error('Failed to load consolidated cash report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(filters);
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchData(newFilters);
  };

  const handleExportExcel = () => {
    try {
      const statementHeaders = ['Sl. No.', 'Particulars', 'Amount (₹)'];
      const statementRows = [
        ['1', 'Opening Cash Balance', data.openingCashBalance.toFixed(2)],
        ['2', 'Add: Total Cash In', data.totalCashIn.toFixed(2)],
        ['3', 'Less: Total Cash Out', data.totalCashOut.toFixed(2)],
        ['4', 'Closing Cash Balance', data.closingCashBalance.toFixed(2)],
      ];

      const breakdownHeaders = ['Category', 'Stream', 'Amount (₹)'];
      const breakdownRows = [
        ['Cash Inflow', 'Driver Settled Cash Collections', Number(data.cashInBreakdown?.driverCollectionsCash || 0).toFixed(2)],
        ['Cash Inflow', 'Office Walk-in Cash Sales', Number(data.cashInBreakdown?.officeSalesCash || 0).toFixed(2)],
        ['Cash Inflow', 'Customer PR Penalties (Cash)', Number(data.cashInBreakdown?.prPenaltiesCash || 0).toFixed(2)],
        ['Cash Inflow', 'Customer Name Changes (Cash)', Number(data.cashInBreakdown?.nameChangesCash || 0).toFixed(2)],
        ['Cash Inflow', 'Customer New Connections (Cash)', Number(data.cashInBreakdown?.newConnectionsCash || 0).toFixed(2)],
        ['Cash Inflow', 'Other Receipts (Cash)', Number(data.cashInBreakdown?.otherReceiptsCash || 0).toFixed(2)],
        ['Cash Outflow', 'Approved Driver Expenses (Cash)', Number(data.cashOutBreakdown?.driverExpensesCash || 0).toFixed(2)],
        ['Cash Outflow', 'Approved Office Expenses (Cash)', Number(data.cashOutBreakdown?.officeExpensesCash || 0).toFixed(2)],
        ['Cash Outflow', 'Transfer Voucher Customer Refunds (Cash)', Number(data.cashOutBreakdown?.transferRefundsCash || 0).toFixed(2)],
      ];

      const sheets = [
        {
          sheetName: 'Consolidated Cash Statement',
          headers: statementHeaders,
          data: statementRows,
        },
        {
          sheetName: 'Cash Audit Breakdown',
          headers: breakdownHeaders,
          data: breakdownRows,
        },
      ];

      const filename = `Consolidated_Cash_Report_${filterInfo.startDate || 'all'}_to_${filterInfo.endDate || 'all'}.xlsx`;
      exportToExcel({ filename, sheets });
      toast.success('Consolidated Cash Report exported to Excel');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Excel');
    }
  };

  const handleExportPdf = () => {
    try {
      const headers = ['Sl. No.', 'Particulars', 'Amount (₹)'];
      const tableData = [
        ['1', 'Opening Cash Balance', `₹ ${data.openingCashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['2', 'Add: Total Cash In', `₹ ${data.totalCashIn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['3', 'Less: Total Cash Out', `₹ ${data.totalCashOut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['4', 'Closing Cash Balance', `₹ ${data.closingCashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
      ];

      exportToPdf({
        filename: `Consolidated_Cash_Report_${filterInfo.startDate || 'all'}.pdf`,
        title: 'Consolidated Cash Report',
        subtitle: 'Reconciliation statement of Opening Cash, Physical Cash In, Cash Out, and Closing Cash',
        dateRange: filterInfo.label || 'Selected Period',
        headers,
        data: tableData,
        orientation: 'portrait',
        notes: 'Formula: Closing Cash = Opening Cash + Cash In - Cash Out. Reconciles physical currency only; UPI & online excluded.',
      });

      toast.success('Consolidated Cash Report exported to PDF');
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
          <h2 className="report-module-title">Consolidated Cash Report</h2>
          <p className="report-module-desc">
            Reconciles opening cash balance, total cash in, total cash out, and system closing cash balance.
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

      {/* Filter Bar */}
      <ReportFilterBar filters={filters} onFilterChange={handleFilterChange} loading={loading} />

      {/* Primary Financial Reconciliation Statement Card */}
      <div className="consolidated-statement-card">
        <div className="statement-header">
          <div>
            <span className="statement-tag">OFFICIAL AUDIT STATEMENT</span>
            <h3 className="statement-title">Cash Flow & Drawer Balance Reconciliation</h3>
            <p className="statement-subtitle">Period: {filterInfo.label || 'Current Period'}</p>
          </div>
          <div className="formula-pill">
            <code>Closing Cash = Opening Cash + Cash In - Cash Out</code>
          </div>
        </div>

        <div className="statement-table-box">
          <table className="statement-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Sl. No.</th>
                <th>Particulars</th>
                <th className="text-right" style={{ width: '220px' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="statement-row-opening">
                <td className="font-semibold">1</td>
                <td>
                  <div className="particular-title">Opening Cash Balance</div>
                  <div className="particular-desc">Carried forward from previous day closing / drawer start balance</div>
                </td>
                <td className="text-right font-mono font-bold text-xl">
                  ₹{data.openingCashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>

              <tr className="statement-row-in">
                <td className="font-semibold text-accent">2</td>
                <td>
                  <div className="particular-title text-accent">Add: Total Cash In</div>
                  <div className="particular-desc">Actual physical cash received (driver collections, office sales, service & receipts)</div>
                </td>
                <td className="text-right font-mono font-bold text-xl text-accent">
                  + ₹{data.totalCashIn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>

              <tr className="statement-row-out">
                <td className="font-semibold text-danger">3</td>
                <td>
                  <div className="particular-title text-danger">Less: Total Cash Out</div>
                  <div className="particular-desc">Actual physical cash expenses and payouts (driver expenses, office expenses, refunds)</div>
                </td>
                <td className="text-right font-mono font-bold text-xl text-danger">
                  - ₹{data.totalCashOut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>

              <tr className="statement-row-closing">
                <td className="font-bold text-primary">4</td>
                <td>
                  <div className="particular-title text-primary font-bold">Closing Cash Balance</div>
                  <div className="particular-desc">Calculated system closing cash balance available in physical drawer</div>
                </td>
                <td className="text-right font-mono font-extrabold text-2xl text-primary">
                  ₹{data.closingCashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Stream Breakdowns Grid */}
      <div className="streams-breakdown-grid">
        {/* Cash In Streams */}
        <div className="stream-card stream-in">
          <div className="stream-card-header">
            <h4>📥 Physical Cash In Breakdown</h4>
            <span className="stream-total-badge text-accent">
              ₹{data.totalCashIn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <ul className="stream-items-list">
            <li>
              <span>Driver Settled Collections (Cash)</span>
              <span className="font-mono">₹{Number(data.cashInBreakdown?.driverCollectionsCash || 0).toFixed(2)}</span>
            </li>
            <li>
              <span>Office Walk-in Counter Sales (Cash)</span>
              <span className="font-mono">₹{Number(data.cashInBreakdown?.officeSalesCash || 0).toFixed(2)}</span>
            </li>
            <li>
              <span>Customer PR Penalties (Cash)</span>
              <span className="font-mono">₹{Number(data.cashInBreakdown?.prPenaltiesCash || 0).toFixed(2)}</span>
            </li>
            <li>
              <span>Customer Name Change Fees (Cash)</span>
              <span className="font-mono">₹{Number(data.cashInBreakdown?.nameChangesCash || 0).toFixed(2)}</span>
            </li>
            <li>
              <span>Customer New Connection Deposits (Cash)</span>
              <span className="font-mono">₹{Number(data.cashInBreakdown?.newConnectionsCash || 0).toFixed(2)}</span>
            </li>
            <li>
              <span>Other Receipts & Advances (Cash)</span>
              <span className="font-mono">₹{Number(data.cashInBreakdown?.otherReceiptsCash || 0).toFixed(2)}</span>
            </li>
          </ul>
        </div>

        {/* Cash Out Streams */}
        <div className="stream-card stream-out">
          <div className="stream-card-header">
            <h4>📤 Physical Cash Out Breakdown</h4>
            <span className="stream-total-badge text-danger">
              ₹{data.totalCashOut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <ul className="stream-items-list">
            <li>
              <span>Approved Driver Expense Payouts (Cash)</span>
              <span className="font-mono">₹{Number(data.cashOutBreakdown?.driverExpensesCash || 0).toFixed(2)}</span>
            </li>
            <li>
              <span>Approved Office Expense Payouts (Cash)</span>
              <span className="font-mono">₹{Number(data.cashOutBreakdown?.officeExpensesCash || 0).toFixed(2)}</span>
            </li>
            <li>
              <span>Customer Transfer Voucher Refunds (Cash)</span>
              <span className="font-mono">₹{Number(data.cashOutBreakdown?.transferRefundsCash || 0).toFixed(2)}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
