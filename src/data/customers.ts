import type { CustomerTemplate, Customer } from '@/types'

export const CUSTOMER_TEMPLATES: CustomerTemplate[] = [
  {
    type: '书生',
    name: '书生',
    preferenceTags: ['爱情', '才子佳人', '历史', '婉约', '诗词'],
    generosity: 3,
    patience: 5,
    baseWealth: 30,
    socialInfluence: 3,
    emoji: '📚',
  },
  {
    type: '商贾',
    name: '商人',
    preferenceTags: ['历史', '谋略', '世情', '讽刺'],
    generosity: 5,
    patience: 3,
    baseWealth: 100,
    socialInfluence: 4,
    emoji: '💰',
  },
  {
    type: '妇人',
    name: '夫人',
    preferenceTags: ['爱情', '婉约', '神怪', '才子佳人'],
    generosity: 4,
    patience: 4,
    baseWealth: 50,
    socialInfluence: 3,
    emoji: '👩',
  },
  {
    type: '江湖人',
    name: '侠客',
    preferenceTags: ['武侠', '热血', '江湖', '冒险', '义气'],
    generosity: 2,
    patience: 2,
    baseWealth: 20,
    socialInfluence: 5,
    emoji: '⚔️',
  },
  {
    type: '官员',
    name: '大人',
    preferenceTags: ['历史', '谋略', '官场', '世情'],
    generosity: 5,
    patience: 3,
    baseWealth: 150,
    socialInfluence: 5,
    emoji: '🎩',
  },
  {
    type: '平民',
    name: '百姓',
    preferenceTags: ['神怪', '悬疑', '热血', '冒险', '励志'],
    generosity: 2,
    patience: 4,
    baseWealth: 15,
    socialInfluence: 2,
    emoji: '👤',
  },
]

export function generateRandomCustomers(count: number): Customer[] {
  const result: Customer[] = []
  for (let i = 0; i < count; i++) {
    const tpl = CUSTOMER_TEMPLATES[Math.floor(Math.random() * CUSTOMER_TEMPLATES.length)]
    result.push(createCustomerFromTemplate(tpl, i))
  }
  return result
}

export function generateWeightedCustomers(
  count: number,
  weights: Record<string, number>
): Customer[] {
  const result: Customer[] = []
  const weightedPool: CustomerTemplate[] = []

  for (const tpl of CUSTOMER_TEMPLATES) {
    const weight = weights[tpl.type] || 1
    const adjustedWeight = Math.max(0.1, weight)
    const numEntries = Math.round(adjustedWeight * 10)
    for (let i = 0; i < numEntries; i++) {
      weightedPool.push(tpl)
    }
  }

  if (weightedPool.length === 0) {
    return generateRandomCustomers(count)
  }

  for (let i = 0; i < count; i++) {
    const tpl = weightedPool[Math.floor(Math.random() * weightedPool.length)]
    result.push(createCustomerFromTemplate(tpl, i))
  }
  return result
}

function createCustomerFromTemplate(tpl: CustomerTemplate, index: number): Customer {
  return {
    id: `c-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    type: tpl.type,
    name: `${tpl.name}${['甲', '乙', '丙', '丁', '戊', '己'][index % 6]}`,
    preferenceTags: [...tpl.preferenceTags],
    generosity: tpl.generosity + Math.floor(Math.random() * 2) - 1,
    patience: tpl.patience + Math.floor(Math.random() * 2) - 1,
    wealth: tpl.baseWealth + Math.floor(Math.random() * tpl.baseWealth * 0.5),
    socialInfluence: tpl.socialInfluence,
    seatId: null,
    satisfaction: 50,
    emoji: tpl.emoji,
  }
}
