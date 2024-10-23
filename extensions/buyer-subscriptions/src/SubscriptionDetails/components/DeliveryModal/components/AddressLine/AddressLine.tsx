import {useCallback} from 'react';
import type {Country, Address as AddressType} from '@shopify/address';
import {FieldName} from '@shopify/address';
import {
  TextField,
  Select,
  Grid,
  Style,
  PhoneField,
} from '@shopify/ui-extensions-react/customer-account';

interface SelectOption {
  label: string;
  value: string;
}

interface AddressLineProps {
  countries: Country[];
  country: Country;
  line: FieldName[];
  address: AddressType;
  countrySelectOptions: SelectOption[];
  zoneSelectOptions: SelectOption[];
  onChange(newValue: Partial<AddressType>): void;
  formErrors: {[key in FieldName]?: string};
  disabled?: boolean;
}

export function AddressLine({
  line,
  countries,
  country,
  address,
  countrySelectOptions,
  zoneSelectOptions,
  onChange,
  formErrors,
  disabled,
}: AddressLineProps) {
  const displayLine = [...line];

  const handleChange = useCallback(
    (field: FieldName) => {
      return (value: string) => {
        onChange({[field]: value});
      };
    },
    [onChange],
  );

  const handleCountryChange = useCallback(
    (nextCountryCode: string) => {
      const country = countries.find(
        (country) => country.code === nextCountryCode,
      );
      onChange({
        zip: '',
        city: '',
        phone: '',
        address1: '',
        address2: '',
        country: nextCountryCode,
        province:
          country && country.zones.length > 0 ? country.zones[0].code : '',
      });
    },
    [countries, onChange],
  );

  const fields = displayLine
    .map((field) => {
      switch (field) {
        case FieldName.FirstName:
          return (
            <TextField
              key={field}
              label={country.labels.firstName}
              onChange={handleChange(field)}
              value={address[field]}
              error={formErrors[field]}
              disabled={disabled}
            />
          );
        case FieldName.LastName:
          return (
            <TextField
              key={field}
              label={country.labels.lastName}
              onChange={handleChange(field)}
              value={address[field]}
              error={formErrors[field]}
              disabled={disabled}
            />
          );
        case FieldName.Country:
          return (
            <Select
              key={field}
              label={country.labels.country}
              value={address[field]}
              options={countrySelectOptions}
              onChange={handleCountryChange}
              error={formErrors[field]}
              disabled={disabled}
            />
          );
        case FieldName.Address1:
          return (
            <TextField
              key={field}
              label={country.labels.address1}
              onChange={handleChange(field)}
              value={address[field]}
              error={formErrors[field]}
              disabled={disabled}
            />
          );
        case FieldName.Address2:
          return (
            <TextField
              key={field}
              label={country.optionalLabels.address2}
              onChange={handleChange(field)}
              value={address[field]}
              error={formErrors[field]}
              disabled={disabled}
            />
          );
        case FieldName.Zone:
          return (
            <Select
              key={field}
              label={country.labels.zone}
              value={address[field]}
              options={zoneSelectOptions}
              onChange={handleChange(field)}
              error={formErrors[field]}
              disabled={disabled}
            />
          );
        case FieldName.PostalCode:
          return (
            <TextField
              key={field}
              label={country.labels.postalCode}
              onChange={handleChange(field)}
              value={address[field]}
              error={formErrors[field]}
              disabled={disabled}
            />
          );
        case FieldName.City:
          return (
            <TextField
              key={field}
              label={country.labels.city}
              onChange={handleChange(field)}
              value={address[field]}
              error={formErrors[field]}
              disabled={disabled}
            />
          );
        case FieldName.Phone:
          return (
            <PhoneField
              key={field}
              label={country.labels.phone}
              onChange={handleChange(field)}
              value={address[field]}
              error={formErrors[field]}
              disabled={disabled}
            />
          );
        default:
          return null;
      }
    })
    .filter((field) => field !== null);

  return fields.length > 0 ? (
    <Grid
      columns={Style.default(['1fr']).when(
        {viewportInlineSize: {min: 'small'}},
        new Array(fields.length).fill('1fr'),
      )}
      rows="auto"
      spacing="base"
    >
      {fields}
    </Grid>
  ) : null;
}
