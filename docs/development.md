# Development

## Local Development

To start local development using the extension, you can follow these steps:

1. Run `yarn start` from the root of this project. It will start the snap at `http://localhost:8080` and the site dapp at `http://localhost:3000`.
2. Run MetaMask Flask locally from the extension repository with `yarn start:flask`. Before doing this, you need to point the `SOLANA_WALLET_SNAP_ID` in `shared/lib/accounts/solana-wallet-snap.ts` to `http://localhost:8080`. This ensures that all requests will go to your local snap.

**Side Note:** For both repositories, always run `nvm use` and `yarn install` before starting.

## Build

```bash
yarn build
```

> [!NOTE]  
> This script will watch your file system and update the snap

## Linting

```bash
yarn lint
```

> [!NOTE]  
> Uses eslint in order to look for issues on your code

If you want to fix your linting issues automatically use

```bash
yarn lint:fix
```

## Formatting

```bash
yarn prettier:check
```

> [!NOTE]  
> Uses prettier in order to look for formatting issues on your code

If you want to fix your formatting issues automatically use

```bash
yarn prettier:fix
```
