import type { Rumor, RumorAction, TeaMasterOption, CustomerType } from '@/types'

export const RUMOR_TEMPLATES: Omit<Rumor, 'id' | 'createdAt' | 'dayCreated' | 'intensity'>[] = [
  {
    content: '听说那茶楼的说书先生讲的武侠故事惊心动魄，真乃天下奇闻！',
    tone: 'positive',
    category: 'story',
    affectedTags: ['武侠', '热血', '江湖'],
    customerTypeBoost: ['江湖人', '平民'],
    heatModifier: 10,
  },
  {
    content: '据闻茶楼讲的爱情故事缠绵悱恻，连铁石心肠的人听了都要落泪。',
    tone: 'positive',
    category: 'story',
    affectedTags: ['爱情', '婉约', '才子佳人'],
    customerTypeBoost: ['妇人', '书生'],
    heatModifier: 8,
  },
  {
    content: '那茶馆的历史故事讲得头头是道，仿佛亲眼所见一般。',
    tone: 'positive',
    category: 'story',
    affectedTags: ['历史', '谋略', '官场'],
    customerTypeBoost: ['官员', '商贾', '书生'],
    heatModifier: 12,
  },
  {
    content: '听说茶楼最近在讲神怪故事，讲得跟真的一样，晚上听了都不敢走夜路。',
    tone: 'positive',
    category: 'story',
    affectedTags: ['神怪', '悬疑', '灵异'],
    customerTypeBoost: ['平民', '江湖人'],
    heatModifier: 9,
  },
  {
    content: '那茶楼的说书水平也不过如此，听了半天都不知道在讲什么。',
    tone: 'negative',
    category: 'story',
    heatModifier: -8,
    customerTypeReduce: ['书生', '官员'],
  },
  {
    content: '听说茶楼的茶博士嘴不严，什么话都往外说，小心你的秘密被传得满城皆知。',
    tone: 'negative',
    category: 'shop',
    officialChance: 0.15,
    customerTypeReduce: ['官员', '商贾'],
  },
  {
    content: '据说那茶楼藏着什么不可告人的秘密，官府都在暗中调查呢。',
    tone: 'negative',
    category: 'official',
    officialChance: 0.3,
    customerTypeReduce: ['商贾', '官员'],
  },
  {
    content: '茶楼最近来了一位神秘客人，出手阔绰，听说是哪位大人物微服私访。',
    tone: 'neutral',
    category: 'customer',
    customerTypeBoost: ['官员', '商贾'],
    heatModifier: 5,
  },
  {
    content: '听说江湖上的好汉都喜欢去那家茶楼，说不定能遇到传说中的大侠。',
    tone: 'positive',
    category: 'customer',
    customerTypeBoost: ['江湖人', '平民'],
    heatModifier: 7,
  },
  {
    content: '那家茶楼的茶点味道一绝，配上说书简直是人生一大享受。',
    tone: 'positive',
    category: 'shop',
    customerTypeBoost: ['妇人', '商贾', '书生'],
    heatModifier: 6,
  },
  {
    content: '听说有人在茶楼听书听入了迷，回家后竟能一字不漏地复述出来。',
    tone: 'positive',
    category: 'story',
    heatModifier: 8,
    customerTypeBoost: ['书生', '平民'],
  },
  {
    content: '据说茶楼的说书先生知道很多官场秘闻，讲出来怕是要掉脑袋的。',
    tone: 'negative',
    category: 'official',
    officialChance: 0.25,
    customerTypeBoost: ['平民'],
    customerTypeReduce: ['官员'],
  },
]

export const RUMOR_ACTIONS: RumorAction[] = [
  {
    id: 'amplify',
    name: '故意放大',
    description: '花钱雇人散布传闻，让传闻传播得更广',
    cost: 50,
    costType: 'gold',
    effect: {
      intensityChange: 15,
    },
  },
  {
    id: 'clarify',
    name: '私下澄清',
    description: '花些钱打点，让负面传闻慢慢平息',
    cost: 80,
    costType: 'gold',
    effect: {
      intensityChange: -20,
    },
  },
  {
    id: 'boost-rep',
    name: '以正视听',
    description: '用声望担保，消除不利传闻的影响',
    cost: 10,
    costType: 'reputation',
    effect: {
      intensityChange: -15,
      toneChange: 'neutral',
    },
  },
]

