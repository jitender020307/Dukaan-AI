import { describe, it, expect } from 'vitest'
import { cleanQuery, isChatbotQuery, matchProducts } from '../api'
import type { InventoryProduct } from '../types'

const products: InventoryProduct[] = [
  {
    id: 'milk',
    name: 'Amul Taaza Milk',
    nameHi: 'Amul Taaza doodh',
    barcode: '8900000000001',
    category: 'Dairy',
    stock: 20,
    unit: 'packets',
    minThreshold: 5,
    costPrice: 25,
    sellingPrice: 30,
    mrp: 32,
    distributor: 'Amul',
    distributorPhone: '1234567890',
    status: 'in_stock',
  },
  {
    id: 'bread',
    name: 'Brown Bread',
    nameHi: 'Bhuni roti',
    barcode: '8900000000002',
    category: 'Bakery',
    stock: 9,
    unit: 'loaves',
    minThreshold: 4,
    costPrice: 30,
    sellingPrice: 40,
    mrp: 45,
    distributor: 'Britannia',
    distributorPhone: '0987654321',
    status: 'low_stock',
  },
]

describe('cleanQuery', () => {
  it('strips common question words', () => {
    expect(cleanQuery('milk ka stock kitna hai?')).toBe('milk')
    expect(cleanQuery('How many milk are left?')).toBe('milk')
    expect(cleanQuery('stock of bread available')).toBe('bread')
  })

  it('returns empty string when only stop words are present', () => {
    expect(cleanQuery('how many the available')).toBe('')
  })
})

describe('matchProducts', () => {
  it('matches a single product by name after cleaning', () => {
    const matches = matchProducts(products, 'milk ka stock kitna hai?')
    expect(matches).toHaveLength(1)
    expect(matches[0].id).toBe('milk')
  })

  it('matches a single product by id after cleaning', () => {
    const matches = matchProducts(products, 'bread')
    expect(matches).toHaveLength(1)
    expect(matches[0].id).toBe('bread')
  })

  it('returns multiple matches when query matches several products', () => {
    const matches = matchProducts(products, 'a')
    expect(matches.length).toBeGreaterThan(1)
  })

  it('returns empty array when nothing matches', () => {
    const matches = matchProducts(products, 'xyz')
    expect(matches).toHaveLength(0)
  })
})

describe('chatbot message routing', () => {
  it('routes product stock questions to the chatbot', () => {
    expect(isChatbotQuery('Amul Taaza Milk ka stock kitna hai?')).toBe(true)
  })

  it('routes sales reports to the chatbot', () => {
    expect(isChatbotQuery('What were this week sales?')).toBe(true)
  })

  it('keeps customer order messages on the existing order parser path', () => {
    expect(isChatbotQuery('Order 2 Amul Taaza Milk')).toBe(false)
    expect(isChatbotQuery('Please add 3 Brown Bread')).toBe(false)
  })
})
