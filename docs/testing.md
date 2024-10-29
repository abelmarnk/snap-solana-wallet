## Testing

In order to test snaps, this project uses [`@metamask/snaps-jest`](https://github.com/MetaMask/snaps/tree/main/packages/snaps-jest) which extend the functionality of jest.
Make sure you are familiar with the framework before writting tests.

### Running tests

```bash
yarn test
```

> [!WARNING]  
> Before running `yarn test` make sure your build the snap first by running `yarn build`. Tests are looking at the built version of the snap.

To run test in watch mode using the following script

```bash
yarn test:watch
```
