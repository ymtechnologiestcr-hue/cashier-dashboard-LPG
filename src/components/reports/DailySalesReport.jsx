import { useState, useEffect } from 'react';
import ReportFilterBar from './ReportFilterBar';
import { getDailySalesReport } from '../../services/cashierApi';
import { exportToExcel, exportToPdf } from '../../utils/reportExportUtils';
import { toast } from 'sonner';

export default function DailySalesReport() {
  const [activeTab, setActiveTab] = useState('domestic'); // 'domestic' | 'commercial'
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    domestic: { items: [], totals: { totalQty: 0, totalTaxable: 0, totalCgst: 0, totalSgst: 0, totalAmount: 0 } },
    commercial: { items: [], totals: { totalQty: 0, totalTaxable: 0, totalCgst: 0, totalSgst: 0, totalAmount: 0 } },
    combinedSummary: { totalQuantity: 0, totalTaxable: 0, totalGst: 0, totalAmount: 0 },
  });
  const [metadata, setMetadata] = useState({ drivers: [], products: [] });
  const [filterInfo, setFilterInfo] = useState({ label: 'Today', startDate: '', endDate: '' });

  const [filters, setFilters] = useState({
    timeframe: 'today',
    startDate: '',
    endDate: '',
    driverId: 'ALL',
    productId: 'ALL',
    category: 'ALL',
  });

  const fetchData = async (currentFilters) => {
    try {
      setLoading(true);
      const res = await getDailySalesReport(currentFilters);
      if (res?.success) {
        setData(res.data);
        if (res.metadata) setMetadata(res.metadata);
        if (res.filter) setFilterInfo(res.filter);
      }
    } catch (err) {
      console.error('Fetch daily sales report error:', err);
      toast.error('Failed to load daily sales report');
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

  const currentReport = activeTab === 'domestic' ? data.domestic : data.commercial;

  // Excel Export
  const handleExportExcel = () => {
    try {
      const sheets = [];

      // Domestic Sheet
      const domHeaders = [
        'Date',
        'Voucher Number',
        'Delivery Boy Name',
        'Category',
        'Item Name',
        'Total Quantity',
        'Rate (₹)',
        'Taxable Value (₹)',
        'CGST 2.5% (₹)',
        'SGST 2.5% (₹)',
        'Total Amount (₹)',
      ];
      const domRows = data.domestic.items.map((item) => [
        item.date,
        item.voucherNumber,
        item.deliveryBoyName,
        item.category,
        item.itemName,
        item.totalQuantity,
        item.rate.toFixed(2),
        item.taxableValue.toFixed(2),
        item.cgst.toFixed(2),
        item.sgst.toFixed(2),
        item.totalAmount.toFixed(2),
      ]);
      const domTotals = [
        'TOTALS',
        '',
        '',
        '',
        '',
        data.domestic.totals.totalQty,
        '',
        data.domestic.totals.totalTaxable.toFixed(2),
        data.domestic.totals.totalCgst.toFixed(2),
        data.domestic.totals.totalSgst.toFixed(2),
        data.domestic.totals.totalAmount.toFixed(2),
      ];

      sheets.push({
        sheetName: 'Domestic Sales (5% GST)',
        headers: domHeaders,
        data: domRows,
        totals: domTotals,
      });

      // Commercial Sheet
      const commHeaders = [
        'Date',
        'Voucher Number',
        'Delivery Boy Name',
        'Customer Name',
        'Category',
        'Item Name',
        'Total Quantity',
        'Rate (₹)',
        'Taxable Value (₹)',
        'CGST 9% (₹)',
        'SGST 9% (₹)',
        'Total Amount (₹)',
      ];
      const commRows = data.commercial.items.map((item) => [
        item.date,
        item.voucherNumber,
        item.deliveryBoyName,
        item.customerName,
        item.category,
        item.itemName,
        item.totalQuantity,
        item.rate.toFixed(2),
        item.taxableValue.toFixed(2),
        item.cgst.toFixed(2),
        item.sgst.toFixed(2),
        item.totalAmount.toFixed(2),
      ]);
      const commTotals = [
        'TOTALS',
        '',
        '',
        '',
        '',
        '',
        data.commercial.totals.totalQty,
        '',
        data.commercial.totals.totalTaxable.toFixed(2),
        data.commercial.totals.totalCgst.toFixed(2),
        data.commercial.totals.totalSgst.toFixed(2),
        data.commercial.totals.totalAmount.toFixed(2),
      ];

      sheets.push({
        sheetName: 'Commercial Sales (18% GST)',
        headers: commHeaders,
        data: commRows,
        totals: commTotals,
      });

      const filename = `Daily_Sales_Report_${filterInfo.startDate || 'all'}_to_${filterInfo.endDate || 'all'}.xlsx`;
      exportToExcel({ filename, sheets });
      toast.success('Daily Sales Report exported to Excel');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Excel');
    }
  };

  // PDF Export
  const handleExportPdf = () => {
    try {
      const isDomestic = activeTab === 'domestic';
      const title = isDomestic ? 'Daily Sales Report - Domestic (5% GST)' : 'Daily Sales Report - Commercial (18% GST)';
      const subtitle = isDomestic
        ? 'CGST 2.5% + SGST 2.5% | Rate inclusive calculation'
        : 'CGST 9% + SGST 9% | Commercial customer details with GST breakdown';

      const headers = isDomestic
        ? ['Date', 'Voucher #', 'Delivery Boy', 'Category', 'Item', 'Qty', 'Rate (₹)', 'Taxable (₹)', 'CGST (₹)', 'SGST (₹)', 'Total (₹)']
        : ['Date', 'Voucher #', 'Delivery Boy', 'Customer', 'Item', 'Qty', 'Rate (₹)', 'Taxable (₹)', 'CGST (₹)', 'SGST (₹)', 'Total (₹)'];

      const tableData = isDomestic
        ? data.domestic.items.map((i) => [
            i.date,
            i.voucherNumber,
            i.deliveryBoyName,
            i.category,
            i.itemName,
            i.totalQuantity,
            i.rate.toFixed(2),
            i.taxableValue.toFixed(2),
            i.cgst.toFixed(2),
            i.sgst.toFixed(2),
            i.totalAmount.toFixed(2),
          ])
        : data.commercial.items.map((i) => [
            i.date,
            i.voucherNumber,
            i.deliveryBoyName,
            i.customerName,
            i.itemName,
            i.totalQuantity,
            i.rate.toFixed(2),
            i.taxableValue.toFixed(2),
            i.cgst.toFixed(2),
            i.sgst.toFixed(2),
            i.totalAmount.toFixed(2),
          ]);

      const totals = isDomestic
        ? [
            'TOTALS',
            '',
            '',
            '',
            '',
            data.domestic.totals.totalQty,
            '',
            data.domestic.totals.totalTaxable.toFixed(2),
            data.domestic.totals.totalCgst.toFixed(2),
            data.domestic.totals.totalSgst.toFixed(2),
            data.domestic.totals.totalAmount.toFixed(2),
          ]
        : [
            'TOTALS',
            '',
            '',
            '',
            '',
            data.commercial.totals.totalQty,
            '',
            data.commercial.totals.totalTaxable.toFixed(2),
            data.commercial.totals.totalCgst.toFixed(2),
            data.commercial.totals.totalSgst.toFixed(2),
            data.commercial.totals.totalAmount.toFixed(2),
          ];

      const filename = `${isDomestic ? 'Domestic' : 'Commercial'}_Sales_Report_${filterInfo.startDate || 'all'}.pdf`;

      exportToPdf({
        filename,
        title,
        subtitle,
        dateRange: filterInfo.label || 'Selected Period',
        headers,
        data: tableData,
        totals,
        orientation: 'landscape',
        notes: isDomestic
          ? 'Taxable Value = Total sales ÷ 1.05. CGST = 2.5%, SGST = 2.5%.'
          : 'Taxable Value = Total sales ÷ 1.18. CGST = 9%, SGST = 9%.',
      });

      toast.success('Daily Sales Report exported to PDF');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF');
    }
  };

  return (
    <div className="report-submodule">
      {/* Header & Subtitle */}
      <div className="report-module-header">
        <div>
          <h2 className="report-module-title">Daily Sales Report</h2>
          <p className="report-module-desc">
            Separate Domestic and Commercial sales reports with automatic GST calculations (5% & 18%) and itemized breakdown.
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
        showDriver={true}
        driversList={metadata.drivers}
        showProduct={true}
        productsList={metadata.products}
        loading={loading}
      />

      {/* KPI Summary Cards */}
      <div className="report-kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total Cylinders Sold</span>
          <span className="kpi-value">{data.combinedSummary.totalQuantity} Units</span>
          <span className="kpi-sub">
            Domestic: {data.domestic.totals.totalQty} | Commercial: {data.commercial.totals.totalQty}
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Total Taxable Value</span>
          <span className="kpi-value">₹{data.combinedSummary.totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="kpi-sub">
            Dom: ₹{data.domestic.totals.totalTaxable.toLocaleString('en-IN')} | Comm: ₹{data.commercial.totals.totalTaxable.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Total GST (CGST + SGST)</span>
          <span className="kpi-value text-accent">₹{data.combinedSummary.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="kpi-sub">
            Dom (5%): ₹{(data.domestic.totals.totalCgst + data.domestic.totals.totalSgst).toFixed(2)} | Comm (18%): ₹{(data.commercial.totals.totalCgst + data.commercial.totals.totalSgst).toFixed(2)}
          </span>
        </div>

        <div className="kpi-card kpi-highlight">
          <span className="kpi-label">Total Sales Invoice Amount</span>
          <span className="kpi-value">₹{data.combinedSummary.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="kpi-sub">Inclusive of GST</span>
        </div>
      </div>

      {/* Category Sub-Tabs */}
      <div className="report-tab-strip">
        <button
          type="button"
          className={`tab-strip-btn ${activeTab === 'domestic' ? 'active' : ''}`}
          onClick={() => setActiveTab('domestic')}
        >
          <span className="tab-tag">5% GST</span> Domestic Sales Report ({data.domestic.items.length})
        </button>
        <button
          type="button"
          className={`tab-strip-btn ${activeTab === 'commercial' ? 'active' : ''}`}
          onClick={() => setActiveTab('commercial')}
        >
          <span className="tab-tag tag-commercial">18% GST</span> Commercial Sales Report ({data.commercial.items.length})
        </button>
      </div>

      {/* Report Table */}
      <div className="report-table-wrapper">
        {loading ? (
          <div className="report-loading-state">Loading sales data...</div>
        ) : currentReport.items.length === 0 ? (
          <div className="report-empty-state">
            <span className="empty-icon">📭</span>
            <p>No completed {activeTab} sales vouchers found for the selected period.</p>
          </div>
        ) : (
          <table className="report-table">
            <thead>
              {activeTab === 'domestic' ? (
                <tr>
                  <th>Date</th>
                  <th>Voucher #</th>
                  <th>Delivery Boy Name</th>
                  <th>Category</th>
                  <th>Item Name</th>
                  <th className="text-right">Total Qty</th>
                  <th className="text-right">Rate</th>
                  <th className="text-right">Taxable Value</th>
                  <th className="text-right">CGST (2.5%)</th>
                  <th className="text-right">SGST (2.5%)</th>
                  <th className="text-right">Total Amount</th>
                </tr>
              ) : (
                <tr>
                  <th>Date</th>
                  <th>Voucher #</th>
                  <th>Delivery Boy Name</th>
                  <th>Customer Name</th>
                  <th>Category</th>
                  <th>Item Name</th>
                  <th className="text-right">Total Qty</th>
                  <th className="text-right">Rate</th>
                  <th className="text-right">Taxable Value</th>
                  <th className="text-right">CGST (9%)</th>
                  <th className="text-right">SGST (9%)</th>
                  <th className="text-right">Total Amount</th>
                </tr>
              )}
            </thead>
            <tbody>
              {activeTab === 'domestic'
                ? data.domestic.items.map((item, idx) => (
                    <tr key={`${item.voucherNumber}-${idx}`}>
                      <td>{item.date}</td>
                      <td className="font-mono text-muted">{item.voucherNumber}</td>
                      <td>{item.deliveryBoyName}</td>
                      <td>
                        <span className="badge badge-domestic">{item.category}</span>
                      </td>
                      <td className="font-medium">{item.itemName}</td>
                      <td className="text-right font-semibold">{item.totalQuantity}</td>
                      <td className="text-right">₹{item.rate.toFixed(2)}</td>
                      <td className="text-right font-mono">₹{item.taxableValue.toFixed(2)}</td>
                      <td className="text-right font-mono text-muted">₹{item.cgst.toFixed(2)}</td>
                      <td className="text-right font-mono text-muted">₹{item.sgst.toFixed(2)}</td>
                      <td className="text-right font-semibold text-primary">₹{item.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))
                : data.commercial.items.map((item, idx) => (
                    <tr key={`${item.voucherNumber}-${idx}`}>
                      <td>{item.date}</td>
                      <td className="font-mono text-muted">{item.voucherNumber}</td>
                      <td>{item.deliveryBoyName}</td>
                      <td className="font-medium">
                        {item.customerName}
                        {item.consumerNumber && item.consumerNumber !== '-' && (
                          <span className="consumer-tag"> ({item.consumerNumber})</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-commercial">{item.category}</span>
                      </td>
                      <td className="font-medium">{item.itemName}</td>
                      <td className="text-right font-semibold">{item.totalQuantity}</td>
                      <td className="text-right">₹{item.rate.toFixed(2)}</td>
                      <td className="text-right font-mono">₹{item.taxableValue.toFixed(2)}</td>
                      <td className="text-right font-mono text-muted">₹{item.cgst.toFixed(2)}</td>
                      <td className="text-right font-mono text-muted">₹{item.sgst.toFixed(2)}</td>
                      <td className="text-right font-semibold text-primary">₹{item.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
            </tbody>
            <tfoot>
              {activeTab === 'domestic' ? (
                <tr className="report-totals-row">
                  <td colSpan="5" className="font-bold">Grand Totals ({data.domestic.items.length} records)</td>
                  <td className="text-right font-bold">{data.domestic.totals.totalQty}</td>
                  <td className="text-right text-muted">-</td>
                  <td className="text-right font-mono font-bold">₹{data.domestic.totals.totalTaxable.toFixed(2)}</td>
                  <td className="text-right font-mono font-bold">₹{data.domestic.totals.totalCgst.toFixed(2)}</td>
                  <td className="text-right font-mono font-bold">₹{data.domestic.totals.totalSgst.toFixed(2)}</td>
                  <td className="text-right font-mono font-bold text-primary">₹{data.domestic.totals.totalAmount.toFixed(2)}</td>
                </tr>
              ) : (
                <tr className="report-totals-row">
                  <td colSpan="6" className="font-bold">Grand Totals ({data.commercial.items.length} records)</td>
                  <td className="text-right font-bold">{data.commercial.totals.totalQty}</td>
                  <td className="text-right text-muted">-</td>
                  <td className="text-right font-mono font-bold">₹{data.commercial.totals.totalTaxable.toFixed(2)}</td>
                  <td className="text-right font-mono font-bold">₹{data.commercial.totals.totalCgst.toFixed(2)}</td>
                  <td className="text-right font-mono font-bold">₹{data.commercial.totals.totalSgst.toFixed(2)}</td>
                  <td className="text-right font-mono font-bold text-primary">₹{data.commercial.totals.totalAmount.toFixed(2)}</td>
                </tr>
              )}
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
