export function getMobileSafeProtocolURL(path: string) {
  const host = shopify.config?.host ? atob(shopify.config.host) : null;
  const mobile = shopify.environment.mobile;

  if (host && mobile) {
    return path.replace(/shopify:\/*admin/, `https://${host}`);
  }

  return path;
}
