export function generateTransactionId(prefix: string = "TRX"): string {
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  const transactionId = `${prefix}-${randomPart}`;
  return transactionId;
}
