/**
 * Create an admin path for a given shop context value
 * The function is playing for Spin and for Shopify domain
 * @param shopInfo shop context value
 * @param adminPath the admin path to redirect to (ex: /customers/2)
 */
export function buildAdminURL(
  shopifyDomain: string,
  adminPath: string,
): string {
  const domain = new URL(shopifyDomain);
  const base = domain.hostname;
  const isSpinDev = base.includes('spin.dev');

  if (isSpinDev) {
    const domain = base.split('.').slice(0, 1).join('.');
    const spinPart = base.split('.').slice(2).join('.');
    const path = `/store/${domain}`;
    return `https://admin.web.${spinPart}${path}${adminPath}`;
  } else {
    const domain = base.split('.').slice(0, -2).join('.');
    const path = `/store/${domain}`;
    return `https://admin.shopify.com${path}${adminPath}`;
  }
}
