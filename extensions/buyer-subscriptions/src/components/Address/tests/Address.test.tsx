import {mockApis} from 'tests/mocks/api';
import {mockUiExtensionComponents} from 'tests/mocks/components';
import {mountWithAppContext} from 'tests/utilities';
import {screen, waitFor} from '@testing-library/react';

import {Address} from '../Address';

const {mockExtensionApi} = mockApis();

describe('Address', () => {
  beforeEach(() => {
    mockUiExtensionComponents();
    mockExtensionApi();
  });

  it('renders the formatted address', async () => {
    const address = {
      address1: '150 Elgin Street',
      address2: '8th Floor',
      firstName: 'John',
      lastName: 'Smith',
      city: 'Ottawa',
      province: 'ON',
      country: 'CA',
      zip: 'K2P1L4',
    };

    await mountWithAppContext(<Address address={address} />);

    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    expect(screen.getByText('150 Elgin Street')).toBeInTheDocument();
    expect(screen.getByText('8th Floor')).toBeInTheDocument();
    expect(screen.getByText('Ottawa Ontario K2P1L4')).toBeInTheDocument();
  });
});
