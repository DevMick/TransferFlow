import { zValidator } from '@hono/zod-validator';
import {
  createTransferSchema,
  listTransfersQuerySchema,
  rejectTransferSchema,
} from '@transferflow/shared';
import { and, desc, eq, gte, inArray, like, lte, or } from 'drizzle-orm';
import { Hono } from 'hono';
import { type AuthEnv, requireAuth } from '../auth/middleware.js';
import { db } from '../db/index.js';
import { establishment, transfer } from '../db/schema.js';
import { maskIban } from '../lib/iban.js';
import { generateInitiationPdf, generateRejectionPdf } from '../lib/pdf.service.js';
import { sendTransferNotificationEmail } from '../services/email.service.js';
import { ExportService } from '../services/export.service.js';

/**
 * Transfers API. Every route requires an authenticated session and is scoped to
 * the current user. Exported as a standalone router so its types flow into the
 * Hono RPC client on the web side.
 */
export const transfersRouter = new Hono<AuthEnv>()
  .use('*', requireAuth)
  .get('/', zValidator('query', listTransfersQuerySchema), async (c) => {
    const user = c.get('user');
    const {
      search,
      status,
      period,
      dateFrom,
      dateTo,
      bank,
      currency,
      amountMin,
      amountMax,
      limit,
      offset,
    } = c.req.valid('query');

    const conditions = [eq(transfer.userId, user.id)];

    if (status) {
      conditions.push(eq(transfer.status, status));
    }

    if (bank) {
      conditions.push(eq(transfer.senderBank, bank));
    }

    if (currency && currency.length > 0) {
      conditions.push(inArray(transfer.currency, currency));
    }

    if (amountMin) {
      conditions.push(gte(transfer.amount, amountMin.toString()));
    }

    if (amountMax) {
      conditions.push(lte(transfer.amount, amountMax.toString()));
    }

    if (search) {
      const searchConditions = or(
        like(transfer.beneficiaryName, `%${search}%`),
        like(transfer.beneficiaryEmail, `%${search}%`),
        like(transfer.iban, `%${search}%`),
        like(transfer.transactionReference, `%${search}%`),
      );
      if (searchConditions) {
        conditions.push(searchConditions);
      }
    }

    if (dateFrom) {
      conditions.push(gte(transfer.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      conditions.push(lte(transfer.createdAt, new Date(dateTo)));
    }

    if (period !== 'all') {
      const now = new Date();
      let startDate: Date;
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      conditions.push(gte(transfer.createdAt, startDate));
    }

    const rows = await db
      .select()
      .from(transfer)
      .where(and(...conditions))
      .orderBy(desc(transfer.createdAt))
      .limit(limit)
      .offset(offset);

    // Masquer l'IBAN dans la réponse de liste
    const maskedRows = rows.map((row) => ({
      ...row,
      iban: maskIban(row.iban),
    }));

    return c.json({ transfers: maskedRows });
  })
  .post('/', zValidator('json', createTransferSchema), async (c) => {
    const user = c.get('user');
    const input = c.req.valid('json');

    const [row] = await db
      .insert(transfer)
      .values({
        userId: user.id,
        // Nouveaux champs
        senderBank: input.senderBank,
        transactionReference: input.transactionReference,
        executionDate: input.executionDate ? new Date(input.executionDate) : new Date(),
        status: input.status || 'Initié',
        senderAccountName: input.senderAccountName,
        senderAccountNumber: input.senderAccountNumber,
        beneficiaryName: input.beneficiaryName,
        beneficiaryEmail: input.beneficiaryEmail,
        iban: input.iban,
        bicSwift: input.bicSwift,
        amount: input.amount ? input.amount.toFixed(4) : null,
        currency: input.currency,
        language: input.language || 'fr',
      })
      .returning();

    // Envoyer l'email de notification au bénéficiaire, avec le PDF officiel en pièce jointe
    if (row && input.beneficiaryEmail && input.beneficiaryName && input.iban && input.amount) {
      try {
        // Récupérer les informations de l'établissement émetteur
        let establishmentName = input.senderBank || 'TransferFlow';
        let est = null;
        if (input.senderBank) {
          const [found] = await db
            .select()
            .from(establishment)
            .where(eq(establishment.nomEtablissement, input.senderBank))
            .limit(1);
          if (found) {
            est = found;
            establishmentName = found.nomEtablissement;
          }
        }

        const pdfBuffer = generateInitiationPdf(row, est);

        await sendTransferNotificationEmail({
          recipientEmail: input.beneficiaryEmail ?? null,
          recipientName: input.beneficiaryName ?? null,
          senderName: input.senderAccountName ?? null,
          amount: input.amount.toFixed(2),
          currency: input.currency || 'EUR',
          language: input.language || 'fr',
          reference: input.transactionReference || row.id,
          initiationDate: new Date().toISOString(),
          establishmentName,
          establishmentLogo: est?.logoPath ?? undefined,
          iban: input.iban ?? null,
          pdfBuffer,
          pdfFilename: `virement-${(input.transactionReference || row.id).toString().toLowerCase()}.pdf`,
        });
      } catch (error) {
        console.error("Erreur lors de l'envoi de l'email:", error);
        // Ne pas échouer la création du virement si l'email échoue
      }
    }

    return c.json({ transfer: row }, 201);
  })
  .get('/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    const [row] = await db
      .select()
      .from(transfer)
      .where(and(eq(transfer.id, id), eq(transfer.userId, user.id)))
      .limit(1);

    if (!row) {
      return c.json({ error: 'Transfer not found' }, 404);
    }

    return c.json({ transfer: row });
  })
  .put('/:id/reject', zValidator('json', rejectTransferSchema), async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const { rejectionFee, rejectionFeeCurrency, rejectionReason } = c.req.valid('json');

    const [row] = await db
      .update(transfer)
      .set({
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason,
        rejectionFee: rejectionFee ? rejectionFee.toFixed(4) : null,
        rejectionFeeCurrency: rejectionFeeCurrency || 'EUR',
        updatedAt: new Date(),
      })
      .where(and(eq(transfer.id, id), eq(transfer.userId, user.id)))
      .returning();

    if (!row) {
      return c.json({ error: 'Transfer not found' }, 404);
    }

    // Récupérer les informations de l'établissement émetteur
    let establishmentName = row.senderBank || 'TransferFlow';
    let est = null;
    if (row.senderBank) {
      const [found] = await db
        .select()
        .from(establishment)
        .where(eq(establishment.nomEtablissement, row.senderBank))
        .limit(1);
      if (found) {
        est = found;
        establishmentName = found.nomEtablissement;
      }
    }

    // Générer le PDF de rejet
    const pdfBuffer = generateRejectionPdf(row, est, rejectionFee, rejectionFeeCurrency);

    // Envoyer l'email de rejet
    try {
      await sendTransferNotificationEmail({
        recipientEmail: row.beneficiaryEmail || '',
        recipientName: row.beneficiaryName || '',
        senderName: row.senderAccountName || '',
        amount: row.amount ? row.amount.toString() : '0',
        currency: row.currency || 'EUR',
        language: row.language || 'fr',
        reference: row.transactionReference || row.id,
        initiationDate: row.executionDate || row.createdAt,
        establishmentName,
        establishmentLogo: est?.logoPath ?? undefined,
        iban: row.iban || '',
        pdfBuffer,
        pdfFilename: `rejet-${(row.transactionReference || row.id).toString().toLowerCase()}.pdf`,
        rejectionReason,
        rejectionFee: rejectionFee ? rejectionFee.toString() : '0',
        rejectionFeeCurrency: rejectionFeeCurrency || 'EUR',
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email de rejet:", error);
      // Ne pas échouer le rejet si l'email échoue
    }

    return c.json({ transfer: row });
  })
  .put('/:id/reset', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    const [row] = await db
      .update(transfer)
      .set({
        status: 'initiated',
        rejectedAt: null,
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(and(eq(transfer.id, id), eq(transfer.userId, user.id)))
      .returning();

    if (!row) {
      return c.json({ error: 'Transfer not found' }, 404);
    }

    return c.json({ transfer: row });
  })
  .get('/:id/pdf/initiation', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    const [row] = await db
      .select()
      .from(transfer)
      .where(and(eq(transfer.id, id), eq(transfer.userId, user.id)))
      .limit(1);

    if (!row) {
      return c.json({ error: 'Transfer not found' }, 404);
    }

    const est = row.senderBank
      ? (
          await db
            .select()
            .from(establishment)
            .where(eq(establishment.nomEtablissement, row.senderBank))
            .limit(1)
        )[0] || null
      : null;

    const pdfBuffer = generateInitiationPdf(row, est);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="virement-${(row.transactionReference || id).toString().toLowerCase()}.pdf"`,
      },
    });
  })
  .get('/:id/pdf/rejection', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    const [row] = await db
      .select()
      .from(transfer)
      .where(and(eq(transfer.id, id), eq(transfer.userId, user.id)))
      .limit(1);

    if (!row) {
      return c.json({ error: 'Transfer not found' }, 404);
    }

    if (row.status !== 'rejected') {
      return c.json({ error: 'Transfer must be rejected to generate rejection PDF' }, 400);
    }

    const est = row.senderBank
      ? (
          await db
            .select()
            .from(establishment)
            .where(eq(establishment.nomEtablissement, row.senderBank))
            .limit(1)
        )[0] || null
      : null;

    const pdfBuffer = generateRejectionPdf(row, est);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rejet-${(row.transactionReference || id).toString().toLowerCase()}.pdf"`,
      },
    });
  })
  .get('/export/csv', zValidator('query', listTransfersQuerySchema), async (c) => {
    const user = c.get('user');
    const query = c.req.valid('query');

    const conditions = [eq(transfer.userId, user.id)];
    if (query.status) conditions.push(eq(transfer.status, query.status));
    if (query.bank) conditions.push(eq(transfer.senderBank, query.bank));
    if (query.currency && query.currency.length > 0)
      conditions.push(inArray(transfer.currency, query.currency));

    const rows = await db
      .select()
      .from(transfer)
      .where(and(...conditions))
      .orderBy(desc(transfer.createdAt))
      .limit(query.limit || 1000);

    const csvBuffer = await ExportService.exportToCSV(rows);

    return new Response(new Uint8Array(csvBuffer), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="transfers-export.csv"',
      },
    });
  })
  .get('/export/excel', zValidator('query', listTransfersQuerySchema), async (c) => {
    const user = c.get('user');
    const query = c.req.valid('query');

    const conditions = [eq(transfer.userId, user.id)];
    if (query.status) conditions.push(eq(transfer.status, query.status));
    if (query.bank) conditions.push(eq(transfer.senderBank, query.bank));
    if (query.currency && query.currency.length > 0)
      conditions.push(inArray(transfer.currency, query.currency));

    const rows = await db
      .select()
      .from(transfer)
      .where(and(...conditions))
      .orderBy(desc(transfer.createdAt))
      .limit(query.limit || 1000);

    const excelBuffer = await ExportService.exportToExcel(rows);

    return new Response(new Uint8Array(excelBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="transfers-export.xlsx"',
      },
    });
  })
  .get('/export/pdf', zValidator('query', listTransfersQuerySchema), async (c) => {
    const user = c.get('user');
    const query = c.req.valid('query');

    const conditions = [eq(transfer.userId, user.id)];
    if (query.status) conditions.push(eq(transfer.status, query.status));
    if (query.bank) conditions.push(eq(transfer.senderBank, query.bank));
    if (query.currency && query.currency.length > 0)
      conditions.push(inArray(transfer.currency, query.currency));

    const rows = await db
      .select()
      .from(transfer)
      .where(and(...conditions))
      .orderBy(desc(transfer.createdAt))
      .limit(query.limit || 100);

    const pdfBuffer = await ExportService.exportToPDF(rows);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="transfers-export.pdf"',
      },
    });
  });
