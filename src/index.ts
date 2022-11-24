import { producers, table } from './table'
import { Parse, GetAction } from './parser'

type W = Parse<producers, table, ['1'], [], false, [{ type: 'num', value: 1 }, { type: '+'}, { type: 'num' }, { type: '+'}, { type: 'num' }]>
