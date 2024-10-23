export const getPaginationQueryVariablesFromUrl = (url, pageSize = 25) => {
  if (!url) return {};

  const afterCursor = url.searchParams.get('after');
  const beforeCursor = url.searchParams.get('before');

  return {
    first: afterCursor || !beforeCursor ? pageSize : null,
    last: beforeCursor ? pageSize : null,
    after: afterCursor ?? null,
    before: beforeCursor ?? null,
  };
};

export function clearPaginationParams(params: URLSearchParams) {
  params.delete('after');
  params.delete('before');
}
