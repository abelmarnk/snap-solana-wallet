/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable jest/require-to-throw-message */
import type { Transaction } from '@metamask/keyring-api';

import { Network } from '../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../test/mocks/solana-keyring-accounts';
import logger from '../../utils/logger';
import { ScanStatus, SecurityAlertResponse } from '../transaction-scan/types';
import { AnalyticsService } from './AnalyticsService';

const mockSnapRequest = jest.fn();
const snap = {
  request: mockSnapRequest,
};
(globalThis as any).snap = snap;

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let loggerSpy: jest.SpyInstance;
  const loggerPrefix = '[📣 AnalyticsService]';

  const mockAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;
  const mockScope = Network.Mainnet;
  const mockOrigin = 'https://metamask.io';
  const mockSignature = 'mockedSignature';
  const mockMetadata = {
    scope: mockScope,
    origin: mockOrigin,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsService = new AnalyticsService();
    loggerSpy = jest.spyOn(logger, 'log').mockImplementation();
    mockSnapRequest.mockResolvedValue(undefined);
  });

  afterEach(() => {
    loggerSpy.mockRestore();
  });

  describe('trackEventTransactionAdded', () => {
    it('tracks transaction added event with origin', async () => {
      await analyticsService.trackEventTransactionAdded(
        mockAccount,
        mockMetadata,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        loggerPrefix,
        'Tracking event transaction added',
      );

      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Added',
            properties: {
              message: 'Snap transaction added',
              origin: mockOrigin,
              account_id: mockAccount.id,
              account_address: mockAccount.address,
              account_type: mockAccount.type,
              chain_id: mockScope,
            },
          },
        },
      });
    });
  });

  describe('trackEventTransactionApproved', () => {
    it('tracks transaction approved event with origin', async () => {
      await analyticsService.trackEventTransactionApproved(
        mockAccount,
        mockMetadata,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        loggerPrefix,
        'Tracking event transaction approved',
      );

      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Approved',
            properties: {
              message: 'Snap transaction approved',
              origin: mockOrigin,
              account_id: mockAccount.id,
              account_address: mockAccount.address,
              account_type: mockAccount.type,
              chain_id: mockScope,
            },
          },
        },
      });
    });
  });

  describe('trackEventTransactionSubmitted', () => {
    it('tracks transaction submitted event with origin', async () => {
      await analyticsService.trackEventTransactionSubmitted(
        mockAccount,
        mockSignature,
        mockMetadata,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        loggerPrefix,
        'Tracking event transaction submitted',
      );

      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Submitted',
            properties: {
              message: 'Snap transaction submitted',
              origin: mockOrigin,
              account_id: mockAccount.id,
              account_address: mockAccount.address,
              account_type: mockAccount.type,
              chain_id: mockScope,
            },
          },
        },
      });
    });
  });

  describe('trackEventTransactionFinalized', () => {
    const mockTransaction: Transaction = {
      id: 'mock-transaction-id',
      account: mockAccount.id,
      chain: mockScope,
      status: 'confirmed',
      type: 'send',
      timestamp: 1736500242,
      from: [
        {
          address: mockAccount.address,
          asset: {
            fungible: true,
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
            unit: 'SOL',
            amount: '0.1',
          },
        },
      ],
      to: [
        {
          address: '6LfawjK4CQE7pHApWYA6s6PCH5jfgrcRcV6xE6vtiyjY',
          asset: {
            fungible: true,
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
            unit: 'SOL',
            amount: '0.1',
          },
        },
      ],
      fees: [
        {
          type: 'base',
          asset: {
            fungible: true,
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
            unit: 'SOL',
            amount: '0.000005',
          },
        },
      ],
      events: [
        {
          status: 'confirmed',
          timestamp: 1736500242,
        },
      ],
    };

    it('tracks transaction finalized event with origin', async () => {
      await analyticsService.trackEventTransactionFinalized(
        mockAccount,
        mockTransaction,
        mockMetadata,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        loggerPrefix,
        'Tracking event transaction finalized',
      );

      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Finalized',
            properties: {
              message: 'Snap transaction finalized',
              origin: mockOrigin,
              account_id: mockAccount.id,
              account_address: mockAccount.address,
              account_type: mockAccount.type,
              chain_id: mockTransaction.chain,
              transaction_status: mockTransaction.status,
              transaction_type: mockTransaction.type,
            },
          },
        },
      });
    });
  });

  describe('trackEventTransactionRejected', () => {
    it('tracks transaction rejected event with origin', async () => {
      await analyticsService.trackEventTransactionRejected(
        mockAccount,
        mockMetadata,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        loggerPrefix,
        'Tracking event transaction rejected',
      );

      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Rejected',
            properties: {
              message: 'Snap transaction rejected',
              origin: mockOrigin,
              account_id: mockAccount.id,
              account_address: mockAccount.address,
              account_type: mockAccount.type,
              chain_id: mockScope,
            },
          },
        },
      });
    });
  });

  describe('trackEventSecurityAlertDetected', () => {
    it('tracks security alert detected event', async () => {
      const securityAlertResponse = SecurityAlertResponse.Warning;
      const securityAlertReason = 'transfer_farming';
      const securityAlertDescription =
        "Substantial transfer of the account's assets to untrusted entities";

      await analyticsService.trackEventSecurityAlertDetected(
        mockAccount,
        mockOrigin,
        mockScope,
        securityAlertResponse,
        securityAlertReason,
        securityAlertDescription,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        loggerPrefix,
        'Tracking event security alert detected',
      );

      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Security Alert Detected',
            properties: {
              message: 'Snap security alert detected',
              origin: mockOrigin,
              account_id: mockAccount.id,
              account_address: mockAccount.address,
              account_type: mockAccount.type,
              chain_id: mockScope,
              security_alert_response: securityAlertResponse,
              security_alert_reason: securityAlertReason,
              security_alert_description: securityAlertDescription,
            },
          },
        },
      });
    });
  });

  describe('trackEventSecurityScanCompleted', () => {
    it('tracks security scan completed event with alerts detected', async () => {
      const scanStatus = ScanStatus.SUCCESS;
      const hasSecurityAlerts = true;

      await analyticsService.trackEventSecurityScanCompleted(
        mockAccount,
        mockOrigin,
        mockScope,
        scanStatus,
        hasSecurityAlerts,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        loggerPrefix,
        'Tracking event security scan completed',
      );

      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Security Scan Completed',
            properties: {
              message: 'Snap security scan completed',
              origin: mockOrigin,
              account_id: mockAccount.id,
              account_address: mockAccount.address,
              account_type: mockAccount.type,
              chain_id: mockScope,
              scan_status: scanStatus,
              has_security_alerts: hasSecurityAlerts,
            },
          },
        },
      });
    });

    it('tracks security scan completed event without alerts', async () => {
      const scanStatus = ScanStatus.SUCCESS;
      const hasSecurityAlerts = false;

      await analyticsService.trackEventSecurityScanCompleted(
        mockAccount,
        mockOrigin,
        mockScope,
        scanStatus,
        hasSecurityAlerts,
      );

      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Security Scan Completed',
            properties: {
              message: 'Snap security scan completed',
              origin: mockOrigin,
              account_id: mockAccount.id,
              account_address: mockAccount.address,
              account_type: mockAccount.type,
              chain_id: mockScope,
              scan_status: scanStatus,
              has_security_alerts: hasSecurityAlerts,
            },
          },
        },
      });
    });
  });

  describe('error handling', () => {
    it('does not throw error on snap.request errors', async () => {
      const error = new Error('Snap request failed');
      mockSnapRequest.mockRejectedValue(error);

      expect(
        await analyticsService.trackEventTransactionAdded(
          mockAccount,
          mockMetadata,
        ),
      ).toBeUndefined();
    });
  });
});
