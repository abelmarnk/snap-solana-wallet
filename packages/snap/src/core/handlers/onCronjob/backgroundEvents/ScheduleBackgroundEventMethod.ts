export enum ScheduleBackgroundEventMethod {
  /** Triggered when a transaction is shown in confirmation UI */
  OnTransactionAdded = 'onTransactionAdded',
  /** Triggered when the user confirms a transaction in the confirmation UI */
  OnTransactionApproved = 'onTransactionApproved',
  /** Triggered when a transaction is rejected */
  OnTransactionRejected = 'onTransactionRejected',
  /** Triggered when the snap needs to refresh the user's accounts */
  OnAccountsRefresh = 'onAccountsRefresh',
  /** Triggered when the snap needs to synchronize an account */
  OnSynchronizeAccount = 'onSynchronizeAccount',
}
