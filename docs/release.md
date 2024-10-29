# Releasing @metamask/solana-wallet-snap

When the time comes to release, follow these steps:

1. Trigger "Create release PR" workflow manualy.
2. Check that everything that's the be released is included in the [CHANGELOG](../CHANGELOG.md) changes.
3. Chase approve and merge.
4. Wait for the action in `main` to finish and publish the package.
5. Update the version on [the extension](https://github.com/MetaMask/metamask-extension) `package.json`.

> [!NOTE]
> Release process [on the metammask-extension](https://github.com/MetaMask/metamask-extension/blob/develop/docs/publishing.md) follows another process.
