# Releasing @metamask/solana-wallet-snap

Every time some code is merged into `main`, `release-please` will create or update a PR in which it will generate changes on the [CHANGELOG](../CHANGELOG.md), this is why is very important to follow commit conventions and give them a thoughtful description.

When you want to release,

1. Chase for an approval on that PR.
2. Merge it.
3. Trigger this workflow with the tag that `release-please` generated.
4. Update the version on [the extension](https://github.com/MetaMask/metamask-extension) `package.json`.
5. Release process [on the metammask-extension](https://github.com/MetaMask/metamask-extension/blob/develop/docs/publishing.md) follows another process.
