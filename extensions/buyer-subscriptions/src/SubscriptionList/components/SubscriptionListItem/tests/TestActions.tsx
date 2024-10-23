import userEvent from '@testing-library/user-event';
import {screen} from '@testing-library/react';

export async function subscriptionListPauseContract() {
  await userEvent.click(screen.getByRole('button', {name: 'Pause'}));

  return await userEvent.click(
    screen.getByRole('button', {name: 'Pause subscription'}),
  );
}

export async function subscriptionListResumeContract() {
  const resumeButton = screen.getByRole('button', {
    name: 'Resume',
  });
  await userEvent.click(resumeButton);

  const confirmResumeButton = screen.getByRole('button', {
    name: 'Continue',
  });
  await userEvent.click(confirmResumeButton);
}

export async function subscriptionListSkipNextOrder() {
  const skipButton = screen.getByRole('button', {
    name: 'Skip next order',
  });
  await userEvent.click(skipButton);

  const confirmSkipButton = screen.getByRole('button', {
    name: 'Skip',
  });
  await userEvent.click(confirmSkipButton);
}

export async function clickCloseButton() {
  const closeButton = screen.getByRole('button', {name: 'Close'});
  await userEvent.click(closeButton);
}
