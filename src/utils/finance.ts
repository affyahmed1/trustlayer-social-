export interface FinancialCalculationInput {
  items: {
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    taxRate?: number;
  }[];
  invoiceDiscountPercent?: number;
  shippingFee?: number;
  additionalFees?: number;
  amountPaid?: number;
}

export interface FinancialCalculationResult {
  subtotal: number;
  itemDiscounts: number;
  invoiceDiscountPercent: number;
  invoiceDiscountAmount: number;
  shippingFee: number;
  additionalFees: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
}

export function calculateLineTotal(
  quantity: number,
  unitPrice: number,
  discountPercent: number = 0
): number {
  const qty = Math.max(0, Number(quantity) || 0);
  const price = Math.max(0, Number(unitPrice) || 0);
  const discount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const gross = qty * price;
  const net = gross * (1 - discount / 100);
  return Math.round(net * 100) / 100;
}

export function calculateFinancials(input: FinancialCalculationInput): FinancialCalculationResult {
  let subtotal = 0;
  let totalItemDiscounts = 0;
  let lineTaxTotal = 0;

  for (const item of input.items || []) {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const price = Math.max(0, Number(item.unitPrice) || 0);
    const discPct = Math.min(100, Math.max(0, Number(item.discountPercent) || 0));
    const taxRate = Math.max(0, Number(item.taxRate) || 0);

    const gross = qty * price;
    const discountAmount = gross * (discPct / 100);
    const lineNet = gross - discountAmount;

    subtotal += gross;
    totalItemDiscounts += discountAmount;

    const lineTax = lineNet * (taxRate / 100);
    lineTaxTotal += lineTax;
  }

  const invoiceDiscPct = Math.min(100, Math.max(0, Number(input.invoiceDiscountPercent) || 0));
  const shippingFee = Math.max(0, Number(input.shippingFee) || 0);
  const additionalFees = Math.max(0, Number(input.additionalFees) || 0);

  const netAfterItemDiscounts = subtotal - totalItemDiscounts;
  const invoiceDiscountAmount = netAfterItemDiscounts * (invoiceDiscPct / 100);
  const taxableAmount = Math.max(0, netAfterItemDiscounts - invoiceDiscountAmount);

  // Pro-rated tax adjustment if invoice-level discount applied
  const taxFactor = netAfterItemDiscounts > 0 ? taxableAmount / netAfterItemDiscounts : 1;
  const finalTaxAmount = Math.round(lineTaxTotal * taxFactor * 100) / 100;

  const total = Math.round((taxableAmount + finalTaxAmount + shippingFee + additionalFees) * 100) / 100;
  const amountPaid = Math.max(0, Number(input.amountPaid) || 0);
  const amountDue = Math.max(0, Math.round((total - amountPaid) * 100) / 100);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    itemDiscounts: Math.round(totalItemDiscounts * 100) / 100,
    invoiceDiscountPercent: invoiceDiscPct,
    invoiceDiscountAmount: Math.round(invoiceDiscountAmount * 100) / 100,
    shippingFee: Math.round(shippingFee * 100) / 100,
    additionalFees: Math.round(additionalFees * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    taxAmount: finalTaxAmount,
    total,
    amountPaid,
    amountDue,
  };
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return `${currency} ${safeAmount.toFixed(2)}`;
  }
}
