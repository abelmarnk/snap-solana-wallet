/* eslint-disable no-restricted-globals */
import type { Infer } from '@metamask/superstruct';
import {
  array,
  coerce,
  create,
  enums,
  object,
  string,
} from '@metamask/superstruct';
import { Duration } from '@metamask/utils';

import { Network, Networks } from '../../constants/solana';
import { UrlStruct } from '../../validation/structs';

const ENVIRONMENT_TO_ACTIVE_NETWORKS = {
  production: [Network.Mainnet],
  local: [Network.Mainnet],
  test: [Network.Localnet],
};

const CommaSeparatedListOfUrlsStruct = coerce(
  array(UrlStruct),
  string(),
  (value: string) => value.split(','),
);

const CommaSeparatedListOfStringsStruct = coerce(
  array(string()),
  string(),
  (value: string) => value.split(','),
);

const EnvStruct = object({
  ENVIRONMENT: enums(['local', 'test', 'production']),
  RPC_URL_MAINNET_LIST: CommaSeparatedListOfUrlsStruct,
  RPC_URL_DEVNET_LIST: CommaSeparatedListOfUrlsStruct,
  RPC_URL_TESTNET_LIST: CommaSeparatedListOfUrlsStruct,
  RPC_URL_LOCALNET_LIST: CommaSeparatedListOfStringsStruct,
  RPC_WEB_SOCKET_URL_MAINNET: UrlStruct,
  RPC_WEB_SOCKET_URL_DEVNET: UrlStruct,
  RPC_WEB_SOCKET_URL_TESTNET: UrlStruct,
  RPC_WEB_SOCKET_URL_LOCALNET: UrlStruct,
  EXPLORER_BASE_URL: UrlStruct,
  PRICE_API_BASE_URL: UrlStruct,
  TOKEN_API_BASE_URL: UrlStruct,
  STATIC_API_BASE_URL: UrlStruct,
  SECURITY_ALERTS_API_BASE_URL: UrlStruct,
  NFT_API_BASE_URL: UrlStruct,
  LOCAL_API_BASE_URL: string(),
});

export type Env = Infer<typeof EnvStruct>;

export type NetworkConfig = (typeof Networks)[Network] & {
  rpcUrls: string[];
  webSocketUrl: string;
};

export type Config = {
  environment: string;
  networks: NetworkConfig[];
  activeNetworks: Network[];
  explorerBaseUrl: string;
  priceApi: {
    baseUrl: string;
    chunkSize: number;
    cacheTtlsMilliseconds: {
      fiatExchangeRates: number;
      spotPrices: number;
      historicalPrices: number;
    };
  };
  tokenApi: {
    baseUrl: string;
    chunkSize: number;
  };
  staticApi: {
    baseUrl: string;
  };
  transactions: {
    storageLimit: number;
  };
  securityAlertsApi: {
    baseUrl: string;
  };
  nftApi: {
    baseUrl: string;
    cacheTtlsMilliseconds: {
      listAddressSolanaNfts: number;
      getNftMetadata: number;
    };
  };
  subscriptions: {
    maxReconnectAttempts: number;
    reconnectDelayMilliseconds: number;
  };
};

/**
 * A utility class that provides the configuration of the snap.
 *
 * @example
 * const configProvider = new ConfigProvider();
 * const { networks } = configProvider.get();
 * @example
 * // You can use utility methods for more advanced manipulations.
 * const network = configProvider.getNetworkBy('caip2Id', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp');
 */
export class ConfigProvider {
  #config: Config;

  constructor() {
    const environment = this.#parseEnvironment();
    this.#config = this.#buildConfig(environment);
  }

