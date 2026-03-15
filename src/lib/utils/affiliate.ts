// eBay Partner Network (EPN)
// Campaign ID is obtained from partner.ebay.com after joining EPN
// Program: https://partnernetwork.ebay.com

const EPN_CAMPAIGN_ID = process.env.EBAY_AFFILIATE_CAMPAIGN_ID ?? '';
const EPN_CUSTOM_ID = 'autopartsfinder'; // trackable sub-ID

/**
 * Wraps an eBay listing URL with EPN affiliate tracking.
 * Returns the original URL if affiliate is not configured.
 */
export function buildEbayAffiliateUrl(originalUrl: string): string {
  if (!EPN_CAMPAIGN_ID || EPN_CAMPAIGN_ID === 'placeholder') {
    return originalUrl;
  }

  // EPN rover URL format
  const roverUrl = new URL('https://rover.ebay.com/rover/1/711-53200-19255-0/1');
  roverUrl.searchParams.set('ff3', '4');
  roverUrl.searchParams.set('pub', '5575'); // eBay publisher ID placeholder
  roverUrl.searchParams.set('toolid', '10001');
  roverUrl.searchParams.set('campid', EPN_CAMPAIGN_ID);
  roverUrl.searchParams.set('customid', EPN_CUSTOM_ID);
  roverUrl.searchParams.set('mpre', originalUrl);

  return roverUrl.toString();
}

/**
 * Builds an affiliate URL for any source.
 * Currently only eBay has affiliate support. Others return original.
 */
export function buildAffiliateUrl(sourceKey: string, originalUrl: string): string {
  switch (sourceKey) {
    case 'ebay':
      return buildEbayAffiliateUrl(originalUrl);
    default:
      return originalUrl;
  }
}

/**
 * Returns the estimated commission info for display.
 */
export function getCommissionInfo(sourceKey: string): { supported: boolean; rate?: string } {
  if (sourceKey === 'ebay') {
    return { supported: true, rate: '1-4% per sale' };
  }
  return { supported: false };
}
