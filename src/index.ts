import { Parse, Producer, Table } from './parser'
import { Lex } from './lexer'

export interface Token {
  type: string
}

export interface NumberToken extends Token {
  type: 'num'
  value: number
}

export interface StringToken extends Token {
  type: 'str'
  value: string
}

export interface IdToken extends Token {
  type: 'id'
  value: string
}

export interface Node {
  id: number
  nodes: (Node | Token)[]
}

type ParseLex<P extends Producer[], T extends Table, I extends string> = Parse<P, T, ['1'], [], false, Lex<I>>

export { ParseLex as Parse }