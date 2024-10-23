export function mockUseToast() {
  const mockUseToast = vi.hoisted(() => {
    return vi.fn().mockReturnValue({showSuccessToast: vi.fn()});
  });

  vi.mock('utilities/hooks/useToast', async (importOriginal) => {
    const original = (await importOriginal()) as any;
    return {
      ...original,
      useToast: mockUseToast,
    };
  });

  function mockShowSuccessToast(showSuccessToastSpy: () => void) {
    mockUseToast.mockReturnValue({
      showSuccessToast: showSuccessToastSpy,
    });
  }

  return {mockShowSuccessToast};
}
