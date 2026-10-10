import { DrinkStock, ShiftReportDrinkSale } from '../types/shift-report-type';

interface DrinkSalesSummaryRow {
  productName: string;
  quantity: number;
  unitPrice: number;
  cashAmount: number;
  transferAmount: number;
  amount: number;
  remaining: number | null;
}

// Dùng chung cho bản in và Excel, giữ cả sản phẩm không bán và lịch sử
// sản phẩm đã bị xóa khỏi danh mục tồn kho.
export function summarizeDrinkSales(
  drinkSales: ShiftReportDrinkSale[],
  drinkStocks: DrinkStock[]
): DrinkSalesSummaryRow[] {
  const soldByCode = new Map<string, DrinkSalesSummaryRow>();
  for (const drink of drinkSales) {
    const quantity = drink.Quantity || 0;
    const amount = quantity * (drink.UnitPrice || 0);
    const sold = soldByCode.get(drink.ProductCode) ?? {
      productName: drink.ProductName,
      quantity: 0,
      unitPrice: drink.UnitPrice || 0,
      cashAmount: 0,
      transferAmount: 0,
      amount: 0,
      remaining: null,
    };
    sold.quantity += quantity;
    sold.amount += amount;
    if (drink.PaymentMethod === 'Tiền mặt') sold.cashAmount += amount;
    if (drink.PaymentMethod === 'Chuyển khoản') sold.transferAmount += amount;
    soldByCode.set(drink.ProductCode, sold);
  }

  const rows = drinkStocks.map<DrinkSalesSummaryRow>(stock => {
    const sold = soldByCode.get(stock.ProductCode);
    return {
      productName: stock.ProductName,
      quantity: sold?.quantity ?? 0,
      unitPrice: sold?.unitPrice ?? stock.UnitPrice,
      cashAmount: sold?.cashAmount ?? 0,
      transferAmount: sold?.transferAmount ?? 0,
      amount: sold?.amount ?? 0,
      remaining: stock.Remaining,
    };
  });
  const knownCodes = new Set(drinkStocks.map(stock => stock.ProductCode));
  for (const [code, sold] of soldByCode) {
    if (!knownCodes.has(code)) rows.push(sold);
  }
  return rows;
}
