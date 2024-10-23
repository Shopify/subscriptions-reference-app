import {useNavigate, useSearchParams} from '@remix-run/react';
import {useEffect} from 'react';

export function useSellingPlanGroupRedirect() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // The 'Manage' link in the purchase options card appends a sellingPlanGroupId to the URL.
  // If it's present, we redirect to the selling plan group page.
  // Can't do this in a loader because there is no way to remove the url params in a redirect,
  // and we end up in an infanite loop if we keep the plan id in the url.
  const sellingPlanGroupId = searchParams.get('sellingPlanGroupId');
  useEffect(() => {
    if (sellingPlanGroupId) {
      searchParams.delete('sellingPlanGroupId');
      setSearchParams(searchParams);
      navigate(`/app/plans/${sellingPlanGroupId}`, {
        replace: true,
      });
    }
  }, [navigate, searchParams, sellingPlanGroupId, setSearchParams]);
}
