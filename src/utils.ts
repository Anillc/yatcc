export type ToNumber<S> = S extends `${infer N extends number}` ? N : never

export type ToString<N extends number> = `${N}`

export type Last<T, F = unknown> = T extends [...infer _, infer R extends F] ? R : never

export type Tail<A> = A extends [infer _, ...infer R] ? R : never

// [Rest, Poped]
export type Pop<
  S extends unknown[],
  T extends unknown[],
> = T extends [infer _, ...infer R extends unknown[]]
  ? S extends [...infer Rest, infer Top]
    ? [Pop<Rest, R>[0], [Top, ...Pop<Rest, R>[1]]]
    : never
  : T extends []
    ? [S, []]
    : never