import { KeyringRpcMethod } from '@metamask/keyring-api';
import { handleKeyringRequest } from '@metamask/keyring-snap-sdk';
import type {
  Json,
  OnActiveHandler,
  OnAssetHistoricalPriceHandler,
  OnAssetsConversionHandler,
  OnAssetsLookupHandler,
  OnAssetsMarketDataHandler,
  OnClientRequestHandler,
  OnCronjobHandler,
  OnInactiveHandler,
  OnInstallHandler,
  OnKeyringRequestHandler,
  OnNameLookupHandler,
  OnProtocolRequestHandler,
  OnStartHandler,
  OnUpdateHandler,
  OnUserInputHandler,
  OnWebSocketEventHandler,
} from '@metamask/snaps-sdk';
import {
  MethodNotFoundError,
  type OnRpcRequestHandler,
} from '@metamask/snaps-sdk';
import { assert, enums } from '@metamask/superstruct';
import BigNumber from 'bignumber.js';

import { onAssetHistoricalPrice as onAssetHistoricalPriceHandler } from './core/handlers/onAssetHistoricalPrice/onAssetHistoricalPrice';
import { onAssetsConversion as onAssetsConversionHandler } from './core/handlers/onAssetsConversion/onAssetsConversion';
import { onAssetsLookup as onAssetsLookupHandler } from './core/handlers/onAssetsLookup/onAssetsLookup';
import { onAssetsMarketData as onAssetsMarketDataHandler } from './core/handlers/onAssetsMarketData/onAssetsMarketData';
import { handlers as onCronjobHandlers } from './core/handlers/onCronjob';
import { ScheduleBackgroundEventMethod } from './core/handlers/onCronjob/backgroundEvents/ScheduleBackgroundEventMethod';
import { CronjobMethod } from './core/handlers/onCronjob/cronjobs/CronjobMethod';
import { onNameLookupHandler } from './core/handlers/onNameLookup/onNameLookup';
import { onProtocolRequest as onProtocolRequestHandler } from './core/handlers/onProtocolRequest/onProtocolRequest';
import { handlers as onRpcRequestHandlers } from './core/handlers/onRpcRequest';
import { RpcRequestMethod } from './core/handlers/onRpcRequest/types';
import { withCatchAndThrowSnapError } from './core/utils/errors';
import { getClientStatus } from './core/utils/interface';
import logger, { createPrefixedLogger } from './core/utils/logger';
import { validateOrigin } from './core/validation/validators';
import { eventHandlers as confirmSignInEvents } from './features/confirmation/views/ConfirmSignIn/events';
import { eventHandlers as confirmSignMessageEvents } from './features/confirmation/views/ConfirmSignMessage/events';
import { eventHandlers as confirmSignAndSendTransactionEvents } from './features/confirmation/views/ConfirmTransactionRequest/events';
import { eventHandlers as sendFormEvents } from './features/send/views/SendForm/events';
import { eventHandlers as transactionConfirmationEvents } from './features/send/views/TransactionConfirmation/events';
import { installPolyfills } from './polyfills';
import snapContext, {
  clientRequestHandler,
  eventEmitter,
  keyring,
} from './snapContext';

installPolyfills();

// Lowest precision we ever go for: MicroLamports represented in Sol amount
BigNumber.config({ EXPONENTIAL_AT: 16 });

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns A promise that resolves to the result of the RPC request.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  logger.log('[🔄 onRpcRequest]', request.method, request);

  const { method } = request;

  validateOrigin(origin, method);

  const handler = onRpcRequestHandlers[method as RpcRequestMethod];

  if (!handler) {
    throw new MethodNotFoundError(
      `RpcRequest method ${method} not found. Available methods: ${Object.values(
        RpcRequestMethod,
      ).toString()}`,
    ) as unknown as Error;
  }

  const result = await withCatchAndThrowSnapError(async () =>
    handler({ origin, request }),
  );

  return result ?? null;
};

/**
 * Handle incoming keyring requests.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated keyring request object.
 * @returns A promise that resolves to a JSON object.
 * @throws If the request method is not valid for this snap.
 */
export const onKeyringRequest: OnKeyringRequestHandler = async ({
  origin,
  request,
}): Promise<Json> => {
  logger.log('[🔑 onKeyringRequest]', request.method, request);

  validateOrigin(origin, request.method);

  // This is a temporal fix to prevent the swap/bridge functionality breaking
  // TODO: Remove this once changes in bridge-status-controller are in place
  if (
    request.method === KeyringRpcMethod.SubmitRequest &&
    request.params &&
    !('origin' in request.params)
  ) {
    (request.params as Record<string, Json>).origin = 'https://metamask.io';
  }

  const result = await withCatchAndThrowSnapError(async () =>
    handleKeyringRequest(keyring, request),
  );

  return result ?? null;
};

/**
 * Handle user events requests.
 *
 * @param args - The request handler args as object.
 * @param args.id - The interface id associated with the event.
 * @param args.event - The event object.
 * @param args.context - The context object.
 * @returns A promise that resolves to a JSON object.
 * @throws If the request method is not valid for this snap.
 */
