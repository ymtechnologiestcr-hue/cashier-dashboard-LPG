import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Report Export Utility
 * Provides professional Excel (.xlsx) and PDF (.pdf) exports for Cashier Reports.
 */

export function exportToExcel({ filename = 'report.xlsx', sheets = [] }) {
  try {
    const workbook = XLSX.utils.book_new();

    sheets.forEach((sheet) => {
      const { sheetName = 'Sheet1', headers = [], data = [], totals = null } = sheet;

      // Construct 2D array: [headers, ...dataRows, totalsRow]
      const rows = [];

      // Add headers
      rows.push(headers);

      // Add data rows
      data.forEach((item) => {
        if (Array.isArray(item)) {
          rows.push(item);
        } else if (typeof item === 'object') {
          rows.push(Object.values(item));
        }
      });

      // Add totals row if present
      if (totals && Array.isArray(totals)) {
        rows.push(totals);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(rows);

      // Auto-fit column widths
      const colWidths = headers.map((header, colIdx) => {
        let maxLen = String(header || '').length;
        rows.forEach((row) => {
          const val = row[colIdx];
          const len = val !== null && val !== undefined ? String(val).length : 0;
          if (len > maxLen) maxLen = len;
        });
        return { wch: Math.min(Math.max(maxLen + 3, 10), 40) };
      });
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));
    });

    const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    XLSX.writeFile(workbook, safeFilename);
    return true;
  } catch (error) {
    console.error('exportToExcel error:', error);
    throw error;
  }
}

export function exportToPdf({
  filename = 'report.pdf',
  title = 'Report',
  subtitle = '',
  dateRange = '',
  headers = [],
  data = [],
  totals = null,
  orientation = 'portrait', // 'portrait' | 'landscape'
  notes = '',
}) {
  try {
    const doc = new jsPDF({
      orientation,
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Primary Brand Header
    doc.setFillColor(15, 28, 52); // #0f1c34 deep navy
    doc.rect(0, 0, pageWidth, 55, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('SURAJ GAS AGENCY', 30, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(180, 200, 230);
    doc.text('Cashier Dashboard - Official Report', 30, 42);

    const generatedOn = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    doc.setFontSize(8);
    doc.text(`Generated: ${generatedOn}`, pageWidth - 30, 42, { align: 'right' });

    // Report Title & Metadata Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(22, 27, 46);
    doc.text(title, 30, 80);

    let currentY = 95;
    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(subtitle, 30, currentY);
      currentY += 15;
    }

    if (dateRange) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 140, 74); // accent green
      doc.text(`Period: ${dateRange}`, 30, currentY);
      currentY += 16;
    }

    // Prepare table body and foot
    const bodyRows = data.map((item) => (Array.isArray(item) ? item : Object.values(item)));
    const footRows = totals ? (Array.isArray(totals[0]) ? totals : [totals]) : undefined;

    autoTable(doc, {
      startY: currentY,
      head: [headers],
      body: bodyRows,
      foot: footRows,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: orientation === 'landscape' ? 8 : 7.5,
        cellPadding: 4,
        overflow: 'linebreak',
        textColor: [30, 41, 59],
      },
      headStyles: {
        fillColor: [15, 28, 52],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left',
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 30, right: 30 },
      didDrawPage: (dataObj) => {
        // Page footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${dataObj.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 15,
          { align: 'center' }
        );
      },
    });

    if (notes) {
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Note: ${notes}`, 30, finalY);
    }

    const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    doc.save(safeFilename);
    return true;
  } catch (error) {
    console.error('exportToPdf error:', error);
    throw error;
  }
}
