import {json, type LoaderFunctionArgs} from '@remix-run/node';
import {authenticate} from '~/shopify.server';
import {getCurrentBulkOperation} from '~/utils/bulkOperations/bulkOperations';

export async function loader({request}: LoaderFunctionArgs) {
  const {admin} = await authenticate.admin(request);

  const bulkOperation = await getCurrentBulkOperation(
    admin.graphql,
    'MUTATION',
  );

  return json(bulkOperation);
}

export function shouldRevalidate() {
  return false;
}
