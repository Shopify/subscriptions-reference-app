import {parseGid} from '@shopify/admin-graphql-api-utilities';
import {
  Heading,
  Card,
  BlockStack,
  Grid,
  Text,
  Link,
} from '@shopify/ui-extensions-react/customer-account';
import {useExtensionApi} from 'foundation/Api';

import {useFormatDate} from 'utilities/hooks/useFormatDate';

interface Order {
  id: string;
  createdAt: string;
}

export interface PastOrdersCardProps {
  orders: Order[];
}

export function PastOrdersCard({orders}: PastOrdersCardProps) {
  const {i18n} = useExtensionApi();
  const formatDate = useFormatDate();

  return (
    <Card padding>
      <BlockStack spacing="base">
        <Heading level={2}>
          {i18n.translate('pastOrdersCard.pastOrders')}
        </Heading>
        <BlockStack spacing="tight">
          {orders.map(({id, createdAt}) => (
            <Grid key={id} columns={['fill', 'auto']}>
              <Text>{formatDate(createdAt)}</Text>
              <Link to={`shopify:/customer-account/orders/${parseGid(id)}`}>
                {i18n.translate('pastOrdersCard.view')}
              </Link>
            </Grid>
          ))}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
