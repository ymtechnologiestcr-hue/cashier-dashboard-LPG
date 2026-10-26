import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Clean currency string to replace unicode ₹ with Rs. (due to PDF standard font WinAnsiEncoding)
 */
function cleanCurrency(val) {
  if (val === null || val === undefined || val === '') return 'Rs. 0';
  const str = String(val).replace(/₹/g, 'Rs. ').trim();
  return str.replace(/\s+/g, ' ');
}

function formatAmount(val) {
  const num = Number(val) || 0;
  return `Rs. ${num.toLocaleString('en-IN')}`;
}

function formatTime(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return String(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Export Current Balance and Line Items to a high-quality PDF.
 */
export async function exportCurrentBalancePdf({
  date,
  metrics = [],
  entries = [],
  balanceTitle = 'Current Balance',
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Separate cash in and cash out entries
  const cashInEntries = entries.filter((e) => e.direction === 'IN');
  const cashOutEntries = entries.filter((e) => e.direction === 'OUT');

  const totalInAmount = cashInEntries.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalOutAmount = cashOutEntries.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Metrics strings
  const openingStr = metrics.find((m) => m.title === 'Opening Balance')?.value || 'Rs. 0';
  const cashInMetric = metrics.find((m) => m.title === 'Total Cash In');
  const cashOutMetric = metrics.find((m) => m.title === 'Total Cash Out');
  const currentMetric = metrics.find((m) => m.title === 'Current Balance' || m.title === 'Date Range Net Balance');

  const cashInStr = cashInMetric?.value || formatAmount(totalInAmount);
  const cashOutStr = cashOutMetric?.value || formatAmount(totalOutAmount);
  const currentStr = currentMetric?.value || 'Rs. 0';

  let currentY = 16;

  // 1. Company / System Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('LPG CASHIER MANAGEMENT SYSTEM · FINANCIAL REPORT', margin, currentY);
  currentY += 6;

  // 2. Title & Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(`${balanceTitle} · Line Items`, margin, currentY);

  const timestampStr = `Generated: ${new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(timestampStr, pageWidth - margin, currentY, { align: 'right' });

  currentY += 5;
  doc.setFontSize(9.5);
  doc.text(`Transactions for date: ${date || 'All Recorded'}`, margin, currentY);
  currentY += 6;

  // Header divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // 3. Metric Cards Grid (4 boxes)
  const cardCount = 4;
  const cardGap = 4;
  const cardWidth = (contentWidth - cardGap * (cardCount - 1)) / cardCount;
  const cardHeight = 20;

  const cardData = [
    {
      label: 'OPENING BALANCE',
      value: cleanCurrency(openingStr),
      color: [4, 134, 211], // #0486d3
      sub: null,
    },
    {
      label: 'TOTAL CASH IN',
      value: cleanCurrency(cashInStr),
      color: [5, 150, 105], // #059669
      sub: cashInMetric?.paymentMethods?.online != null
        ? `Online: Rs. ${Number(cashInMetric.paymentMethods.online || 0).toLocaleString('en-IN')}`
        : null,
    },
    {
      label: 'TOTAL CASH OUT',
      value: cleanCurrency(cashOutStr),
      color: [220, 38, 38], // #dc2626
      sub: cashOutMetric?.paymentMethods?.online != null
        ? `Online: Rs. ${Number(cashOutMetric.paymentMethods.online || 0).toLocaleString('en-IN')}`
        : null,
    },
    {
      label: (balanceTitle || 'CURRENT BALANCE').toUpperCase(),
      value: cleanCurrency(currentStr),
      color: [0, 161, 89], // #00a159
      sub: null,
    },
  ];

  cardData.forEach((card, index) => {
    const cardX = margin + index * (cardWidth + cardGap);

    // Box background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'F');
    // Box border
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'S');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(card.label, cardX + 3.5, currentY + 5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.value, cardX + 3.5, currentY + 12);

    // Subtext (e.g. Online amount)
    if (card.sub) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(card.sub, cardX + 3.5, currentY + 17);
    }
  });

  currentY += cardHeight + 8;

  // 4. Section: Cash In Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105);
  doc.text(`Cash In (${cashInEntries.length} entries) - Total: Rs. ${totalInAmount.toLocaleString('en-IN')}`, margin, currentY);
  currentY += 4;

  const cashInTableBody = cashInEntries.length > 0
    ? cashInEntries.map((e) => {
        const typeStr = e.expense_name || e.type_label || e.type || '-';
        const desc = e.description && e.description !== typeStr ? ` (${e.description})` : '';
        return [
          formatTime(e.timestamp),
          e.reference_id || '-',
          e.source || e.payee || 'Customer',
          `${typeStr}${desc}`,
          (e.payment_mode || 'CASH').toUpperCase(),
          `+${cleanCurrency(e.amount)}`,
        ];
      })
    : [['-', '-', 'No cash in entries found', '-', '-', '-']];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Time', 'Ref', 'Source', 'Type', 'Mode', 'Amount']],
    body: cashInTableBody,
    foot: cashInEntries.length > 0 ? [['Total Cash In', '', '', '', '', `+Rs. ${totalInAmount.toLocaleString('en-IN')}`]] : undefined,
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    footStyles: {
      fillColor: [220, 252, 231], // #dcfce7
      textColor: [22, 101, 52],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 16 }, // Time
      1: { cellWidth: 26 }, // Ref
      2: { cellWidth: 38 }, // Source
      3: { cellWidth: 'auto' }, // Type
      4: { cellWidth: 20, halign: 'center' }, // Mode
      5: { cellWidth: 26, halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] }, // Amount
    },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // Check if we need page break for Cash Out table
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 16;
  }

  // 5. Section: Cash Out Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(220, 38, 38);
  doc.text(`Cash Out (${cashOutEntries.length} entries) - Total: Rs. ${totalOutAmount.toLocaleString('en-IN')}`, margin, currentY);
  currentY += 4;

  const cashOutTableBody = cashOutEntries.length > 0
    ? cashOutEntries.map((e) => {
        const typeStr = e.expense_name || e.category || e.type_label || e.type || '-';
        const desc = e.description && e.description !== typeStr ? ` (${e.description})` : '';
        return [
          formatTime(e.timestamp),
          e.reference_id || '-',
          e.payee || e.source || 'N/A',
          `${typeStr}${desc}`,
          (e.payment_mode || 'CASH').toUpperCase(),
          `-${cleanCurrency(e.amount)}`,
        ];
      })
    : [['-', '-', 'No cash out entries found', '-', '-', '-']];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Time', 'Ref', 'Payee', 'Type', 'Mode', 'Amount']],
    body: cashOutTableBody,
    foot: cashOutEntries.length > 0 ? [['Total Cash Out', '', '', '', '', `-Rs. ${totalOutAmount.toLocaleString('en-IN')}`]] : undefined,
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [220, 38, 38],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    footStyles: {
      fillColor: [254, 226, 226], // #fee2e2
      textColor: [153, 27, 27],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 16 }, // Time
      1: { cellWidth: 26 }, // Ref
      2: { cellWidth: 38 }, // Payee
      3: { cellWidth: 'auto' }, // Type
      4: { cellWidth: 20, halign: 'center' }, // Mode
      5: { cellWidth: 26, halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] }, // Amount
    },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // Check if we need page break for reconciliation banner
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 16;
  }

  // 6. Reconciliation Formula Summary Banner
  const formulaBoxHeight = 16;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, formulaBoxHeight, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, formulaBoxHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const formulaText = `Opening ${cleanCurrency(openingStr)}  +  Cash In ${cleanCurrency(cashInStr)}  -  Cash Out ${cleanCurrency(cashOutStr)}`;
  doc.text(formulaText, margin + 5, currentY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  const balLabel = `${balanceTitle}: `;
  const balVal = cleanCurrency(currentStr);
  const fullBalText = `${balLabel}${balVal}`;
  doc.text(fullBalText, pageWidth - margin - 5, currentY + 10, { align: 'right' });

  // 7. Page numbering & footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Confidential · LPG Cashier Balance Statement', margin, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Save the PDF file
  const fileName = `current-balance-line-items-${date || 'today'}.pdf`;
  doc.save(fileName);
  return true;
}
