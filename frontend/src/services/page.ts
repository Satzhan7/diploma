/** One page of a list endpoint (backend `Page<T>`). */
export interface Page<T> {
  items: T[];
  total: number;
  take: number;
  skip: number;
}

export interface PageParams {
  take?: number;
  skip?: number;
}

/** `getNextPageParam` for useInfiniteQuery over `Page<T>`. */
export const nextSkip = <T>(last: Page<T>): number | undefined =>
  last.skip + last.items.length < last.total ? last.skip + last.items.length : undefined;