  #parseEnvironment() {
    const rawEnvironment = {
      ENVIRONMENT: process.env.ENVIRONMENT,
      RPC_URL_MAINNET_LIST: process.env.RPC_URL_MAINNET_LIST,
      RPC_URL_DEVNET_LIST: process.env.RPC_URL_DEVNET_LIST,
      RPC_URL_TESTNET_LIST: process.env.RPC_URL_TESTNET_LIST,
      RPC_URL_LOCALNET_LIST: process.env.RPC_URL_LOCALNET_LIST,
      RPC_WEB_SOCKET_URL_MAINNET: process.env.RPC_WEB_SOCKET_URL_MAINNET,
      RPC_WEB_SOCKET_URL_DEVNET: process.env.RPC_WEB_SOCKET_URL_DEVNET,
      RPC_WEB_SOCKET_URL_TESTNET: process.env.RPC_WEB_SOCKET_URL_TESTNET,
      RPC_WEB_SOCKET_URL_LOCALNET: process.env.RPC_WEB_SOCKET_URL_LOCALNET,
      EXPLORER_BASE_URL: process.env.EXPLORER_BASE_URL,
      PRICE_API_BASE_URL: process.env.PRICE_API_BASE_URL,
      TOKEN_API_BASE_URL: process.env.TOKEN_API_BASE_URL,
      STATIC_API_BASE_URL: process.env.STATIC_API_BASE_URL,
      SECURITY_ALERTS_API_BASE_URL: process.env.SECURITY_ALERTS_API_BASE_URL, // Blockaid
      LOCAL_API_BASE_URL: process.env.LOCAL_API_BASE_URL,
      // NFT API
      NFT_API_BASE_URL: process.env.NFT_API_BASE_URL,
    };

    // Validate and parse them before returning
    return create(rawEnvironment, EnvStruct);
  }

  #buildConfig(environment: Env): Config {
    return {
      environment: environment.ENVIRONMENT,
      networks: [
        {
          ...Networks[Network.Mainnet],
          rpcUrls: environment.RPC_URL_MAINNET_LIST,
          webSocketUrl: environment.RPC_WEB_SOCKET_URL_MAINNET,
        },
        {
          ...Networks[Network.Devnet],
          rpcUrls: environment.RPC_URL_DEVNET_LIST,
          webSocketUrl: environment.RPC_WEB_SOCKET_URL_DEVNET,
        },
        {
          ...Networks[Network.Testnet],
          rpcUrls: environment.RPC_URL_TESTNET_LIST,
          webSocketUrl: environment.RPC_WEB_SOCKET_URL_TESTNET,
        },
        {
          ...Networks[Network.Localnet],
          rpcUrls: environment.RPC_URL_LOCALNET_LIST,
          webSocketUrl: environment.RPC_WEB_SOCKET_URL_LOCALNET,
        },
      ],
      explorerBaseUrl: environment.EXPLORER_BASE_URL,
      activeNetworks: ENVIRONMENT_TO_ACTIVE_NETWORKS[environment.ENVIRONMENT],
      priceApi: {
        baseUrl:
          environment.ENVIRONMENT === 'test'
            ? environment.LOCAL_API_BASE_URL
            : environment.PRICE_API_BASE_URL,
        chunkSize: 50,
        cacheTtlsMilliseconds: {
          fiatExchangeRates: Duration.Minute,
          spotPrices: Duration.Minute,
          historicalPrices: Duration.Minute,
        },
      },
      tokenApi: {
        baseUrl:
          environment.ENVIRONMENT === 'test'
            ? environment.LOCAL_API_BASE_URL
            : environment.TOKEN_API_BASE_URL,
        chunkSize: 50,
      },
      staticApi: {
        baseUrl: environment.STATIC_API_BASE_URL,
      },
      transactions: {
        storageLimit: 10,
      },
      securityAlertsApi: {
        baseUrl:
          environment.ENVIRONMENT === 'test'
            ? environment.LOCAL_API_BASE_URL
            : environment.SECURITY_ALERTS_API_BASE_URL,
      },
      nftApi: {
        baseUrl:
          environment.ENVIRONMENT === 'test'
            ? environment.LOCAL_API_BASE_URL
            : environment.NFT_API_BASE_URL,
        cacheTtlsMilliseconds: {
          listAddressSolanaNfts: Duration.Minute,
          getNftMetadata: Duration.Minute,
        },
      },
      subscriptions: {
        maxReconnectAttempts: 5,
        reconnectDelayMilliseconds: Duration.Second,
      },
    };
  }

  public get(): Config {
    return this.#config;
  }

  public getNetworkBy(key: keyof NetworkConfig, value: string): NetworkConfig {
    const network = this.get().networks.find((item) => item[key] === value);
    if (!network) {
      throw new Error(`Network ${key} not found`);
    }
    return network;
  }
}
