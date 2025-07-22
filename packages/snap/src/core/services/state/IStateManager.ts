import type { Serializable } from '../../serialization/types';

export type IStateManager<TStateValue extends Record<string, Serializable>> = {
  /**
   * Gets the whole state object.
   *
   * ⚠️ WARNING: Use with caution because it transfers the whole state, which might contain a lot of data.
   * If you need to retrieve only a specific part of the state, use IStateManager.getKey instead.
   *
   * @example
   * ```typescript
   * // state is { users: [ { name: 'Alice', age: 20 }, { name: 'Bob', age: 25 } ], countries: ['Spain', 'France'] }
   *
   * const value = await stateManager.get();
   * // value is { users: [ { name: 'Alice', age: 20 }, { name: 'Bob', age: 25 } ], countries: ['Spain', 'France'] }
   * ```
   */
  get(): Promise<TStateValue>;
  /**
   * Gets the value of passed key in the state object.
   * The key is the json path to the value to get.
   *
   * @example
   * ```typescript
   *  // state is { users: [ { name: 'Alice', age: 20 }, { name: 'Bob', age: 25 } ], countries: ['Spain', 'France'] }
   *
   * const value = await stateManager.getKey('users.1.name');
   * // value is 'Bob'
   *
   * @returns The value of the key, or undefined if the key does not exist.
   */
  getKey<TResponse extends Serializable>(
    key: string,
  ): Promise<TResponse | undefined>;
  /**
   * Sets the value of passed key in the state object.
   * The key is a json path to the value to set.
   *
   * @example
   * ```typescript
   * const state = await stateManager.get();
   * // state is { users: [ { name: 'Alice', age: 20 }, { name: 'Bob', age: 25 } ] }
   *
   * await stateManager.set('users.1.name', 'John');
   * // state is now { users: [ { name: 'Alice', age: 20 }, { name: 'John', age: 25 } ] }
   * ```
   * @param key - The key to set, which is a json path to the location.
   * @param value - The value to set.
   */
  setKey(key: string, value: any): Promise<void>;
  /**
   * Updates the whole state object.
   *
   * Typically used for bulk `set`s or `delete`s, because:
   * - Atomicity: Using a single `state.update` ensures that all changes are applied atomically. If any part of the operation fails, none of the changes will be applied. This prevents partial updates that could leave the underlying data store in an inconsistent state.
   * - Performance: Making multiple individual `state.set` or `state.delete` calls would require multiple round trips to the state storage system, causing potential overheads.
   * - State Consistency: Maintains better state consistency by reading the state once, making all modifications in memory and writing the complete updated state back.
   *
   * ⚠️ WARNING: Use with caution because:
   * - it will override the whole state.
   * - it transfers the whole state back and forth the data store, which might consume a lot of bandwidth.
   *
   * For single updates, use instead `setKey` or `deleteKey`.
   *
   * @param updaterFunction - The function that updates the state.
   * @returns The updated state.
   */
  update(
    updaterFunction: (state: TStateValue) => TStateValue,
  ): Promise<TStateValue>;
  /**
   * Deletes the value of passed key in the state object.
   * The key is a json path to the value to delete.
   *
   * @example
   * ```typescript
   * const state = await stateManager.get();
   * // state is { users: [ { name: 'Alice', age: 20 }, { name: 'Bob', age: 25 } ] }
   *
   * await stateManager.deleteKey('users.1');
   * // state is now { users: [ { name: 'Alice', age: 20 } ] }
   * ```
   */
  deleteKey(key: string): Promise<void>;
  /**
   * Deletes multiple keys in the state object in a single operation.
   * The keys are a json path to the value to delete.
   *
   * @example
   * ```typescript
   * const state = await stateManager.get();
   * // state is { users: [ { name: 'Alice', age: 20 }, { name: 'Bob', age: 25 } ] }
   *
   * await stateManager.deleteKeys(['users.0.age', 'users.1.name']);
   * // state is now { users: [ { name: 'Alice' }, { age: 25 } ] }
   * ```
   */
  deleteKeys(keys: string[]): Promise<void>;
};
