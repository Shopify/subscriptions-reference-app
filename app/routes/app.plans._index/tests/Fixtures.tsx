export const mockPlans = [
  {
    id: 'gid://shopify/SellingPlanGroup/6',
    name: 'No product',
    createdAt: '2023-10-04T13:31:26Z',
    merchantCode: 'No product',
    options: ['get it every'],
    summary: '1 delivery frequency, 12% discount',
    productsCount: {count: 0},
    productVariantsCount: {count: 0},
    sellingPlans: {
      pageInfo: {hasNextPage: false},
      edges: [
        {
          node: {
            options: ['month'],
            pricingPolicies: [
              {
                adjustmentType: 'PERCENTAGE',
                adjustmentValue: {
                  percentage: 12,
                },
              },
            ],
            deliveryPolicy: {
              interval: 'MONTH',
              intervalCount: 1,
            },
          },
        },
      ],
    },
    products: {
      edges: [],
    },
  },
  {
    id: 'gid://shopify/SellingPlanGroup/5',
    name: 'Subscribe and Save',
    createdAt: '2023-10-03T17:14:10Z',
    merchantCode: 'subscribe-and-save',
    options: ['Deliver every'],
    summary: '2 delivery frequencies, $100-$300 discount',
    productsCount: {count: 1},
    productVariantsCount: {count: 0},
    sellingPlans: {
      pageInfo: {hasNextPage: false},
      edges: [
        {
          node: {
            options: ['1 Week(s)'],
            pricingPolicies: [
              {
                adjustmentType: 'FIXED_AMOUNT',
                adjustmentValue: {
                  amount: '100.0',
                  currencyCode: 'CAD',
                },
              },
            ],
            deliveryPolicy: {
              interval: 'WEEK',
              intervalCount: 1,
            },
          },
        },
        {
          node: {
            options: ['2 Week(s)'],
            pricingPolicies: [
              {
                adjustmentType: 'FIXED_AMOUNT',
                adjustmentValue: {
                  amount: '300.0',
                  currencyCode: 'CAD',
                },
              },
            ],
            deliveryPolicy: {
              interval: 'WEEK',
              intervalCount: 2,
            },
          },
        },
      ],
    },
    products: {
      edges: [
        {
          node: {
            id: 'gid://shopify/Product/2',
            title: 'Sleek Marble Chair',
          },
        },
      ],
    },
  },
];

export const mockedSellingPlanGroupsResponse = {
  SellingPlanGroups: {
    data: {
      sellingPlanGroups: {
        edges: mockPlans.map((plan) => ({node: plan})),
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '1',
          endCursor: '2',
        },
      },
    },
  },
};
