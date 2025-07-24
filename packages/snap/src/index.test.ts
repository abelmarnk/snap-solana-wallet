import { expect } from '@jest/globals';
import { installSnap } from '@metamask/snaps-jest';

import { onCronjob } from '.';
import { handlers } from './core/handlers/onCronjob';
import { CronjobMethod } from './core/handlers/onCronjob/cronjobs/CronjobMethod';

jest.mock('@noble/ed25519', () => ({
  getPublicKey: jest.fn(),
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock('./snapContext', () => ({
  keyring: {
    listAccounts: jest.fn(),
    createAccount: jest.fn(),
  },
  state: {
    getKey: jest.fn().mockResolvedValue(Date.now()),
    setKey: jest.fn(),
  },
}));

describe('onRpcRequest', () => {
  it('throws an error if the requested method does not exist', async () => {
    const { request } = await installSnap();

    const response = await request({
      method: 'foo',
    });

    expect(response).toRespondWithError({
      code: 4100,
      message: 'Permission denied',
      stack: expect.any(String),
    });
  });
});

describe('onKeyringRequest', () => {
  it('throws an error if the requested method does not exist', async () => {
    const { request } = await installSnap();

    const response = await request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: 'npm:@metamask/solana-wallet-snap',
        request: {
          method: 'foo',
        },
      },
    });

    expect(response).toRespondWithError({
      code: 4100,
      message: 'Permission denied',
      stack: expect.any(String),
    });
  });
});

describe('onCronjob', () => {
  it('throws an error if the requested method is invalid', async () => {
    await expect(
      onCronjob({
        request: {
          id: '1',
          jsonrpc: '2.0',
          method: 'foo',
        },
      }),
    ).rejects.toThrow(/Expected one of/u);
  });

  it('calls the correct handler when the method is valid and snap is not locked', async () => {
    const handler = jest.fn();
    handlers[CronjobMethod.RefreshSend] = handler;

    const snap = {
      request: jest.fn().mockResolvedValue({ locked: false, active: true }),
    };

    (globalThis as any).snap = snap;

    await onCronjob({
      request: {
        id: '1',
        jsonrpc: '2.0',
        method: CronjobMethod.RefreshSend,
      },
    });

    expect(handler).toHaveBeenCalled();
  });

  it('does not call the handler when the client is locked', async () => {
    const handler = jest.fn();
    handlers[CronjobMethod.RefreshSend] = handler;

    const snap = {
      request: jest.fn().mockResolvedValue({ locked: true, active: true }),
    };

    (globalThis as any).snap = snap;

    await onCronjob({
      request: {
        id: '1',
        jsonrpc: '2.0',
        method: CronjobMethod.RefreshSend,
      },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not call the handler when the client is inactive', async () => {
    const handler = jest.fn();
    handlers[CronjobMethod.RefreshSend] = handler;

    const snap = {
      request: jest.fn().mockResolvedValue({ active: false, locked: false }),
    };

    (globalThis as any).snap = snap;

    await onCronjob({
      request: {
        id: '1',
        jsonrpc: '2.0',
        method: CronjobMethod.RefreshSend,
      },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('does call the handler when the client is unlocked and active', async () => {
    const handler = jest.fn();
    handlers[CronjobMethod.RefreshSend] = handler;

    const snap = {
      request: jest.fn().mockResolvedValue({ locked: false, active: true }),
    };

    (globalThis as any).snap = snap;

    await onCronjob({
      request: {
        id: '1',
        jsonrpc: '2.0',
        method: CronjobMethod.RefreshSend,
      },
    });

    expect(handler).toHaveBeenCalled();
  });
});
