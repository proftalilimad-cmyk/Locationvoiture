import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { abboudEngine } from './abboudEngine';

async function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function extractAdminToken(req: IncomingMessage, body?: any): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return body?.token;
}

export function rentalApiPlugin(): Plugin {
  return {
    name: 'abboud-car-rental-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) {
          return next();
        }
        if (req.url === '/abboud-location-hostinger.zip' || req.url === '/api/abboud/hostinger.zip') {
          const zipFilePath = path.resolve(process.cwd(), 'abboud-location-hostinger.zip');
          if (fs.existsSync(zipFilePath)) {
            const stat = fs.statSync(zipFilePath);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader(
              'Content-Disposition',
              'attachment; filename="abboud-location-hostinger.zip"'
            );
            res.setHeader('Content-Length', String(stat.size));
            fs.createReadStream(zipFilePath).pipe(res);
            return;
          }
        }
        if (!req.url.startsWith('/api/')) {
          return next();
        }

        const urlObj = new URL(req.url, 'http://localhost');
        const pathname = urlObj.pathname;
        const method = req.method || 'GET';

        try {
          // Direct Hostinger ZIP download endpoint
          if (pathname === '/api/abboud/hostinger.zip' && method === 'GET') {
            const zipFilePath = path.resolve(process.cwd(), 'abboud-location-hostinger.zip');
            if (fs.existsSync(zipFilePath)) {
              const stat = fs.statSync(zipFilePath);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/zip');
              res.setHeader(
                'Content-Disposition',
                'attachment; filename="abboud-location-hostinger.zip"'
              );
              res.setHeader('Content-Length', String(stat.size));
              fs.createReadStream(zipFilePath).pipe(res);
              return;
            }
          }

          // Public Showcase Endpoint (Strictly isolated from sensitive admin data)
          if (
            (pathname === '/api/abboud/public' || pathname === '/api/bootstrap') &&
            (method === 'GET' || method === 'HEAD')
          ) {
            return sendJson(res, 200, abboudEngine.getPublicShowcaseData());
          }

          // Public Reservation Request Submission
          if (pathname === '/api/abboud/reservation-request' && method === 'POST') {
            const body = await readJsonBody(req);
            const result = abboudEngine.submitPublicReservationRequest(body);
            return sendJson(res, 201, result);
          }

          // Admin Login
          if (pathname === '/api/abboud/auth/login' && method === 'POST') {
            const body = await readJsonBody(req);
            const result = abboudEngine.loginAdmin(body.password || '');
            return sendJson(res, 200, result);
          }

          // Protected Admin State Snapshot
          if (pathname === '/api/abboud/admin/state' && (method === 'GET' || method === 'POST')) {
            const body = method === 'POST' ? await readJsonBody(req) : {};
            const token = extractAdminToken(req, body);
            const state = abboudEngine.getAdminState(token);
            return sendJson(res, 200, state);
          }

          if (pathname === '/api/abboud/admin/vehicle' && method === 'POST') {
            const body = await readJsonBody(req);
            const token = extractAdminToken(req, body);
            const vehicle = abboudEngine.updateVehicle(token, body.vehicle);
            return sendJson(res, 200, { vehicle });
          }

          if (pathname === '/api/abboud/admin/client' && method === 'POST') {
            const body = await readJsonBody(req);
            const token = extractAdminToken(req, body);
            const client = abboudEngine.upsertClient(token, body.client);
            return sendJson(res, 200, { client });
          }

          if (pathname === '/api/abboud/admin/request-status' && method === 'POST') {
            const body = await readJsonBody(req);
            const token = extractAdminToken(req, body);
            const request = abboudEngine.updateReservationRequestStatus(
              token,
              body.requestId,
              body.statut
            );
            return sendJson(res, 200, { request });
          }

          if (pathname === '/api/abboud/admin/contract' && method === 'POST') {
            const body = await readJsonBody(req);
            const token = extractAdminToken(req, body);
            const result = await abboudEngine.upsertContract(token, body.contract);
            return sendJson(res, 200, result);
          }

          if (pathname === '/api/abboud/admin/contract-extend' && method === 'POST') {
            const body = await readJsonBody(req);
            const token = extractAdminToken(req, body);
            const contract = await abboudEngine.extendContract(token, body);
            return sendJson(res, 200, { contract });
          }

          if (pathname === '/api/abboud/admin/contract-return' && method === 'POST') {
            const body = await readJsonBody(req);
            const token = extractAdminToken(req, body);
            const result = await abboudEngine.registerContractReturn(token, body);
            return sendJson(res, 200, result);
          }

          if (pathname === '/api/abboud/admin/invoice' && method === 'POST') {
            const body = await readJsonBody(req);
            const token = extractAdminToken(req, body);
            const invoice = abboudEngine.createOrUpdateInvoice(token, body.invoice);
            return sendJson(res, 200, { invoice });
          }

          if (pathname === '/api/abboud/admin/payment' && method === 'POST') {
            const body = await readJsonBody(req);
            const token = extractAdminToken(req, body);
            const result = abboudEngine.recordInvoicePayment(token, body.payment);
            return sendJson(res, 200, result);
          }

          if (pathname === '/api/abboud/admin/credit-note' && method === 'POST') {
            const body = await readJsonBody(req);
            const token = extractAdminToken(req, body);
            const invoice = abboudEngine.issueCreditNote(token, body);
            return sendJson(res, 200, { invoice });
          }

          if (pathname === '/api/abboud/admin/maintenance' && method === 'POST') {
            const body = await readJsonBody(req);
            const token = extractAdminToken(req, body);
            const maintenance = abboudEngine.addMaintenanceRecord(token, body.maintenance);
            return sendJson(res, 200, { maintenance });
          }

          if (pathname === '/api/abboud/admin/vehicle-credit' && method === 'POST') {
            const body = await readJsonBody(req);
            const token = extractAdminToken(req, body);
            const credit = abboudEngine.upsertVehicleCredit(token, body.credit);
            return sendJson(res, 200, { credit });
          }

          if (pathname === '/api/abboud/admin/credit-installment' && method === 'POST') {
            const body = await readJsonBody(req);
            const token = extractAdminToken(req, body);
            const credit = abboudEngine.recordCreditInstallment(token, body);
            return sendJson(res, 200, { credit });
          }

          if (pathname === '/api/abboud/admin/expense' && method === 'POST') {
            const body = await readJsonBody(req);
            const token = extractAdminToken(req, body);
            const expense = abboudEngine.addExpense(token, body.expense);
            return sendJson(res, 200, { expense });
          }

          if (pathname === '/api/abboud/admin/settings' && method === 'POST') {
            const body = await readJsonBody(req);
            const token = extractAdminToken(req, body);
            const settings = abboudEngine.updateSettings(token, body.updates);
            return sendJson(res, 200, { settings });
          }

          if (pathname === '/api/abboud/admin/password' && method === 'POST') {
            const body = await readJsonBody(req);
            const token = extractAdminToken(req, body);
            abboudEngine.changeAdminPassword(token, body.newPassword);
            return sendJson(res, 200, { ok: true });
          }

          if (pathname === '/api/abboud/admin/reset' && method === 'POST') {
            const body = await readJsonBody(req);
            const token = extractAdminToken(req, body);
            const state = abboudEngine.resetToCleanNineVehiclesState(token);
            return sendJson(res, 200, state);
          }

          if (pathname === '/api/abboud/admin/import' && method === 'POST') {
            const body = await readJsonBody(req);
            const token = extractAdminToken(req, body);
            const state = abboudEngine.importDatabaseBackup(token, body.state);
            return sendJson(res, 200, state);
          }

          return sendJson(res, 404, { error: `Route API introuvable: ${pathname}` });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Erreur interne du serveur';
          const status = message.includes('Non autorisé') || message.includes('Mot de passe')
            ? 401
            : message.includes('Chevauchement')
            ? 409
            : 400;
          return sendJson(res, status, { error: message });
        }
      });
    },
  };
}
