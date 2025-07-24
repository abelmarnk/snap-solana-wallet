import type { ICache } from './core/caching/ICache';
import { InMemoryCache } from './core/caching/InMemoryCache';
import { StateCache } from './core/caching/StateCache';
import { NftApiClient } from './core/clients/nft-api/NftApiClient';
import { PriceApiClient } from './core/clients/price-api/PriceApiClient';
import { SecurityAlertsApiClient } from './core/clients/security-alerts-api/SecurityAlertsApiClient';
import { TokenApiClient } from './core/clients/token-api-client/TokenApiClient';
import { ClientRequestHandler } from './core/handlers/onClientRequest';
import { SolanaKeyring } from './core/handlers/onKeyringRequest/Keyring';
import type { Serializable } from './core/serialization/types';
import {
  AccountsRepository,
  AccountsService,
  KeyringAccountMonitor,
  SignatureMonitor,
  SubscriptionRepository,
  SubscriptionService,
  TransactionsRepository,
  TransactionsService,
  WebSocketConnectionRepository,
  WebSocketConnectionService,
} from './core/services';
import { AnalyticsService } from './core/services/analytics/AnalyticsService';
import { AssetsService } from './core/services/assets/AssetsService';
import { ConfigProvider } from './core/services/config';
import { ConfirmationHandler } from './core/services/confirmation/ConfirmationHandler';
import { SolanaConnection } from './core/services/connection/SolanaConnection';
import { TransactionHelper } from './core/services/execution/TransactionHelper';
import { NameResolutionService } from './core/services/name-resolution/NameResolutionService';
import { NftService } from './core/services/nft/NftService';
import type { IStateManager } from './core/services/state/IStateManager';
import type { UnencryptedStateValue } from './core/services/state/State';
import { DEFAULT_UNENCRYPTED_STATE, State } from './core/services/state/State';
import { TokenMetadataService } from './core/services/token-metadata/TokenMetadata';
import { TokenPricesService } from './core/services/token-prices/TokenPrices';
import { TransactionScanService } from './core/services/transaction-scan/TransactionScan';
import { WalletService } from './core/services/wallet/WalletService';
import logger from './core/utils/logger';
import { SendSolBuilder } from './features/send/transactions/SendSolBuilder';
import { SendSplTokenBuilder } from './features/send/transactions/SendSplTokenBuilder';
import { EventEmitter } from './infrastructure';

/**
 * Initializes all the services using dependency injection.
 */

export type SnapExecutionContext = {
  configProvider: ConfigProvider;
  connection: SolanaConnection;
  keyring: SolanaKeyring;
  priceApiClient: PriceApiClient;
  state: IStateManager<UnencryptedStateValue>;
  assetsService: AssetsService;
  tokenPricesService: TokenPricesService;
  transactionHelper: TransactionHelper;
  transactionsService: TransactionsService;
  sendSolBuilder: SendSolBuilder;
  sendSplTokenBuilder: SendSplTokenBuilder;
  walletService: WalletService;
  transactionScanService: TransactionScanService;
  analyticsService: AnalyticsService;
  confirmationHandler: ConfirmationHandler;
  cache: ICache<Serializable>;
  nftService: NftService;
  clientRequestHandler: ClientRequestHandler;
  webSocketConnectionService: WebSocketConnectionService;
  subscriptionService: SubscriptionService;
  eventEmitter: EventEmitter;
  nameResolutionService: NameResolutionService;
  accountsService: AccountsService;
};

const configProvider = new ConfigProvider();

const eventEmitter = new EventEmitter(logger);

const state = new State({
  encrypted: false,
  defaultState: DEFAULT_UNENCRYPTED_STATE,
});

const stateCache = new StateCache(state, logger);
const inMemoryCache = new InMemoryCache(logger);

const analyticsService = new AnalyticsService(logger);

const connection = new SolanaConnection(configProvider);

const webSocketConnectionRepository = new WebSocketConnectionRepository(
  configProvider,
);

