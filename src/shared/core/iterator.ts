/** Iterator: one way to walk through different collections. */
export interface GameIterator<T> {
  hasNext(): boolean;
  next(): T;
}

/** A collection that can give an iterator over itself. */
export interface GameCollection<T> {
  createIterator(): GameIterator<T>;
}
