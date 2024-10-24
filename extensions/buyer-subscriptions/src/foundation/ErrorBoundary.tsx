import React, {useEffect} from 'react';
import {BlockStack, Text} from '@shopify/ui-extensions-react/customer-account';
import {useExtensionApi} from './Api';

export interface Props {
  children: React.ReactNode;
}
interface State {
  error?: Error;
}

interface ErrorContentProps {
  error: Error;
}

const ErrorContent = ({error}: ErrorContentProps) => {
  const {i18n} = useExtensionApi();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary', error);
    }
  }, [error]);

  return (
    <BlockStack inlineAlignment="center" spacing="loose">
      <Text>{i18n.translate('errorBoundary.content')}</Text>
    </BlockStack>
  );
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {error: undefined};

  componentDidCatch(error: Error) {
    this.setState({error});
  }

  render() {
    const {error} = this.state;
    const {children} = this.props;

    return error ? <ErrorContent error={error} /> : children;
  }
}
