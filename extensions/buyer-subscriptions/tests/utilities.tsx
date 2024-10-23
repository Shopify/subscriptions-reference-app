import type {ReactElement} from 'react';

import {render} from '@testing-library/react';

export async function mountWithAppContext(component: ReactElement) {
  return render(component);
}
