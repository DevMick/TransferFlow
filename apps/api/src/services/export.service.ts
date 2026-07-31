import { Parser } from 'json2csv';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import type { TransferRow } from '../db/schema.js';

/**
 * Export service for CSV, Excel, and PDF exports
 */
export class ExportService {
  /**
   * Export transfers to CSV
   */
  static async exportToCSV(transfers: TransferRow[]): Promise<Buffer> {
    const fields = [
      'id',
      'beneficiaryName',
      'beneficiaryEmail',
      'iban',
      'senderBank',
      'amount',
      'currency',
      'transactionReference',
      'status',
      'createdAt',
      'updatedAt',
      'rejectedAt',
      'rejectionReason',
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(transfers);
    return Buffer.from(csv);
  }

  /**
   * Export transfers to Excel
   */
  static async exportToExcel(transfers: TransferRow[]): Promise<Buffer> {
    const worksheet = XLSX.utils.json_to_sheet(transfers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transfers');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return Buffer.from(excelBuffer);
  }

  /**
   * Export transfers to PDF
   */
  static async exportToPDF(transfers: TransferRow[]): Promise<Buffer> {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('Historique des virements', 20, 20);
    doc.setFontSize(10);
    doc.text(`Généré: ${new Date().toLocaleString('fr-FR')}`, 20, 30);
    doc.text(`Total virements: ${transfers.length}`, 20, 38);

    // Table header
    let y = 50;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Référence', 10, y);
    doc.text('Bénéficiaire', 45, y);
    doc.text('Établissement', 100, y);
    doc.text('Montant', 150, y);
    doc.text('Statut', 180, y);

    y += 10;
    doc.setFont('helvetica', 'normal');

    // Table rows
    transfers.forEach((transfer) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text(
        transfer.transactionReference?.substring(0, 8) || transfer.id.substring(0, 8),
        10,
        y,
      );
      doc.text((transfer.beneficiaryName || '').substring(0, 15), 45, y);
      doc.text((transfer.senderBank || '').substring(0, 15), 100, y);
      doc.text(`${Number(transfer.amount || 0).toFixed(2)} ${transfer.currency || 'EUR'}`, 150, y);
      doc.text(transfer.status || '', 180, y);

      y += 8;
    });

    return Buffer.from(new Uint8Array(doc.output('arraybuffer')));
  }
}
