import {TEST_SHOP} from '#/constants';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {logger} from '~/utils/logger.server';
import {AfterAuthService} from '../AfterAuthService';

const session = {shop: TEST_SHOP};
const admin = {id: 1};

describe('AfterAuthService', async () => {
  afterAll(async () => {
    vi.restoreAllMocks();
  });

  describe('AfterAuthService', async () => {
    describe('#steps', async () => {
      let afterAuthService: AfterAuthService;

      beforeAll(() => {
        afterAuthService = new AfterAuthService(session, admin);
      });

      it('all steps should be named', async () => {
        afterAuthService.steps.forEach((step) => {
          expect(step.name).toBeDefined();
          expect(step.name).not.toEqual('');
        });
      });

      it('all steps should be async functions', async () => {
        afterAuthService.steps.forEach((step) => {
          expect(step).toBeInstanceOf(Function);
          expect(step.constructor.name).toEqual('AsyncFunction');
        });
      });
    });
    describe('#run', async () => {
      it('should call all steps', async () => {
        const steps = [vi.fn(), vi.fn(), vi.fn()];

        const installer = new AfterAuthService(session, admin);
        installer.steps = steps;

        await installer.run();
        steps.forEach((step) => {
          expect(step).toHaveBeenCalled();
        });
      });

      describe('when a step fails', async () => {
        let installer: AfterAuthService;
        let steps: Array<Function>;

        beforeAll(() => {
          steps = [
            vi.fn(),
            vi.fn(async function StepThatFails() {
              throw new Error('Step failed');
            }),
            vi.fn(),
          ];
          installer = new AfterAuthService(session, admin);
          installer.steps = steps;
        });

        it('Other steps should still run', async () => {
          await installer.run();

          steps.forEach((step) => {
            expect(step).toHaveBeenCalled();
          });
        });

        it('should log error', async () => {
          const spy = vi.spyOn(logger, 'error');

          await installer.run();
          expect(spy).toHaveBeenCalledWith(
            {
              shop: session.shop,
              step: 'StepThatFails',
            },
            'Initial step "StepThatFails" failed with "Error: Step failed"',
          );
        });
      });
    });
  });
});
