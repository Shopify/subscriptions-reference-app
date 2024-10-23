import {Popover, Box, InlineStack, Icon, Text} from '@shopify/polaris';
import {AlertCircleIcon} from '@shopify/polaris-icons';
import {useTranslation} from 'react-i18next';
import {useState} from 'react';

export function InventoryErrorPopover() {
  const {t} = useTranslation('app.contracts');
  const [popOverActive, setPopOverActive] = useState(false);
  const togglePopoverActive = () => setPopOverActive(!popOverActive);

  const warningIconActivator = (
    <Box paddingInlineEnd="200">
      <div
        onMouseEnter={togglePopoverActive}
        onMouseLeave={togglePopoverActive}
      >
        <Icon tone="warning" source={AlertCircleIcon}></Icon>
      </div>
    </Box>
  );

  return (
    <Popover
      active={popOverActive}
      activator={warningIconActivator}
      onClose={togglePopoverActive}
      preferredAlignment="left"
      preferredPosition="below"
      fullWidth={false}
      sectioned={true}
    >
      <Box maxWidth="260px">
        <InlineStack wrap={false} gap="100">
          <span>
            <Icon tone="warning" source={AlertCircleIcon} />
          </span>
          <Text as="span" tone="caution">
            {t(`table.resourceName.warningToolTipContent`)}
          </Text>
        </InlineStack>
      </Box>
    </Popover>
  );
}
