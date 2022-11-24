import { load } from 'js-yaml'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import uniqWith from 'lodash.uniqwith'
import groupBy from 'lodash.groupby'

interface Producer {
  id: number
  name: string
  tokens: string[]
}

interface Item {
  producer: Producer
  position: number
  forward: string
}

interface Itemset {
  id: number
  items: Item[]
  next: Record<string, number>
}

const g = load(readFileSync(resolve(__dirname, './grammar.yaml'), 'utf-8')) as any

let terms: string[] = []

// id and position
let shiftList: [number, number][] = []
let reduceList: [number, number][] = []
const grammars: Record<string, Producer[]> = {}

for (const [key, value] of Object.entries(g)) {
  if (key === 'term') {
    terms = (value as string).split(' ').concat('$')
    continue
  }
  if (key === 'shift') {
    shiftList = value as [number, number][]
    continue
  }
  if (key === 'reduce') {
    reduceList = value as [number, number][]
    continue
  }
  const producers: string[] = Array.isArray(value) ? value : [value]
  grammars[key] = producers.map(producer => {
    const [id, ...tokens] = producer.split(/\s+/)
    if (Object.is(+id, NaN)) throw new Error(`id should be a number: ${id}`)
    return { name: key, id: +id, tokens }
  })
}

function itemEqual(a: Item, b: Item) {
  return a.producer.id === b.producer.id && a.position === b.position && a.forward === b.forward
}

function itemsEqual(a: Item[], b: Item[]) {
  if (a.length !== b.length) return false
  a.sort((a, b) => Number(
    `${a.producer.id}${a.position}${a.forward}` > `${b.producer.id}${b.position}${b.forward}`))
  for (let i = 0; i < a.length; i++) {
    if (!itemEqual(a[i], b[i])) return false
  }
  return true
}

function first(originalQuery: string[], stack: string[] = []): Set<string> {
  const query = [...originalQuery]
  const result = new Set<string>()
  if (query.length === 0) {
    result.add('empty')
    return result
  }
  if (terms.includes(query[0])) {
    result.add(query[0])
    return result
  }
  const producers = grammars[query[0]]

  for (const { tokens } of producers) {
    for (const token of tokens) {
      if (token === 'empty') {
        result.add('empty')
        break
      } else if (terms.includes(token)) {
        result.add(token)
        break
      } else {
        if (stack.includes(token)) break
        stack.push(token)
        const sub = first([token], stack)
        sub.forEach(e => result.add(e))
        stack.pop()
        if (!sub.has('empty')) break
      }
    }
  }

  if (result.has('empty')) {
    query.shift()
    const next = first(query, stack)
    next.forEach(e => result.add(e))
    if (!next.has('empty')) result.delete('empty')
  }
  return result
}

function closure(items: Item[]) {
  while (true) {
    const oldItems = [...items]
    for (const item of oldItems) {
      const { position, forward, producer } = item
      const { tokens } = producer
      if (position === tokens.length) continue
      const token = tokens[position]
      if (terms.includes(token) || token === 'empty') continue
      const rest = [...tokens.slice(position + 1), forward]
      grammars[token].forEach(newProducer => {
        first(rest).forEach(e => items.push({
          producer: newProducer,
          position: 0,
          forward: e
        }))
      })
    }
    const uniqItems = uniqWith(items, itemEqual)
    items.splice(0)
    items.push(...uniqItems)
    if (items.length === oldItems.length) break
  }
}

