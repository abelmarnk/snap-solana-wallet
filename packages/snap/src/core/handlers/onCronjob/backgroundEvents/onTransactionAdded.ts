import { InternalError, type OnCronjobHandler } from '@metamask/snaps-sdk';
import { assert, literal, object, string } from '@metamask/superstruct';

import { analyticsService, keyring } from '../../../../snapContext';
import logger from '../../../utils/logger';
import { NetworkStruct, UuidStruct } from '../../../validation/structs';
import { ScheduleBackgroundEventMethod } from './ScheduleBackgroundEventMethod';

export const OnTransactionAddedRequestStruct = object({
  id: string(),
  jsonrpc: literal('2.0'),
  method: literal(ScheduleBackgroundEventMethod.OnTransactionAdded),
  params: object({
    accountId: UuidStruct,
    metadata: object({
      scope: NetworkStruct,
      origin: string(),
    }),
  }),
});

/**
 * Handles side effects that need to happen when a transaction is shown in confirmation UI.
 *
 * @param args - The arguments object.
 * @param args.request - The request object containing transaction details.
 * @returns A promise that resolves when the side effects are complete.
 */
export const onTransactionAdded: OnCronjobHandler = async ({ request }) => {
  try {
    logger.info('[onTransactionAdded] Cronjob triggered', request);

    assert(request, OnTransactionAddedRequestStruct);

    const { accountId, metadata } = request.params;

    const account = await keyring.getAccountOrThrow(accountId);

    await analyticsService.trackEventTransactionAdded(account, metadata);
  } catch (error) {
    logger.error(error);
    throw new InternalError(error as string) as Error;
  }
};
