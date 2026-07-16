export const formatCurrency = (amount: number | null | undefined): string => {
    const safeAmount = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
    return `₹${safeAmount.toFixed(2)}`;
  };