import { useState, useEffect } from 'react';
import ReportFilterBar from './ReportFilterBar';
import { getExpensesReport } from '../../services/cashierApi';
import { exportToExcel, exportToPdf } from '../../utils/reportExportUtils';
import { toast } from 'sonner';

export default function ExpensesReport() {
  const [activeTab, setActiveTab] = useState('driver'); // 'driver' | 'office'
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    driverExpenses: { items: [], totalAmount: 0, approvedAmount: 0 },
    officeExpenses: { items: [], totalAmount: 0 },
    combinedSummary: { grandTotal: 0, totalApprovedExpenses: 0 },
  });
  const [filterInfo, setFilterInfo] = useState({ label: 'Today', startDate: '', endDate: '' });

  const [filters, setFilters] = useState({
    timeframe: 'today',
    startDate: '',
    endDate: '',
    status: 'ALL',
  });

  const fetchData = async (currentFilters) => {
    try {
      setLoading(true);
      const res = await getExpensesReport(currentFilters);
      if (res?.success) {
        setData(res.data);
        if (res.filter) setFilterInfo(res.filter);
      }
    } catch (err) {
      console.error('Fetch expenses report error:', err);
      toast.error('Failed to load expenses report');
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
      const sheets = [];

      // Driver Expenses Sheet
      sheets.push({
        sheetName: 'Driver Expenses',
        headers: ['Sl. No.', 'Date', 'Voucher # / Reference', 'Driver Name', 'Expense Head', 'Total Amount (₹)', 'Description', 'Approval Status', 'Payment Mode'],
        data: data.driverExpenses.items.map((i) => [
          i.slNo,
          i.date,
          i.voucherNumber,
          i.driverName,
          i.expenseHead,
          i.totalAmount.toFixed(2),
          i.description,
          i.approvalStatus,
          i.paymentMode || 'CASH',
        ]),
        totals: ['GRAND TOTAL', '', '', '', '', data.driverExpenses.totalAmount.toFixed(2), '', '', ''],
      });

      // Office Expenses Sheet
      sheets.push({
        sheetName: 'Office Expenses',
        headers: ['Sl. No.', 'Date', 'Voucher Number', 'Payee / Driver Name', 'Expense Head', 'Total Amount (₹)', 'Description', 'Payment Mode'],
        data: data.officeExpenses.items.map((i) => [
          i.slNo,
          i.date,
          i.voucherNumber,
          i.payeeName,
          i.expenseHead,
          i.totalAmount.toFixed(2),
          i.description,
          i.paymentMode || 'CASH',
        ]),
        totals: ['GRAND TOTAL', '', '', '', '', data.officeExpenses.totalAmount.toFixed(2), '', ''],
      });

      const filename = `Expenses_Report_${filterInfo.startDate || 'all'}_to_${filterInfo.endDate || 'all'}.xlsx`;
      exportToExcel({ filename, sheets });
      toast.success('Expenses Report exported to Excel');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Excel');
    }
  };

  const handleExportPdf = () => {
    try {
      const isDriver = activeTab === 'driver';
      const title = isDriver ? 'Driver Expense Requests Report' : 'Office Expense Entry Report';
      const subtitle = isDriver
        ? 'Expenses submitted by delivery drivers for review, approval, and settlement'
        : 'Office operational expenses recorded by cashier / admin';

      const headers = isDriver
        ? ['Sl.', 'Date', 'Voucher #', 'Driver Name', 'Expense Head', 'Amount (₹)', 'Description', 'Status', 'Mode']
        : ['Sl.', 'Date', 'Voucher #', 'Payee / Recorded By', 'Expense Head', 'Amount (₹)', 'Description', 'Mode'];

      const tableData = isDriver
        ? data.driverExpenses.items.map((i) => [
            i.slNo,
            i.date,
            i.voucherNumber,
            i.driverName,
            i.expenseHead,
            i.totalAmount.toFixed(2),
            i.description,
            i.approvalStatus,
            i.paymentMode || 'CASH',
          ])
        : data.officeExpenses.items.map((i) => [
            i.slNo,
            i.date,
            i.voucherNumber,
            i.payeeName,
            i.expenseHead,
            i.totalAmount.toFixed(2),
            i.description,
            i.paymentMode || 'CASH',
          ]);

      const totals = isDriver
        ? ['TOTALS', '', '', '', '', data.driverExpenses.totalAmount.toFixed(2), '', '', '']
        : ['TOTALS', '', '', '', '', data.officeExpenses.totalAmount.toFixed(2), '', ''];

      exportToPdf({
        filename: `${isDriver ? 'Driver' : 'Office'}_Expenses_Report.pdf`,
        title,
        subtitle,
        dateRange: filterInfo.label || 'Selected Period',
        headers,
        data: tableData,
        totals,
        orientation: 'landscape',
      });

      toast.success('Expenses Report exported to PDF');
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
          <h2 className="report-module-title">Expenses Report</h2>
          <p className="report-module-desc">
            Separate audit reports for Driver Expense Requests and Office Expense Entries with status reconciliation.
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
      <ReportFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        showStatus={activeTab === 'driver'}
        statusOptions={[
          { label: 'Pending Approval', value: 'PENDING' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Rejected', value: 'REJECTED' },
          { label: 'Settled', value: 'SETTLED' },
        ]}
        loading={loading}
      />

      {/* KPI Cards */}
      <div className="report-kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total Driver Expenses</span>
          <span className="kpi-value">₹{data.driverExpenses.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="kpi-sub">{data.driverExpenses.items.length} requests submitted</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Approved Driver Expenses</span>
          <span className="kpi-value text-accent">₹{data.driverExpenses.approvedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="kpi-sub">Affects cash outflow when paid</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Office Operational Expenses</span>
          <span className="kpi-value">₹{data.officeExpenses.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="kpi-sub">{data.officeExpenses.items.length} office expense entries</span>
        </div>

        <div className="kpi-card kpi-highlight">
          <span className="kpi-label">Grand Total All Expenses</span>
          <span className="kpi-value">₹{data.combinedSummary.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="kpi-sub">Total operational outflow requests</span>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="report-tab-strip">
        <button
          type="button"
          className={`tab-strip-btn ${activeTab === 'driver' ? 'active' : ''}`}
          onClick={() => setActiveTab('driver')}
        >
          🚚 Driver Expense Requests ({data.driverExpenses.items.length})
        </button>
        <button
          type="button"
          className={`tab-strip-btn ${activeTab === 'office' ? 'active' : ''}`}
          onClick={() => setActiveTab('office')}
        >
          🏢 Office Expense Entries ({data.officeExpenses.items.length})
        </button>
      </div>

      {/* Table Content */}
      <div className="report-table-wrapper">
        {loading ? (
          <div className="report-loading-state">Loading expenses...</div>
        ) : activeTab === 'driver' ? (
          data.driverExpenses.items.length === 0 ? (
            <div className="report-empty-state">No driver expense requests found for the selected period.</div>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Sl. No.</th>
                  <th>Date</th>
                  <th>Voucher # / Ref</th>
                  <th>Driver Name</th>
                  <th>Expense Head</th>
                  <th className="text-right">Total Amount</th>
                  <th>Description</th>
                  <th>Approval Status</th>
                  <th>Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                {data.driverExpenses.items.map((item) => (
                  <tr key={`drv-exp-${item.slNo}`}>
                    <td>{item.slNo}</td>
                    <td>{item.date}</td>
                    <td className="font-mono text-muted">{item.voucherNumber}</td>
                    <td className="font-medium">{item.driverName}</td>
                    <td>
                      <span className="badge badge-domestic">{item.expenseHead}</span>
                    </td>
                    <td className="text-right font-semibold text-primary">₹{item.totalAmount.toFixed(2)}</td>
                    <td className="text-muted">{item.description}</td>
                    <td>
                      <span
                        className={`badge ${
                          item.approvalStatus === 'APPROVED'
                            ? 'badge-approved'
                            : item.approvalStatus === 'PENDING'
                            ? 'badge-pending'
                            : 'badge-rejected'
                        }`}
                      >
                        {item.approvalStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${item.paymentMode === 'CASH' ? 'badge-cash' : 'badge-upi'}`}>
                        {item.paymentMode || 'CASH'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="report-totals-row">
                  <td colSpan="5" className="font-bold">Grand Total Driver Expenses ({data.driverExpenses.items.length} records)</td>
                  <td className="text-right font-mono font-bold text-primary">₹{data.driverExpenses.totalAmount.toFixed(2)}</td>
                  <td colSpan="3"></td>
                </tr>
              </tfoot>
            </table>
          )
        ) : (
          data.officeExpenses.items.length === 0 ? (
            <div className="report-empty-state">No office expense entries found for the selected period.</div>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Sl. No.</th>
                  <th>Date</th>
                  <th>Voucher Number</th>
                  <th>Driver Name / Payee Name</th>
                  <th>Expense Head</th>
                  <th className="text-right">Total Amount</th>
                  <th>Description</th>
                  <th>Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                {data.officeExpenses.items.map((item) => (
                  <tr key={`off-exp-${item.slNo}`}>
                    <td>{item.slNo}</td>
                    <td>{item.date}</td>
                    <td className="font-mono text-muted">{item.voucherNumber}</td>
                    <td className="font-medium">{item.payeeName}</td>
                    <td>
                      <span className="badge badge-commercial">{item.expenseHead}</span>
                    </td>
                    <td className="text-right font-semibold text-primary">₹{item.totalAmount.toFixed(2)}</td>
                    <td className="text-muted">{item.description}</td>
                    <td>
                      <span className={`badge ${item.paymentMode === 'CASH' ? 'badge-cash' : 'badge-upi'}`}>
                        {item.paymentMode || 'CASH'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="report-totals-row">
                  <td colSpan="5" className="font-bold">Grand Total Office Expenses ({data.officeExpenses.items.length} records)</td>
                  <td className="text-right font-mono font-bold text-primary">₹{data.officeExpenses.totalAmount.toFixed(2)}</td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          )
        )}
      </div>
    </div>
  );
}
