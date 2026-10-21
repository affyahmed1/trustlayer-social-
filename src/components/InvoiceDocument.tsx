import React from 'react';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/finance';
import { ShieldCheck, CheckCircle2, QrCode, Building2, Calendar, FileText } from 'lucide-react';

interface InvoiceDocumentProps {
  invoice: Invoice;
  showVerificationHeader?: boolean;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({
  invoice,
  showVerificationHeader = true,
}) => {
  const {
    reference,
    invoiceNumber,
    issueDate,
    dueDate,
    paymentTerms,
    poNumber,
    currency,
    issuer,
    buyer,
    items,
    financials,
    paymentInfo,
    deliveryDetails,
    additionalInfo,
    template,
    verificationStatus,
    fingerprint,
    status,
  } = invoice;

  const primaryColor = template?.primaryColor || '#2563EB';
  const templateStyle = template?.name || 'professional';

  // Stylized TrustLayer verification QR code
  const qrSvg = (
    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-200">
      <div className="w-16 h-16 bg-white p-1 rounded border border-slate-200 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800" fill="currentColor">
          <rect x="5" y="5" width="25" height="25" fill="#1e293b" />
          <rect x="10" y="10" width="15" height="15" fill="#ffffff" />
          <rect x="70" y="5" width="25" height="25" fill="#1e293b" />
          <rect x="75" y="10" width="15" height="15" fill="#ffffff" />
          <rect x="5" y="70" width="25" height="25" fill="#1e293b" />
          <rect x="10" y="75" width="15" height="15" fill="#ffffff" />
          <rect x="35" y="10" width="10" height="10" fill="#1e293b" />
          <rect x="50" y="20" width="10" height="10" fill="#1e293b" />
          <rect x="35" y="45" width="30" height="10" fill="#1e293b" />
          <rect x="45" y="60" width="10" height="20" fill="#1e293b" />
          <rect x="65" y="65" width="20" height="20" fill="#1e293b" />
          <rect x="75" y="40" width="10" height="15" fill="#1e293b" />
        </svg>
      </div>
      <span className="text-[10px] font-mono font-semibold text-slate-600 mt-1 tracking-wider">
        {invoiceNumber || reference || 'DRAFT'}
      </span>
    </div>
  );

  return (
    <div
      id="printable-invoice"
      className="bg-white text-slate-900 shadow-sm border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 text-xs sm:text-sm"
      style={{ minHeight: '840px' }}
    >
      {/* TrustLayer Top Verification Banner */}
      {showVerificationHeader && (
        <div className="bg-slate-900 text-white px-6 py-2.5 flex items-center justify-between text-xs border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold tracking-wide">TrustLayer Verified Record</span>
            {invoiceNumber || reference ? (
              <span className="font-mono bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px]">
                {invoiceNumber || reference}
              </span>
            ) : (
              <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[11px] font-medium">
                Draft Record
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
            {fingerprint && (
              <span className="hidden sm:inline font-mono truncate max-w-[200px]" title={fingerprint}>
                SHA-256: {fingerprint.slice(0, 16)}...
              </span>
            )}
            <span className="uppercase text-[10px] font-semibold tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              {status.replace('_', ' ')}
            </span>
          </div>
        </div>
      )}

      {/* Invoice Header */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                {issuer.name ? issuer.name.charAt(0) : 'T'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{issuer.name}</h2>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{issuer.username}</span>
                  {issuer.verified && (
                    <span className="inline-flex items-center text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" />
                      Verified
                    </span>
                  )}
                  {issuer.id && <span className="font-mono text-slate-400">{issuer.id}</span>}
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-500 space-y-0.5 leading-relaxed max-w-sm">
              <p>{issuer.address}</p>
              <p>{issuer.country}</p>
              <p>
                {issuer.email} &bull; {issuer.phone}
              </p>
              {issuer.taxId && <p className="font-mono text-slate-600">Tax ID: {issuer.taxId}</p>}
            </div>
          </div>

          <div className="flex flex-col sm:items-end sm:text-right">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              {invoice.invoiceType || 'Invoice'}
            </h1>
            <div className="mt-1 font-mono font-semibold text-slate-800 text-sm">
              {invoiceNumber}
            </div>

            <div className="mt-3 space-y-1 text-xs">
              <div className="flex sm:justify-end gap-3">
                <span className="text-slate-400">Issue Date:</span>
                <span className="font-medium text-slate-700">{issueDate}</span>
              </div>
              <div className="flex sm:justify-end gap-3">
                <span className="text-slate-400">Due Date:</span>
                <span className="font-semibold text-slate-900">{dueDate}</span>
              </div>
              <div className="flex sm:justify-end gap-3">
                <span className="text-slate-400">Payment Terms:</span>
                <span className="font-medium text-slate-700">{paymentTerms}</span>
              </div>
              {poNumber && (
                <div className="flex sm:justify-end gap-3">
                  <span className="text-slate-400">PO Number:</span>
                  <span className="font-mono text-slate-700">{poNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Counterparty / Billed To Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-2">
          <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Billed To
            </span>
            <h3 className="font-bold text-slate-900 text-sm">{buyer.name || 'Customer Name'}</h3>
            {buyer.username && (
              <span className="text-xs font-medium text-indigo-600 block mb-1">
                {buyer.username}
              </span>
            )}
            <div className="text-xs text-slate-500 space-y-0.5 leading-relaxed mt-2">
              {buyer.contactPerson && <p className="text-slate-700 font-medium">{buyer.contactPerson}</p>}
              <p>{buyer.address}</p>
              <p>{buyer.country}</p>
              <p>
                {buyer.email} &bull; {buyer.phone}
              </p>
              {buyer.taxId && <p className="font-mono text-slate-600">Tax ID: {buyer.taxId}</p>}
            </div>
          </div>

          <div className="flex justify-between sm:justify-end items-center sm:items-start space-x-4 bg-slate-50/70 p-4 rounded-lg border border-slate-100">
            <div className="space-y-1 text-xs sm:text-right">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Verification Details
              </span>
              <div>
                <span className="text-slate-400">Reference: </span>
                <span className="font-mono font-bold text-slate-800">
                  {reference || 'PENDING'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Currency: </span>
                <span className="font-semibold text-slate-800">{currency}</span>
              </div>
              {deliveryDetails?.incoterms && (
                <div>
                  <span className="text-slate-400">Incoterms: </span>
                  <span className="text-slate-700">{deliveryDetails.incoterms}</span>
                </div>
              )}
              {deliveryDetails?.trackingReference && (
                <div>
                  <span className="text-slate-400">Tracking: </span>
                  <span className="font-mono text-slate-700">{deliveryDetails.trackingReference}</span>
                </div>
              )}
            </div>
            {qrSvg}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-600"
                style={{ backgroundColor: `${primaryColor}08` }}
              >
                <th className="py-2.5 px-3">Item & Description</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-right">Disc %</th>
                <th className="py-2.5 px-3 text-right">Tax %</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items && items.length > 0 ? (
                items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{item.name || 'Untitled Item'}</div>
                      {item.description && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {item.sku || '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700">
                      {item.quantity} <span className="text-slate-400 text-[10px]">{item.unit || ''}</span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 font-mono">
                      {formatCurrency(item.unitPrice, currency)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500">
                      {item.discountPercent > 0 ? `${item.discountPercent}%` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500">
                      {item.taxRate > 0 ? `${item.taxRate}%` : '0%'}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-900 font-mono">
                      {formatCurrency(item.total, currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No line items added
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Payment Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          {/* Left: Payment info & Bank details */}
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Payment Instructions
              </span>
              <div className="text-xs space-y-1 text-slate-600">
                {paymentInfo?.bankName && (
                  <div>
                    <span className="text-slate-400">Bank:</span>{' '}
                    <span className="font-medium text-slate-800">{paymentInfo.bankName}</span>
                  </div>
                )}
                {paymentInfo?.accountHolder && (
                  <div>
                    <span className="text-slate-400">Beneficiary:</span>{' '}
                    <span className="font-medium text-slate-800">{paymentInfo.accountHolder}</span>
                  </div>
                )}
                {paymentInfo?.accountNumber && (
                  <div>
                    <span className="text-slate-400">Account / IBAN:</span>{' '}
                    <span className="font-mono font-medium text-slate-800">{paymentInfo.accountNumber}</span>
                  </div>
                )}
                {paymentInfo?.swiftBic && (
                  <div>
                    <span className="text-slate-400">SWIFT / BIC:</span>{' '}
                    <span className="font-mono font-medium text-slate-800">{paymentInfo.swiftBic}</span>
                  </div>
                )}
                {paymentInfo?.instructions && (
                  <p className="mt-2 text-slate-500 italic text-[11px]">{paymentInfo.instructions}</p>
                )}
              </div>
            </div>

            {additionalInfo?.notes && (
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-700 block mb-0.5">Notes</span>
                <p className="text-slate-500 text-[11px] leading-relaxed">{additionalInfo.notes}</p>
              </div>
            )}
          </div>

          {/* Right: Calculations */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(financials.subtotal, currency)}</span>
            </div>

            {financials.itemDiscounts > 0 && (
              <div className="flex justify-between py-1 text-emerald-600 border-b border-slate-100">
                <span>Item Discounts</span>
                <span className="font-mono">-{formatCurrency(financials.itemDiscounts, currency)}</span>
              </div>
            )}

            {financials.invoiceDiscountAmount > 0 && (
              <div className="flex justify-between py-1 text-emerald-600 border-b border-slate-100">
                <span>Invoice Discount</span>
                <span className="font-mono">-{formatCurrency(financials.invoiceDiscountAmount, currency)}</span>
              </div>
            )}

            {financials.shippingFee > 0 && (
              <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                <span>Shipping & Handling</span>
                <span className="font-mono">{formatCurrency(financials.shippingFee, currency)}</span>
              </div>
            )}

            {financials.additionalFees > 0 && (
              <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                <span>Additional Fees</span>
                <span className="font-mono">{formatCurrency(financials.additionalFees, currency)}</span>
              </div>
            )}

            <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
              <span>Tax</span>
              <span className="font-mono">{formatCurrency(financials.taxAmount, currency)}</span>
            </div>

            <div className="flex justify-between py-2 text-base font-bold text-slate-900 border-b-2 border-slate-900 pt-2">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(financials.total, currency)}</span>
            </div>

            {financials.amountPaid > 0 && (
              <div className="flex justify-between py-1 text-emerald-600">
                <span>Amount Paid</span>
                <span className="font-mono">-{formatCurrency(financials.amountPaid, currency)}</span>
              </div>
            )}

            <div className="flex justify-between py-2 bg-slate-900 text-white px-3 rounded-lg font-bold">
              <span>Amount Due</span>
              <span className="font-mono">{formatCurrency(financials.amountDue, currency)}</span>
            </div>
          </div>
        </div>

        {/* Footer & Signatory */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs text-slate-400">
          <div className="space-y-1">
            <p className="font-medium text-slate-600">Terms & Conditions</p>
            <p className="text-[11px] text-slate-400 max-w-md leading-relaxed">
              {additionalInfo?.terms ||
                'Payment due according to specified terms. Goods remain the property of the seller until paid in full.'}
            </p>
          </div>

          {additionalInfo?.signatoryName && (
            <div className="text-right sm:min-w-[160px]">
              <div className="border-b border-slate-300 pb-1 mb-1">
                <span className="font-serif italic text-slate-700 text-base">
                  {additionalInfo.signatoryName}
                </span>
              </div>
              <p className="font-semibold text-slate-700 text-xs">{additionalInfo.signatoryName}</p>
              <p className="text-[10px] text-slate-400">{additionalInfo.signatoryTitle || 'Authorized Signatory'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
