import {SellingPlanDetailsFragment} from './SellingPlanDetailsFragment';

const CreateSellingPlanGroup = `#graphql
  mutation CreateSellingPlanGroup(
    $input: SellingPlanGroupInput!
    $resources: SellingPlanGroupResourceInput
  ) {
    sellingPlanGroupCreate(input: $input, resources: $resources) {
      sellingPlanGroup {
        id
        sellingPlans(first: 31) {
          edges {
            node {
            ...SellingPlanDetails
            }
          }
        }
      }
      userErrors {
        message
      }
    }
  }
  ${SellingPlanDetailsFragment}
`;

export default CreateSellingPlanGroup;