function cluster() {
  const itemsets: Itemset[] = [{
    id: 1,
    next: {},
    items: [{
      producer: grammars['G'][0],
      position: 0,
      forward: '$',
    }],
  }]
  closure(itemsets[0].items)
  for (let i = 0; i < itemsets.length; i++) {
    const itemset = itemsets[i]
    const nexts = itemset.items
      .filter(item => item.position < item.producer.tokens.length)
      .filter(item => item.producer.tokens[0] !== 'empty')
    const nextItemsets = groupBy(nexts, item => item.producer.tokens[item.position])
    for (const [key, value] of Object.entries(nextItemsets)) {
      const nextItemset: Item[] = value.map(e => ({
        ...e,
        position: e.position + 1,
      }))
      closure(nextItemset)
      const origin = itemsets.find(e => itemsEqual(e.items, nextItemset))
      if (origin) {
        itemset.next[key] = origin.id
      } else {
        const id = itemsets.length + 1
        itemsets.push({
          id: id,
          next: {},
          items: nextItemset,
        })
        itemset.next[key] = id
      }
    }
  }
  return itemsets
}

function lalrItemEqual(a: Item, b: Item) {
  return a.producer.id === b.producer.id && a.position === b.position
}

function lalrItemsEqual(a: Item[], b: Item[]) {
  if (a.length !== b.length) return false
  a.sort((a, b) => Number(
    `${a.producer.id}${a.position}${a.forward}` > `${b.producer.id}${b.position}${b.forward}`))
  for (let i = 0; i < a.length; i++) {
    if (!lalrItemEqual(a[i], b[i])) return false
  }
  return true
}

function toLALR(itemsets: Itemset[]) {
  const copy = JSON.parse(JSON.stringify(itemsets)) as Itemset[]
  const lalr: Itemset[] = []
  for (const itemset of copy) {
    const origin = lalr.find(e => lalrItemsEqual(e.items, itemset.items))
    if (!origin) {
      lalr.push(itemset)
      continue
    }
    origin.items = uniqWith(origin.items.concat(...itemset.items), itemEqual)
    for (const each of copy) {
      for (const [token, target] of Object.entries(each.next)) {
        if (target === itemset.id) {
          each.next[token] = origin.id
        }
      }
    }
  }
  return lalr
}

enum ActionType {
  shift = 0, reduce = 1, goto = 2
}

// [type, target]
type Action = [ActionType, number]

function actionWrite(origin: Action, action: Action, item: Item) {
  if (action === origin) return false
  if(action[0] === origin[0] && action[1] === origin[1]) return false
  // action: shift, origin: reduce -> shift list
  // action: reduce, origin: shift -> reduce list
  // other -> conflict
  const list = [shiftList, reduceList][(action[0] << 1) + origin[0] - 1]
  if (list.find(([id, position]) => {
    return item.producer.id === id && item.position === position
  })) return true
  throw new Error('conflict')
}

const clst = toLALR(cluster())

const action: Record<string, Record<string, Action>> = {}

function getOrCreate(state: number): Record<string, Action> {
  let record = action[String(state)]
  if (!record) {
    record = {}
    action[state] = record
  }
  return record
}

clst.forEach(itemset => {
  const states = getOrCreate(itemset.id)
  itemset.items.forEach(item => {
    if (item.position === item.producer.tokens.length || item.producer.tokens[0] === 'empty') {
      const origin = states[item.forward]
      const action: Action = [ActionType.reduce, item.producer.id ]
      if (!origin || actionWrite(origin, action, item)) {
        states[item.forward] = action
      }
    } else {
      const token = item.producer.tokens[item.position]
      const target = itemset.next[token]
      const origin = states[token]
      const action: Action = terms.includes(token)
        ? [ActionType.shift, target]
        : [ActionType.goto,  target]
      if (!origin || actionWrite(origin, action, item)) {
        states[token] = action
      }
    }
  })
})

terms.pop() // pop $
const ps = Object.values(grammars).flat().reduce((acc, x) => (acc[x.id] = x, acc), [] as Producer[])
writeFileSync(resolve(__dirname, '../src/producers.json'), JSON.stringify(ps))
// writeFileSync(resolve(__dirname, '../src/grammar.json'), JSON.stringify({
//   terms,
//   grammars,
// }))
// writeFileSync(resolve(__dirname, '../src/table.json'), JSON.stringify(action))