const webSocketConnectionService = new WebSocketConnectionService(
  webSocketConnectionRepository,
  configProvider,
  eventEmitter,
  logger,
);

const subscriptionRepository = new SubscriptionRepository(state);

const subscriptionService = new SubscriptionService(
  webSocketConnectionService,
  subscriptionRepository,
  configProvider,
  eventEmitter,
  logger,
  analyticsService,
);

const transactionHelper = new TransactionHelper(connection, logger);
const sendSolBuilder = new SendSolBuilder(connection, logger);
const sendSplTokenBuilder = new SendSplTokenBuilder(
  connection,
  transactionHelper,
  logger,
);
const priceApiClient = new PriceApiClient(configProvider, inMemoryCache);
const tokenApiClient = new TokenApiClient(configProvider);
const nftApiClient = new NftApiClient(configProvider, inMemoryCache);

const tokenMetadataService = new TokenMetadataService({
  tokenApiClient,
  logger,
});

const tokenPricesService = new TokenPricesService({
  configProvider,
  priceApiClient,
  logger,
});
const nameResolutionService = new NameResolutionService(connection, logger);

const assetsService = new AssetsService({
  connection,
  logger,
  configProvider,
  state,
  tokenMetadataService,
  cache: inMemoryCache,
  tokenPricesService,
  nftApiClient,
});

const transactionsRepository = new TransactionsRepository(state);
const transactionsService = new TransactionsService(
  transactionsRepository,
  assetsService,
  connection,
  configProvider,
  logger,
);

const transactionScanService = new TransactionScanService(
  new SecurityAlertsApiClient(configProvider),
  tokenMetadataService,
  analyticsService,
  logger,
);

const accountsRepository = new AccountsRepository(state);
const accountsService = new AccountsService(
  accountsRepository,
  transactionsService,
  assetsService,
  logger,
);

const confirmationHandler = new ConfirmationHandler();

const signatureMonitor = new SignatureMonitor(
  subscriptionService,
  accountsService,
  transactionsService,
  analyticsService,
  connection,
  configProvider,
  logger,
);

const keyringAccountMonitor = new KeyringAccountMonitor(
  subscriptionService,
  accountsService,
  assetsService,
  transactionsService,
  configProvider,
  eventEmitter,
  logger,
);

const walletService = new WalletService(
  connection,
  transactionHelper,
  signatureMonitor,
  logger,
);

const keyring = new SolanaKeyring({
  state,
  transactionsService,
  logger,
  assetsService,
  walletService,
  confirmationHandler,
  keyringAccountMonitor,
  nameResolutionService,
});

const nftService = new NftService(connection, logger);

const clientRequestHandler = new ClientRequestHandler(
  keyring,
  walletService,
  logger,
);

const snapContext: SnapExecutionContext = {
  configProvider,
  connection,
  keyring,
  priceApiClient,
  state,
  cache: stateCache,
  /* Services */
  assetsService,
  tokenPricesService,
  transactionHelper,
  transactionsService,
  sendSolBuilder,
  sendSplTokenBuilder,
  walletService,
  transactionScanService,
  analyticsService,
  confirmationHandler,
  nftService,
  clientRequestHandler,
  webSocketConnectionService,
  subscriptionService,
  eventEmitter,
  nameResolutionService,
  accountsService,
};

export {
  accountsService,
  analyticsService,
  assetsService,
  clientRequestHandler,
  configProvider,
  confirmationHandler,
  connection,
  eventEmitter,
  keyring,
  nameResolutionService,
  nftService,
  priceApiClient,
  sendSolBuilder,
  sendSplTokenBuilder,
  state,
  subscriptionRepository,
  subscriptionService,
  tokenApiClient,
  tokenMetadataService,
  tokenPricesService,
  transactionHelper,
  transactionScanService,
  transactionsService,
  walletService,
  webSocketConnectionService,
};

export default snapContext;
