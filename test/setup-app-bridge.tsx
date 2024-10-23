import {vi, beforeEach} from 'vitest';

export const mockShopify = {
  modal: {
    hide: vi.fn(),
    show: vi.fn(),
    toggle: vi.fn(),
  },
  resourcePicker: vi.fn(),
  toast: {
    hide: vi.fn(),
    show: vi.fn(),
  },
  saveBar: {
    hide: vi.fn(),
    show: vi.fn(),
    toggle: vi.fn(),
  },
};

export function clearAppBridgeMocks() {
  mockShopify.modal.hide.mockClear();
  mockShopify.modal.show.mockClear();
  mockShopify.modal.toggle.mockClear();
  mockShopify.resourcePicker.mockClear();
  mockShopify.toast.hide.mockClear();
  mockShopify.toast.show.mockClear();
  mockShopify.saveBar.hide.mockClear();
  mockShopify.saveBar.show.mockClear();
  mockShopify.saveBar.toggle.mockClear();
}

type Props = {children: React.ReactNode};

function TitleBarMock({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <>
      <p>{title}</p>
      <div>{children}</div>
    </>
  );
}

function ModalMock({
  children,
  open,
  onHide,
}: {
  children: React.ReactNode;
  open: boolean;
  onHide: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div role="dialog" aria-label="dialog">
      <button type="button" onClick={onHide}>
        Close overlay
      </button>
      {children}
    </div>
  );
}

vi.mock('@shopify/app-bridge-react', () => ({
  useAppBridge: () => mockShopify,
  Modal: ModalMock,
  TitleBar: TitleBarMock,
  NavMenu: ({children}: Props) => <div>{children}</div>,
  SaveBar: ({children}: Props) => <div>{children}</div>,
}));

beforeEach(() => {
  clearAppBridgeMocks();
});
