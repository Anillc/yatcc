import { producers, table } from './table'
import { Parse } from './parser'
import { Lex } from './lexer'

export interface Token {
  type: string
}

export interface Node {
  id: number
  nodes: (Node | Token)[]
}

type P<I extends string> = Parse<producers, table, ['1'], [], false, Lex<I>>

type W = P<`1 + 1`>