export const onUserInput: OnUserInputHandler = async ({
  id,
  event,
  context,
}) => {
  logger.log('[👇 onUserInput]', id, event);

  // Using the name of the component, route it to the correct handler
  if (!event.name) {
    return;
  }

  const uiEventHandlers: Record<string, (...args: any) => Promise<void>> = {
    ...sendFormEvents,
    ...transactionConfirmationEvents,
    ...confirmSignAndSendTransactionEvents,
    ...confirmSignMessageEvents,
    ...confirmSignInEvents,
  };

  const handler = uiEventHandlers[event.name];

  if (!handler) {
    return;
  }

  await withCatchAndThrowSnapError(async () =>
    handler({ id, event, context, snapContext }),
  );
};

/**
 * Handle incoming cronjob requests.
 *
 * @param args - The request handler args as object.
 * @param args.request - A validated cronjob request object.
 * @returns A promise that resolves to a JSON object.
 * @throws If the request method is not valid for this snap.
 * @see https://docs.metamask.io/snaps/reference/entry-points/#oncronjob
 */
export const onCronjob: OnCronjobHandler = async ({ request }) => {
  const _logger = createPrefixedLogger(logger, '[⏱️ onCronjob]');

  _logger.log(request.method, request);

  const { method } = request;
  assert(
    method,
    enums([
      ...Object.values(CronjobMethod),
      ...Object.values(ScheduleBackgroundEventMethod),
    ]),
  );

  const result = await withCatchAndThrowSnapError(async () => {
    // Don't run cronjobs if client is locked or inactive
    const { locked, active } = await getClientStatus();

    _logger.log('Client status', { locked, active });

    if (locked || !active) {
      return Promise.resolve();
    }

    _logger.log('Running cronjob', { method });

    const handler =
      onCronjobHandlers[
        method as CronjobMethod | ScheduleBackgroundEventMethod
      ];

    if (!handler) {
      throw new MethodNotFoundError(
        `Cronjob / ScheduleBackgroundEvent method ${method} not found. Available methods: ${Object.values(
          [
            ...Object.values(CronjobMethod),
            ...Object.values(ScheduleBackgroundEventMethod),
          ],
        ).toString()}`,
      ) as unknown as Error;
    }
    return handler({ request });
  });

  return result ?? null;
};

export const onAssetsLookup: OnAssetsLookupHandler = async (params) => {
  const result = await withCatchAndThrowSnapError(async () =>
    onAssetsLookupHandler(params),
  );
  return result ?? null;
};

export const onAssetsConversion: OnAssetsConversionHandler = async (params) => {
  const result = await withCatchAndThrowSnapError(async () =>
    onAssetsConversionHandler(params),
  );
  return result ?? null;
};

export const onProtocolRequest: OnProtocolRequestHandler = async (params) => {
  const { origin, request } = params;

  validateOrigin(origin, request.method);

  const result = await withCatchAndThrowSnapError(async () =>
    onProtocolRequestHandler(params),
  );
  return result ?? null;
};

export const onAssetHistoricalPrice: OnAssetHistoricalPriceHandler = async (
  params,
) => {
  const result = await withCatchAndThrowSnapError(async () =>
    onAssetHistoricalPriceHandler(params),
  );
  return result ?? null;
};

export const onClientRequest: OnClientRequestHandler = async ({ request }) => {
  const result = await withCatchAndThrowSnapError(async () =>
    clientRequestHandler.handle(request),
  );
  return result ?? null;
};

export const onWebSocketEvent: OnWebSocketEventHandler = async ({ event }) =>
  withCatchAndThrowSnapError(async () => {
    await eventEmitter.emitSync('onWebSocketEvent', event);
  });

/*
 * Lifecycle handlers
 */

export const onStart: OnStartHandler = async () =>
  withCatchAndThrowSnapError(async () => {
    await eventEmitter.emitSync('onStart');
  });

export const onUpdate: OnUpdateHandler = async () =>
  withCatchAndThrowSnapError(async () => {
    await eventEmitter.emitSync('onUpdate');
  });

export const onInstall: OnInstallHandler = async () =>
  withCatchAndThrowSnapError(async () => {
    await eventEmitter.emitSync('onInstall');
  });

export const onActive: OnActiveHandler = async () => {
  return withCatchAndThrowSnapError(async () => {
    await eventEmitter.emitSync('onActive');
  });
};

export const onInactive: OnInactiveHandler = async () => {
  return withCatchAndThrowSnapError(async () => {
    await eventEmitter.emitSync('onInactive');
  });
};

export const onNameLookup: OnNameLookupHandler = async (request) => {
  const result = await withCatchAndThrowSnapError(async () =>
    onNameLookupHandler(request),
  );
  return result ?? null;
};

export const onAssetsMarketData: OnAssetsMarketDataHandler = async (params) => {
  const result = await withCatchAndThrowSnapError(async () =>
    onAssetsMarketDataHandler(params),
  );
  return result ?? null;
};
