export type CurrencyDTO = {
  currencyId: number;
  currencyCode: string;
  currencyName: string;
  symbol?: string | null;
  isActive: boolean;
};