import { Token, Node } from '.'
import { Last, ToString, Tail, Pop } from './utils'

export interface Producer {
  id: number
  name: string
  tokens: string[]
}

export enum ActionType {
  shift, reduce, goto
}

export type Table = Record<string, Record<string, [ActionType, number]>>

export type GetTopToken<Tokens extends Token[]> = Tokens extends [] ? '$' : Tokens[0]['type']
export type GetAction<T extends Table, S extends string[], Tokens extends Token[]> = T[Last<S, string>][GetTopToken<Tokens>]

export type Parse<
  P extends Record<number, Producer>,
  T extends Table,
  S extends string[],
  B extends (Node | Token)[],
  F extends boolean,
  Tokens,
> = F extends true ? B[0] :
  Tokens extends Token[]
    ? GetAction<T, S, Tokens> extends [infer Type extends number, infer Action extends number]
      ? Type extends 0 ?
        Parse<P, T, [...S, ToString<Action>], [...B, Tokens[0]], false, Tail<Tokens>>
      : Type extends 1 ?
        Parse<
          P, T,
          [...Pop<S, P[Action]['tokens']>[0],
            ToString<T[Last<Pop<S, P[Action]['tokens']>[0], string>][P[Action]['name']][1]>],
          [...Pop<B, P[Action]['tokens']>[0], { id: Action, nodes: Pop<B, P[Action]['tokens']>[1] }],
          P[Action]['name'] extends 'G' ? true : false, Tokens
        >
      : never : never
    : never
