const travelPriceFormatter = new Intl.NumberFormat('en-SG', {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export function formatTravelPrice(amount: number, currencyCode = 'SGD') {
  return `${currencyCode} ${travelPriceFormatter.format(amount)}`;
}

export function getTravelPriceParts(amount: number, currencyCode = 'SGD') {
  return {
    amount: travelPriceFormatter.format(amount),
    currencyCode,
  };
}

export function parseFormattedTravelPrice(price: string) {
  const match = price.match(/^([A-Z]{3})\s+([0-9]+(?:\.[0-9]+)?)$/);

  if (!match) {
    return {
      amount: price,
      currencyCode: '',
    };
  }

  return {
    amount: match[2],
    currencyCode: match[1],
  };
}
