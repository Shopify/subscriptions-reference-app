const AddressFormSettingsQuery = `#graphql
query AddressFormSettings {
  shop {
    addressFormSettings {
      firstName {
        mode
      }
      company {
        mode
      }
      phone {
        mode
      }
      address2 {
        mode
      }
      addressAutocompletion
    }
  }
}
`;

export default AddressFormSettingsQuery;
