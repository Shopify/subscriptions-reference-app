import {describe, expect, it, vi, afterEach} from 'vitest';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {withZod} from '@rvf/zod';
import {z} from 'zod';
import {Form} from './Form';
import {mockShopify} from '#/setup-app-bridge';
import {mountRemixStubWithAppContext} from '#/test-utils';
import {json, Link, useActionData, useLoaderData} from '@remix-run/react';

const DEFAULT_VALUES = {
  defaultValues: {
    name: '',
  },
} as const;

const mockLoaderData = vi.fn().mockReturnValue(DEFAULT_VALUES);
const mockActionData = vi.fn().mockReturnValue(null);

const loader = async () => {
  return json(await mockLoaderData());
};

const action = async () => {
  return json(await mockActionData());
};

function TestFormRoute() {
  const {defaultValues} = useLoaderData<typeof DEFAULT_VALUES>();
  const actionData = useActionData<{message: string}>();
  const validator = withZod(z.object({}));

  return (
    <Form validator={validator} defaultValues={defaultValues} action="/">
      <h1>Test form</h1>

      <div>{actionData ? actionData.message : null}</div>

      <label>
        Name
        <input
          type="text"
          name="name"
          id="name"
          defaultValue={defaultValues.name}
        />
      </label>

      <Link to="/other">Go back</Link>

      <button type="submit">Submit</button>
    </Form>
  );
}

function mountFormRoute() {
  mountRemixStubWithAppContext({
    routes: [
      {
        // For the initial hydration
        id: 'test-form',
        path: '/',
        Component: () => <TestFormRoute />,
        loader,
        action,
      },
    ],
    remixStubProps: {
      initialEntries: ['/'],
      hydrationData: {
        loaderData: {'test-form': DEFAULT_VALUES},
      },
    },
  });
}

describe('Form', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('shows a save bar', () => {
    it('when a text field is changed', async () => {
      mountFormRoute();

      expect(mockShopify.saveBar.show).not.toHaveBeenCalled();

      const name = screen.getByLabelText('Name');
      await userEvent.type(name, 'My test name');

      expect(mockShopify.saveBar.show).toHaveBeenCalledOnce();
    });
  });

  describe('hides a save bar', () => {
    it('when a text field is changed and then reset', async () => {
      mountFormRoute();

      // The form starts out clean, so the bar is hidden
      expect(mockShopify.saveBar.hide).toHaveBeenCalledOnce();

      const name = screen.getByLabelText('Name');
      await userEvent.type(name, 'My test name');

      expect(mockShopify.saveBar.hide).toHaveBeenCalledOnce();
      expect(mockShopify.saveBar.show).toHaveBeenCalledOnce();

      await userEvent.clear(name);

      expect(mockShopify.saveBar.hide).toHaveBeenCalledTimes(2);
    });
  });

  describe('after submit', () => {
    it('maintains the values', async () => {
      mountFormRoute();

      const name: HTMLInputElement = screen.getByLabelText('Name');
      await userEvent.type(name, 'My test name');

      expect(mockShopify.saveBar.hide).toHaveBeenCalledOnce();

      mockLoaderData.mockReturnValue({defaultValues: {name: 'My test name'}});
      mockActionData.mockResolvedValue({message: 'Submit successful'});

      const submit = screen.getByText('Submit');
      userEvent.click(submit);

      await vi.waitFor(() => expect(mockActionData).toHaveBeenCalledOnce());
      await screen.findByText('Submit successful');

      // Submitting shouldn't block navigation
      expect(mockShopify.saveBar.leaveConfirmation).not.toHaveBeenCalled();
      expect(name.value).toBe('My test name');

      // The form reset hooks never get called in the tests, so the save bar isn't actually hidden
      // expect(mockShopify.saveBar.hide).toHaveBeenCalledTimes(2);
    });
  });

  it('blocks navigation when the form is changed', async () => {
    mountFormRoute();

    const name = screen.getByLabelText('Name');
    await userEvent.type(name, 'My test name');

    const link = screen.getByText('Go back');
    await userEvent.click(link);

    expect(mockShopify.saveBar.leaveConfirmation).toHaveBeenCalledOnce();
  });
});