export const TEA_MASTER_OPTIONS: TeaMasterOption[] = [
  {
    id: 'to-positive',
    name: '往好了说',
    description: '让茶博士把传闻往正面方向引导',
    cost: 60,
    newContent: '经茶博士证实，那茶楼的说书确实精彩绝伦，值得一听！',
    newTone: 'positive',
    newCategory: 'story',
  },
  {
    id: 'to-neutral',
    name: '大事化小',
    description: '让茶博士把传闻淡化，变成无关紧要的小事',
    cost: 40,
    newContent: '茶博士说了，不过是些坊间闲谈，当不得真的。',
    newTone: 'neutral',
    newCategory: 'shop',
  },
  {
    id: 'to-other-story',
    name: '移花接木',
    description: '把传闻引到另一个故事上，转移注意力',
    cost: 70,
    newContent: '茶博士透露，茶楼还有更精彩的故事没讲呢，大家不妨期待一下。',
    newTone: 'positive',
    newCategory: 'story',
  },
]

export function generateRumorFromStory(
  storyId: string,
  branchId: string,
  tags: string[],
  satisfaction: number,
  day: number
): Rumor {
  const isPositive = satisfaction >= 50
  const relevantTemplates = RUMOR_TEMPLATES.filter((t) => {
    if (t.affectedTags && t.affectedTags.length > 0) {
      return t.affectedTags.some((tag) => tags.includes(tag))
    }
    return t.category === 'story'
  })

  const pool = relevantTemplates.length > 0 ? relevantTemplates : RUMOR_TEMPLATES
  const template = pool[Math.floor(Math.random() * pool.length)]

  let tone = template.tone
  if (!isPositive && tone === 'positive') {
    tone = Math.random() > 0.5 ? 'negative' : 'neutral'
  }

  const intensity = Math.floor(10 + Math.random() * 20 + (satisfaction - 50) * 0.3)

  return {
    id: `rumor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    content: template.content,
    tone,
    category: template.category,
    intensity: Math.max(5, Math.min(100, intensity)),
    sourceStoryId: storyId,
    sourceBranchId: branchId,
    affectedTags: template.affectedTags,
    customerTypeBoost: template.customerTypeBoost,
    customerTypeReduce: template.customerTypeReduce,
    heatModifier: template.heatModifier ? (isPositive ? template.heatModifier : -template.heatModifier) : 0,
    officialChance: template.officialChance || 0,
    createdAt: Date.now(),
    dayCreated: day,
  }
}

export function getRumorsByCategory(rumors: Rumor[], category: string): Rumor[] {
  return rumors.filter((r) => r.category === category)
}

export function getTotalRumorIntensity(rumors: Rumor[]): number {
  return rumors.reduce((sum, r) => sum + r.intensity, 0)
}

export function getRumorHeatModifier(rumors: Rumor[], storyTags: string[]): number {
  let modifier = 0
  for (const rumor of rumors) {
    if (rumor.heatModifier) {
      if (rumor.affectedTags && rumor.affectedTags.length > 0) {
        const matchCount = rumor.affectedTags.filter((t) => storyTags.includes(t)).length
        if (matchCount > 0) {
          modifier += rumor.heatModifier * (matchCount / rumor.affectedTags.length)
        }
      } else {
        modifier += rumor.heatModifier * 0.5
      }
    }
  }
  return Math.round(modifier)
}

export function getCustomerTypeModifier(
  rumors: Rumor[],
  customerType: CustomerType
): number {
  let modifier = 0
  for (const rumor of rumors) {
    if (rumor.customerTypeBoost?.includes(customerType)) {
      modifier += rumor.intensity * 0.02
    }
    if (rumor.customerTypeReduce?.includes(customerType)) {
      modifier -= rumor.intensity * 0.02
    }
  }
  return modifier
}

export function getOfficialInspectionChance(rumors: Rumor[]): number {
  let chance = 0.05
  for (const rumor of rumors) {
    if (rumor.officialChance && rumor.tone === 'negative') {
      chance += rumor.officialChance * (rumor.intensity / 100)
    }
  }
  return Math.min(0.8, chance)
}

export function decayRumors(rumors: Rumor[], daysPassed: number = 1): Rumor[] {
  return rumors
    .map((r) => ({
      ...r,
      intensity: Math.max(0, r.intensity - daysPassed * 5),
    }))
    .filter((r) => r.intensity > 0)
}
