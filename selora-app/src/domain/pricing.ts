import { round2 } from './format'
import type { ClothingCost } from './types'

/**
 * The profit the owner wants on one clothing type. The selling price is
 * cost + percent of cost + fixed amount, rounded up so the profit is never less than asked.
 */
export interface ProfitRule {
  category: string
  /** Whole percent on top of the cost, e.g. 40. */
  percent: number
  /** LKR added on top, after the percent. */
  fixed: number
  /** Round the price up to a multiple of this (1 means no rounding). */
  roundTo: number
}

export const ROUND_OPTIONS = [1, 10, 50, 100] as const

/** Rules are ClothingCosts rows keyed RULE-<category>, so they need no extra list. */
export const ruleKey = (category: string) => `RULE-${category}`

/**
 * Reads the rules out of the ClothingCosts rows. On a ProfitRule row UnitCost holds the fixed
 * amount, Quantity the percent and OrderItemId the rounding.
 */
export function rulesFrom(costs: ClothingCost[]): Map<string, ProfitRule> {
  const rules = new Map<string, ProfitRule>()
  for (const c of costs) {
    if (c.costType !== 'ProfitRule' || !c.recordKey.startsWith('RULE-')) continue
    const category = c.recordKey.slice('RULE-'.length)
    rules.set(category, { category, percent: c.quantity, fixed: c.unitCost, roundTo: Number(c.orderId) || 1 })
  }
  return rules
}

/** The selling price a rule gives for a cost. */
export function priceFromCost(cost: number, rule: ProfitRule): number {
  const raw = cost * (1 + rule.percent / 100) + rule.fixed
  const step = rule.roundTo > 1 ? rule.roundTo : 0
  // A small tolerance so 1400.0000001 from floating point doesn't round up to 1450.
  return step ? Math.ceil(round2(raw) / step - 1e-9) * step : round2(raw)
}

/**
 * Cost per piece after buying more: the average over the pieces still in stock (at the current
 * cost) and the pieces just bought. With nothing left in stock it is simply the new cost.
 */
export function averageCost(stock: number, currentCost: number | undefined, quantity: number, unitCost: number): number {
  const left = Math.max(0, stock)
  if (currentCost === undefined || left === 0) return round2(unitCost)
  return round2((left * currentCost + quantity * unitCost) / (left + quantity))
}

interface Priced {
  stock: number
  price: number
  autoPrice: boolean
}

/** The price the rule gives an Auto item, or undefined when it is Fixed or has no cost or rule. */
export function rulePrice(item: Pick<Priced, 'autoPrice'>, cost: number | undefined, rule: ProfitRule | undefined): number | undefined {
  return item.autoPrice && cost !== undefined && rule ? priceFromCost(cost, rule) : undefined
}

/** Cost and price after a purchase. Auto items follow the rule at the new average cost; Fixed items keep their price. */
export function afterPurchase(
  item: Priced,
  currentCost: number | undefined,
  rule: ProfitRule | undefined,
  quantity: number,
  unitCost: number,
): { cost: number; price: number } {
  const cost = averageCost(item.stock, currentCost, quantity, unitCost)
  return { cost, price: rulePrice(item, cost, rule) ?? item.price }
}

export interface PriceChange {
  clothingId: string
  name: string
  from: number
  to: number
}

/** Auto items whose price isn't what their rule gives, optionally for one category. */
export function outOfDatePrices(
  clothes: (Priced & { id: string; name: string; category: string })[],
  cost: Map<string, number>,
  rules: Map<string, ProfitRule>,
  category?: string,
): PriceChange[] {
  const changes: PriceChange[] = []
  for (const c of clothes) {
    if (category && c.category !== category) continue
    const to = rulePrice(c, cost.get(c.id), rules.get(c.category))
    if (to !== undefined && to !== c.price) changes.push({ clothingId: c.id, name: c.name, from: c.price, to })
  }
  return changes
}

/** "40% + LKR 100", for labels. */
export function describeRule(rule: ProfitRule): string {
  const parts = []
  if (rule.percent) parts.push(`${rule.percent}%`)
  if (rule.fixed) parts.push(`LKR ${rule.fixed.toLocaleString('en-LK')}`)
  return parts.length ? parts.join(' + ') : 'no profit'
}

export type RuleErrors = Partial<Record<'percent' | 'fixed' | 'roundTo', string>>

export function validateRule(r: Pick<ProfitRule, 'percent' | 'fixed' | 'roundTo'>): RuleErrors {
  const e: RuleErrors = {}
  if (Number.isNaN(r.percent)) e.percent = 'Enter a percent, or 0.'
  else if (!Number.isInteger(r.percent) || r.percent < 0) e.percent = 'Use a whole number, 0 or more.'
  else if (r.percent > 1000) e.percent = 'That percent looks too high.'
  if (Number.isNaN(r.fixed)) e.fixed = 'Enter an amount, or 0.'
  else if (r.fixed < 0) e.fixed = 'The amount must be 0 or more.'
  else if (r.fixed > 1_000_000) e.fixed = 'That amount looks too high.'
  if (!(ROUND_OPTIONS as readonly number[]).includes(r.roundTo)) e.roundTo = 'Choose how to round.'
  if (!e.percent && !e.fixed && r.percent === 0 && r.fixed === 0) e.percent = 'Set a percent, a fixed amount or both.'
  return e
}
