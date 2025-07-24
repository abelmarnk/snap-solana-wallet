export enum RpcRequestMethod {
  StartSendTransactionFlow = 'startSendTransactionFlow',
  GetFeeForTransaction = 'getFeeForTransaction',
}

/**
 * Methods specific to the test dapp,
 * to allow specific flows for manual testing.
 */
export enum TestDappRpcRequestMethod {
  ListWebSockets = 'listWebSockets',
  ListSubscriptions = 'listSubscriptions',
  TestOnStart = 'testOnStart',
  TestOnInstall = 'testOnInstall',
  TestOnUpdate = 'testOnUpdate',
  SynchronizeAccounts = 'synchronizeAccounts',
}
