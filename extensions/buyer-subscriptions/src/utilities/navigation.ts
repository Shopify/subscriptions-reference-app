export function getSubscriptionIdFromPath(pathname: string) {
  const parts = pathname.split('/');

  const subscriptionsTextIndex = parts.lastIndexOf('subscriptions');

  if (!subscriptionsTextIndex || !parts?.[subscriptionsTextIndex + 1]) {
    // Replace these error throws with NotFound
    throw new Error(`Not found`);
  }

  const id = parts[subscriptionsTextIndex + 1];

  if (isNaN(Number(id))) {
    throw new Error(`Invalid subscription id`);
  }

  return id;
}
