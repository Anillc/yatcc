import { Parse, NumberToken, Node } from '..'
import { producers, table } from './table'

// 加减乘除来自 https://zhuanlan.zhihu.com/p/427309936

// 基本运算
export type NArray<T, N extends number> = N extends N ? (number extends N ? T[] : _NArray<T, N, []>) : never
type _NArray<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _NArray<T, N, [T, ...R]>
type NArrayNumber<L extends number> = NArray<number, L>

// 加法
export type Add<M extends number, N extends number> = [...NArrayNumber<M>, ...NArrayNumber<N>]['length']

// 减法
export type Subtract<M extends number, N extends number> =
    NArrayNumber<M> extends [...x: NArrayNumber<N>, ...rest: infer R] ? R['length'] : unknown

// 主要用于辅助推导乘除法; 否则会因为 Subtract 返回类型为 number | unknown 报错
type _Subtract<M extends number, N extends number> =
    NArrayNumber<M> extends [...x: NArrayNumber<N>, ...rest: infer R] ? R['length'] : -1

// 乘法
type _Multiply<M extends number, N extends number, res extends unknown[]> =
    N extends 0 ? res['length'] : _Multiply<M, _Subtract<N, 1>, [...NArray<number, M>, ...res]>
export type Multiply<M extends number, N extends number> = _Multiply<M, N, []>

// 除法
type _DivideBy<M extends number, N extends number, res extends unknown[]> =
    M extends 0 ? res["length"] : _Subtract<M, N> extends -1 ? unknown : _DivideBy<_Subtract<M, N>, N, [unknown, ...res]>
export type DividedBy<M extends number, N extends number> = N extends 0 ? unknown : _DivideBy<M, N, []>;

type CastEval<N, T> = Eval<N> extends T ? Eval<N> : never 
type Eval<N> = N extends Node
  ? N['id'] extends 1 ? Eval<N['nodes'][0]>
  // @ts-ignore
  : N['id'] extends 2 ? Add<CastEval<N['nodes'][0], number>, CastEval<N['nodes'][2], number>>
  : N['id'] extends 3 ? Subtract<CastEval<N['nodes'][0], number>, CastEval<N['nodes'][2], number>>
  : N['id'] extends 4 ? Eval<N['nodes'][0]>
  : N['id'] extends 5 ? Multiply<CastEval<N['nodes'][0], number>, CastEval<N['nodes'][2], number>>
  : N['id'] extends 6 ? DividedBy<CastEval<N['nodes'][0], number>, CastEval<N['nodes'][2], number>>
  : N['id'] extends 7 ? Eval<N['nodes'][0]>
  : N['id'] extends 8 ? Eval<N['nodes'][1]>
  : N['id'] extends 9 ? N['nodes'][0] extends NumberToken ? N['nodes'][0]['value'] : never
  : never : N

type E<I extends string> = Eval<Parse<producers, table, I>>

type T = E<`(1 + 2) * 3 + 4 * 5`>