# Solana Wallet Snap Monorepo

## Getting Started

The Solana Wallet Snap allows MetaMask and dapp to manage accounts with Solana network.

- [Site README](packages/site/README.md)
- [Snap README](packages/snap/README.md)

### Prerequisites

- [MetaMask Flask](https://metamask.io/flask/)
- Nodejs `18`. We **strongly** recommend you install via [NVM](https://github.com/creationix/nvm) to avoid incompatibility issues between different node projects.
  - Once installed, you should also install [Yarn](http://yarnpkg.com/) with `npm i -g yarn` to make working with this repository easiest.

## Installing

```bash
nvm use 18
yarn install
```

## Running

### Quick Start

```bash
yarn start
```

- Snap server and debug page: http://localhost:8080/
- Example UI dapp: http://localhost:3000/

### Snap

⚠️ When snap updates you will need to still reconnect from the dapp to see changes

```bash
# Running Snap via watch mode
yarn workspace @metamask/solana-wallet-snap start
```

Alternatively you can build and serve the snap manually. This can sometimes be more stable than watch mode but requires
a manual rebuild and serve anytime there is a change on the snap.

```bash
# Building and serving snap manually
yarn workspace @metamask/solana-wallet-snap build
yarn workspace @metamask/solana-wallet-snap serve
```

### Example UI

```bash
# Running example UI
yarn workspace example start
```

### Testing

Before running `yarn test` make sure your build the snap first by running `yarn build`.
