import 'server-only';
import { Resend } from 'resend';
import type { Order, OrderItem, PurchaseOrder } from './types';
import { formatAUD } from './money';

function client(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  return new Resend(key);
}

function from(): string {
  return process.env.EMAIL_FROM || 'Beef Cartel <orders@beefcartel.com.au>';
}

/** Minimal on-brand HTML shell (charcoal / bone / oxblood / brass). */
function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#0E0C0A;font-family:Inter,Segoe UI,Arial,sans-serif;color:#F4EFE6">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <div style="font-family:Georgia,'Times New Roman',serif;font-weight:700;letter-spacing:.18em;text-transform:uppercase;font-size:20px;color:#F4EFE6">
      BEEF&nbsp;<span style="color:#B08D4F">&bull;</span>&nbsp;CARTEL
    </div>
    <div style="height:1px;background:rgba(176,141,79,.3);margin:20px 0"></div>
    <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:600;margin:0 0 16px;color:#F4EFE6">${title}</h1>
    ${body}
    <div style="height:1px;background:#3A322A;margin:28px 0 16px"></div>
    <p style="font-size:12px;color:#8C7F6C;margin:0">Beef Cartel · premium boxed beef · beefcartel.com.au</p>
  </div></body></html>`;
}

function itemsTable(items: OrderItem[]): string {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;color:#F4EFE6">${i.name} <span style="color:#8C7F6C">× ${i.qty}</span>${
          i.grade
            ? `<br><span style="color:#B08D4F;font-size:12px">MSA ${i.grade}${i.weightRange ? ` · ${i.weightRange}` : ''}</span>`
            : ''
        }</td>
         <td style="padding:8px 0;text-align:right;color:#B8AC98;vertical-align:top">${formatAUD(i.unitDeposit * i.qty)}</td></tr>`,
    )
    .join('');
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>`;
}

/** Customer receipt after the deposit succeeds. */
export async function sendDepositReceipt(order: Order): Promise<void> {
  const items = order.items ?? [];
  const estBalance = items.reduce((s, i) => s + (i.estUnitTotal - i.unitDeposit) * i.qty, 0);
  const body = `
    <p style="font-size:15px;line-height:1.6;color:#B8AC98">Thanks ${order.customerName.split(' ')[0] || 'there'} — your boxes are reserved. Here's your deposit receipt.</p>
    ${itemsTable(items)}
    <div style="height:1px;background:#3A322A;margin:16px 0"></div>
    <table style="width:100%;font-size:15px">
      <tr><td style="color:#B8AC98">Deposit paid today</td><td style="text-align:right;font-weight:700;color:#F4EFE6">${formatAUD(order.depositAmount)}</td></tr>
      <tr><td style="color:#8C7F6C;font-size:13px;padding-top:6px">Est. balance on dispatch</td><td style="text-align:right;color:#8C7F6C;font-size:13px;padding-top:6px">${formatAUD(estBalance)}</td></tr>
    </table>
    <p style="font-size:12px;color:#8C7F6C;line-height:1.5;margin-top:16px"><span style="color:#B08D4F">*</span> Final price is billed by the actual weight of your box at dispatch. We'll charge the balance to your saved card and email a receipt.</p>`;
  await client().emails.send({
    from: from(),
    to: order.email,
    subject: `Beef Cartel — deposit received (order ${order.id.slice(0, 8)})`,
    html: shell('Deposit received', body),
  });
}

/** Aggregated purchase order to the supplier. */
export async function sendSupplierPO(po: PurchaseOrder, cycleName: string): Promise<void> {
  const to = process.env.SUPPLIER_EMAIL;
  if (!to) throw new Error('SUPPLIER_EMAIL is not set');
  const rows = po.lines
    .map(
      (l) =>
        `<tr><td style="padding:8px 0;color:#F4EFE6">${l.name} <span style="color:#8C7F6C">(${l.grade})</span></td>
         <td style="padding:8px 0;text-align:center;color:#B8AC98">${l.qty}</td>
         <td style="padding:8px 0;text-align:right;color:#B8AC98">${l.estWeightKg.toFixed(1)} kg</td></tr>`,
    )
    .join('');
  const body = `
    <p style="font-size:15px;line-height:1.6;color:#B8AC98">Purchase order for cycle <strong style="color:#F4EFE6">${cycleName}</strong> — ${po.orderCount} customer orders, ${po.totalBoxes} boxes.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="border-bottom:1px solid #3A322A"><th style="text-align:left;color:#B08D4F;font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding-bottom:8px">Box</th><th style="text-align:center;color:#B08D4F;font-size:11px;letter-spacing:.1em;text-transform:uppercase">Qty</th><th style="text-align:right;color:#B08D4F;font-size:11px;letter-spacing:.1em;text-transform:uppercase">Est. weight</th></tr>
      ${rows}
    </table>
    <div style="height:1px;background:#3A322A;margin:16px 0"></div>
    <table style="width:100%;font-size:15px"><tr><td style="color:#F4EFE6;font-weight:700">Total est. weight</td><td style="text-align:right;font-weight:700;color:#F4EFE6">${po.totalEstWeightKg.toFixed(1)} kg</td></tr></table>`;
  await client().emails.send({
    from: from(),
    to,
    subject: `Beef Cartel PO — ${cycleName} (${po.totalBoxes} boxes)`,
    html: shell('Supplier purchase order', body),
  });
}

/** SCA fallback: email the customer a Stripe payment link for the balance. */
export async function sendBalancePaymentLink(
  order: Order,
  url: string,
  amount: number,
): Promise<void> {
  const body = `
    <p style="font-size:15px;line-height:1.6;color:#B8AC98">Your beef has been weighed and is ready for dispatch. Your card needs a quick confirmation to charge the balance.</p>
    <p style="font-size:15px;color:#F4EFE6">Balance due: <strong>${formatAUD(amount)}</strong></p>
    <p style="margin:24px 0"><a href="${url}" style="display:inline-block;background:#7B1E1E;color:#F8F4EC;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600">Pay balance securely →</a></p>
    <p style="font-size:12px;color:#8C7F6C">This link is processed by Stripe. If you didn't order from Beef Cartel, ignore this email.</p>`;
  await client().emails.send({
    from: from(),
    to: order.email,
    subject: `Beef Cartel — balance due for dispatch (${formatAUD(amount)})`,
    html: shell('Confirm your balance payment', body),
  });
}
