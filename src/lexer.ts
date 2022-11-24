type LexTrim<I extends string> = I extends `${' ' | '\t' | '\n'}${infer R}` ? LexTrim<R> : I

type Num = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
type LexNumber<I extends string> = I extends `${infer N extends Num}${infer R}`
  ? [`${N}${LexNumber<R>[0]}`, LexNumber<R>[1]]
  : I extends `.${infer R}`
    ? [`.${LexNumber<R>[0]}`, LexNumber<R>[1]]
    : ['', I]

type LexString<I extends string, In extends false | string = false, Ignore extends boolean = false> = In extends false
  ? I extends `${infer S extends "'" | '"' | '`'}${infer R}` ? LexString<R, S> : ['', I]
  : Ignore extends true
    ? I extends `${infer L}${infer R}` ? [`${L}${LexString<R, In>[0]}`, LexString<R, In>[1]] : ['', I]
    : I extends `\\${infer R}`
      ? LexString<R, In, true>
      : I extends `${In}${infer R}`
        ? ['', R]
        : I extends `${infer L}${infer R}`
          ? [`${L}${LexString<R, In>[0]}`, LexString<R, In>[1]]
          : never

type Id =
  | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g'
  | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n'
  | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u'
  | 'v' | 'w' | 'x' | 'y' | 'z' | 'A' | 'B'
  | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I'
  | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P'
  | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W'
  | 'X' | 'Y' | 'Z' | '_'
type LexId<I extends string, F extends boolean = true> = F extends true
  ? I extends `${infer L extends Id}${infer R}` ? [`${L}${LexId<R, false>[0]}`, LexId<R, false>[1]] : ['', I]
  : I extends `${infer L extends Id | number }${infer R}` ? [`${L}${LexId<R, false>[0]}`, LexId<R, false>[1]] : ['', I]

type Equal<A, B> = [A] extends [B] ? true : false

export type Lex<I extends string> =
  LexTrim<I> extends infer Trimmed extends string
    ? Trimmed extends '' ? []
    : LexNumber<Trimmed> extends [infer N extends string, infer R extends string] ? Equal<N, ''> extends false ? [{ type: 'num', value: N }, ...Lex<R>]
    : LexString<Trimmed> extends [infer S extends string, infer R extends string] ? Equal<S, ''> extends false ? [{ type: 'str', value: S }, ...Lex<R>]
    : LexId<Trimmed>     extends [infer I extends string, infer R extends string] ? Equal<I, ''> extends false ? [{ type: 'id' , value: I }, ...Lex<R>]
    : Trimmed extends `${infer L}${infer R}` ? [{ type: L }, ...Lex<R>]
  : never : never : never : never : never