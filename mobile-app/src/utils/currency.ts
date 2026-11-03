export const CURRENCY_SYMBOL = 'P';

export function formatPula(value: number): string {
  const sign = value < 0 ? '-' : '';
  const [whole, fraction] = Math.abs(value).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${CURRENCY_SYMBOL} ${grouped}${fraction === '00' ? '' : `.${fraction}`}`;
}

export function formatPricePerNight(value: number): string {
  return `${formatPula(value)} / night`;
}
