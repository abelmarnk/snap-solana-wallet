import type {
  ConfirmedSubscription,
  PendingSubscription,
  Subscription,
} from '../../../entities';
import type { IStateManager } from '../state/IStateManager';
import type { UnencryptedStateValue } from '../state/State';

export class SubscriptionRepository {
  readonly #state: IStateManager<UnencryptedStateValue>;

  readonly #stateKey = 'subscriptions';

  constructor(state: IStateManager<UnencryptedStateValue>) {
    this.#state = state;
  }

  async getAll(): Promise<Subscription[]> {
    const subscriptionsById = await this.#state.getKey<
      Record<string, Subscription>
    >(`${this.#stateKey}`);

    return Object.values(subscriptionsById ?? {});
  }

  async getById(subscriptionId: string): Promise<Subscription | undefined> {
    const result = await this.#state.getKey<
      UnencryptedStateValue['subscriptions'][string]
    >(`${this.#stateKey}.${subscriptionId}`);

    return result;
  }

  async save(subscription: Subscription): Promise<void> {
    await this.#state.setKey(
      `${this.#stateKey}.${subscription.id}`,
      subscription,
    );
  }

  async delete(subscriptionId: string): Promise<void> {
    await this.#state.deleteKey(`${this.#stateKey}.${subscriptionId}`);
  }

  async deleteMany(subscriptionIds: string[]): Promise<void> {
    const keys = subscriptionIds.map(
      (subscriptionId) => `${this.#stateKey}.${subscriptionId}`,
    );
    await this.#state.deleteKeys(keys);
  }

  async update(subscription: Subscription): Promise<void> {
    await this.#state.setKey(
      `${this.#stateKey}.${subscription.id}`,
      subscription,
    );
  }

  async findBy(
    key: keyof PendingSubscription | keyof ConfirmedSubscription,
    value: string | number,
  ): Promise<Subscription | undefined> {
    const subscriptions = await this.getAll();

    if (subscriptions.length === 0) {
      return undefined;
    }

    return subscriptions.find(
      (subscription) =>
        key in subscription &&
        subscription[key as keyof Subscription] === value,
    );
  }

  async clear(): Promise<void> {
    await this.#state.deleteKey(`${this.#stateKey}`);
  }
}
