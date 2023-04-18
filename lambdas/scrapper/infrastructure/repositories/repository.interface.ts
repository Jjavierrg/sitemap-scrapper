export type Key<T> = Partial<T>;
export type Subset<T> = {
  [P in keyof T]?: T[P] extends object | null | undefined ? Subset<T[P]> : T[P];
};

export interface ReadRepository<T extends object, K = Key<T>> {
  /**
   * Retrieves an item from the table
   * @param key the key of the item to retrieve
   * @returns {Promise<T>} a promise that resolves with the item
   * @throws {Error} if the item could not be retrieved
   * @example
   * const key = { id: '123' };
   * const item = await repository.getItem(key);
   * console.log(item); // { id: '123', name: 'John Doe' }
   */
  getItem(key: K): Promise<T | undefined>;

  /**
   * Retrieves all items from the table
   * @returns {Promise<T[]>} a promise that resolves with the items
   * @throws {Error} if the items could not be retrieved
   * @example
   * const items = await repository.getItems();
   * console.log(items); // [{ id: '123', name: 'John Doe' }, { id: '456', name: 'Jane Doe' }]
   */
  getItems(): Promise<T[]>;
}

export interface WriteRepository<T extends object, K = Key<T>> {
  /**
   * Creates a new item, or replaces an old item with a new item
   * @param item the item to save
   * @returns {Promise<void>} a promise that resolves when the item has been saved
   * @throws {Error} if the item could not be saved
   * @example
   * const item = { id: '123', name: 'John Doe' };
   * await repository.saveItem(item);
   */
  saveItem(item: T): Promise<void>;

  /**
   * Updates an item in the table. This will not overwrite the entire item, only the properties that are provided
   * @param key the key of the item to update
   * @param item Partial item data to update
   * @returns {Promise<void>} a promise that resolves when the item has been updated
   * @throws {Error} if the item could not be updated
   * @example
   * const key = { id: '123' };
   * const item = { name: 'John Doe' };
   * await repository.updateItem(key, item);
   */
  updateItem(key: K, item: Subset<T>): Promise<void>;

  /**
   * Deletes an item from the table
   * @param key the key of the item to delete
   * @returns {Promise<void>} a promise that resolves when the item has been deleted
   * @throws {Error} if the item could not be deleted
   * @example
   * const key = { id: '123' };
   * await repository.deleteItem(key);
   */
  deleteItem(key: K): Promise<void>;
}
