import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  GameState,
  Weather,
  Snack,
  Seat,
  Customer,
  Story,
  StoryBranch,
  InterruptionEvent,
  InterruptionOption,
  LedgerRecord,
  StoryRecord,
  ReputationHistory,
  Renovation,
  Rumor,
  RumorAction,
  TeaMasterOption,
  OfficialInspection,
} from '@/types'
import { STORIES, getInitialBranchUnlocks, checkBranchUnlocks } from '@/data/stories'
import { initSnacks } from '@/data/snacks'
import { initSeats } from '@/data/seats'
import { initRenovations, getUpgradeCost } from '@/data/renovations'
import { INTERRUPTIONS } from '@/data/interruptions'
import { generateRandomCustomers, generateWeightedCustomers, CUSTOMER_TEMPLATES } from '@/data/customers'
import { calcSettlement } from '@/utils/settlement'
import {
  generateRumorFromStory,
  decayRumors,
  getOfficialInspectionChance,
  getRumorHeatModifier,
  getCustomerTypeModifier,
} from '@/data/rumors'

const WEATHERS: Weather[] = ['晴', '晴', '晴', '云', '云', '雨', '雪']

function randomWeather(): Weather {
  return WEATHERS[Math.floor(Math.random() * WEATHERS.length)]
}

function pickRandomStories(count: number): Story[] {
  const pool = [...STORIES]
  const result: Story[] = []
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result
}

function uid(): string {
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const initialState: GameState = {
  day: 1,
  phase: 'day',
  gold: 200,
  reputation: 30,
  weather: '晴',
  snacks: initSnacks(),
  seats: initSeats(),
  renovations: initRenovations(),
  customers: [],
  currentStory: null,
  currentBranch: null,
  storyProgress: 0,
  availableStories: [],
  interruptions: INTERRUPTIONS,
  currentInterruption: null,
  performanceActive: false,
  ledger: [],
  storyHistory: [],
  reputationHistory: [],
  lastStoryDay: {},
  storyScores: {},
  isSettlement: false,
  lastSettlement: null,
  rumors: [],
  officialInspection: null,
  branchUnlocks: getInitialBranchUnlocks(),
  lastRumorDay: 0,
}

interface GameActions {
  buySnack: (snackId: string, qty: number) => void
  moveSeat: (seatId: number, x: number, y: number) => void
  upgradeRenovation: (renoId: string) => void
  switchToNight: () => void
  selectStory: (storyId: string, branchId: string) => void
  startPerformance: () => void
  tickPerformance: () => void
  handleInterruption: (option: InterruptionOption) => void
  doSettlement: () => void
  nextDay: () => void
  resetGame: () => void
  addLedgerRecord: (type: LedgerRecord['type'], category: string, amount: number, note: string) => void
  addRumor: (rumor: Rumor) => void
  amplifyRumor: (rumorId: string) => void
  clarifyRumor: (rumorId: string) => void
  useTeaMaster: (rumorId: string, option: TeaMasterOption) => void
  resolveOfficialInspection: () => void
}

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      buySnack: (snackId: string, qty: number) => {
        const state = get()
        const snack = state.snacks.find((s) => s.id === snackId)
        if (!snack) return
        const totalCost = snack.cost * qty
        if (state.gold < totalCost) return
        const newStock = Math.min(snack.maxStock, snack.stock + qty)
        const actualQty = newStock - snack.stock
        if (actualQty <= 0) return
        const actualCost = snack.cost * actualQty

        set((s) => ({
          gold: s.gold - actualCost,
          snacks: s.snacks.map((x) =>
            x.id === snackId ? { ...x, stock: newStock } : x
          ),
        }))
        get().addLedgerRecord('支出', '茶点采购', actualCost, `采购${snack.name} x${actualQty}`)
      },

      moveSeat: (seatId: number, x: number, y: number) => {
        set((s) => ({
          seats: s.seats.map((seat) =>
            seat.id === seatId ? { ...seat, x, y } : seat
          ),
        }))
      },

      upgradeRenovation: (renoId: string) => {
        const state = get()
        const reno = state.renovations.find((r) => r.id === renoId)
        if (!reno || reno.level >= reno.maxLevel) return
        const cost = getUpgradeCost(reno)
        if (state.gold < cost) return

        const repGain = reno.bonusReputation

        set((s) => ({
          gold: s.gold - cost,
          reputation: Math.min(100, s.reputation + repGain),
          renovations: s.renovations.map((r) =>
            r.id === renoId ? { ...r, level: r.level + 1 } : r
          ),
          reputationHistory: [
            ...s.reputationHistory,
            {
              day: s.day,
              value: Math.min(100, s.reputation + repGain),
              delta: repGain,
              reason: `装修升级：${reno.name}`,
            },
          ],
        }))
        get().addLedgerRecord('支出', '装修升级', cost, `升级${reno.name}至${reno.level + 1}级`)
      },

      switchToNight: () => {
        const state = get()
        const weather = state.weather
        let customerCount = 6
        if (weather === '雨') customerCount = Math.max(2, customerCount - 3)
        if (weather === '雪') customerCount = Math.max(2, customerCount - 4)
        if (weather === '云') customerCount = Math.max(3, customerCount - 1)
        if (state.reputation > 50) customerCount += 2
        if (state.reputation > 80) customerCount += 2

        const positiveRumorIntensity = state.rumors
          .filter((r) => r.tone === 'positive')
          .reduce((sum, r) => sum + r.intensity, 0)
        if (positiveRumorIntensity > 30) customerCount += 1
        if (positiveRumorIntensity > 60) customerCount += 1

        const negativeRumorIntensity = state.rumors
          .filter((r) => r.tone === 'negative')
          .reduce((sum, r) => sum + r.intensity, 0)
        if (negativeRumorIntensity > 40) customerCount = Math.max(2, customerCount - 1)
        if (negativeRumorIntensity > 70) customerCount = Math.max(2, customerCount - 1)

        const typeWeights: Record<string, number> = {}
        for (const tpl of CUSTOMER_TEMPLATES) {
          typeWeights[tpl.type] = 1 + getCustomerTypeModifier(state.rumors, tpl.type)
        }

        const customers = generateWeightedCustomers(customerCount, typeWeights)
        const seats = [...state.seats].map((s) => ({ ...s, occupied: false }))
        const sortedSeats = [...seats].sort((a, b) => {
          const order: Record<Seat['tier'], number> = { 贵宾: 0, 雅座: 1, 普通: 2 }
          return order[a.tier] - order[b.tier]
        })
        for (let i = 0; i < Math.min(customers.length, sortedSeats.length); i++) {
          const seat = sortedSeats[i]
          customers[i].seatId = seat.id
          const idx = seats.findIndex((s) => s.id === seat.id)
          if (idx >= 0) seats[idx].occupied = true
        }

        const updatedUnlocks = checkBranchUnlocks(state.branchUnlocks, state.rumors)
        const unlockedBranchIds = updatedUnlocks
          .filter((u) => u.unlocked)
          .map((u) => u.branchId)

        const rawStories = pickRandomStories(3)
        const availableStories = rawStories.map((story) => {
          const visibleBranches = story.branches.filter((branch, index) => {
            if (index < 2) return true
            return unlockedBranchIds.includes(branch.id)
          })
          return {
            ...story,
            branches: visibleBranches,
            heat: Math.min(
              100,
              Math.max(
                0,
                story.heat + getRumorHeatModifier(state.rumors, story.tags)
              )
            ),
          }
        })

        set({
          phase: 'night',
          customers,
          seats,
          availableStories,
          currentStory: null,
          currentBranch: null,
          storyProgress: 0,
          performanceActive: false,
          currentInterruption: null,
          branchUnlocks: updatedUnlocks,
        })
      },

      selectStory: (storyId: string, branchId: string) => {
        const state = get()
        const story = state.availableStories.find((s) => s.id === storyId)
        const branch = story?.branches.find((b) => b.id === branchId)
        if (!story || !branch) return
        set({ currentStory: story, currentBranch: branch, storyProgress: 0 })
      },

      startPerformance: () => {
        const state = get()
        if (!state.currentStory || !state.currentBranch) return
        set({ performanceActive: true, storyProgress: 0 })
      },

      tickPerformance: () => {
        const state = get()
        if (!state.performanceActive) return

        const newProgress = Math.min(100, state.storyProgress + 4)

        if (!state.currentInterruption && Math.random() < 0.18 && state.storyProgress > 10 && state.storyProgress < 90) {
          const seatedCustomers = state.customers.filter((c) => c.seatId !== null)
          if (seatedCustomers.length > 0) {
            const c = seatedCustomers[Math.floor(Math.random() * seatedCustomers.length)]
            const matching = state.interruptions.filter((i) => i.customerType === c.type)
            const pool = matching.length > 0 ? matching : state.interruptions
            const ev = pool[Math.floor(Math.random() * pool.length)]
            set({ currentInterruption: ev, storyProgress: newProgress })
            return
          }
        }

        const customers = state.customers.map((c) => {
          if (c.seatId === null) return c
          let delta = Math.random() < 0.7 ? 1 : -1
          if (state.currentStory && state.currentBranch) {
            const match = state.currentBranch.tags.some((t) => c.preferenceTags.includes(t))
            if (match) delta += 1
          }
          return { ...c, satisfaction: Math.max(0, Math.min(100, c.satisfaction + delta)) }
        })

        if (newProgress >= 100) {
          set({ performanceActive: false, storyProgress: 100, customers })
          setTimeout(() => get().doSettlement(), 600)
        } else {
          set({ storyProgress: newProgress, customers })
        }
      },

      handleInterruption: (option: InterruptionOption) => {
        const state = get()
        if (!state.currentInterruption) return

        const customers = state.customers.map((c) => ({
          ...c,
          satisfaction: Math.max(0, Math.min(100, c.satisfaction + option.satisfactionEffect)),
        }))

        const newReputation = Math.max(0, Math.min(100, state.reputation + option.reputationEffect))

        set({
          currentInterruption: null,
          customers,
          gold: state.gold + option.goldEffect,
          reputation: newReputation,
        })

        if (option.goldEffect !== 0) {
          get().addLedgerRecord(
            option.goldEffect > 0 ? '收入' : '支出',
            '插话应对',
            Math.abs(option.goldEffect),
            option.text.slice(0, 20)
          )
        }

        if (option.reputationEffect !== 0) {
          set((s) => ({
            reputationHistory: [
              ...s.reputationHistory,
              {
                day: s.day,
                value: newReputation,
                delta: option.reputationEffect,
                reason: option.reputationEffect > 0 ? '插话应对得当' : '插话处理失当',
              },
            ],
          }))
        }
      },

      doSettlement: () => {
        const state = get()
        if (!state.currentStory || !state.currentBranch) return

        const result = calcSettlement(
          state.day,
          state.currentStory,
          state.currentBranch,
          state.customers,
          state.seats,
          state.renovations,
          state.storyHistory,
          state.lastStoryDay,
          state.storyScores,
          state.reputation,
          state.snacks
        )

        const storyRecord: StoryRecord = {
          day: state.day,
          storyId: state.currentStory.id,
          branchId: state.currentBranch.id,
          audienceCount: result.audienceCount,
          earnings: result.totalEarnings,
          avgSatisfaction: result.avgSatisfaction,
        }

        const newStoryScores = { ...state.storyScores }
        if (!newStoryScores[state.currentStory.id]) {
          newStoryScores[state.currentStory.id] = []
        }
        newStoryScores[state.currentStory.id] = [
          ...newStoryScores[state.currentStory.id],
          result.avgSatisfaction,
        ].slice(-10)

        const newRep = Math.max(0, Math.min(100, state.reputation + result.reputationDelta))

        const repHistory: ReputationHistory = {
          day: state.day,
          value: newRep,
          delta: result.reputationDelta,
          reason: result.reputationDelta >= 0 ? '说书好评' : '差评影响',
        }

        set((s) => ({
          isSettlement: true,
          lastSettlement: result,
          gold: s.gold + result.totalEarnings,
          reputation: newRep,
          storyHistory: [...s.storyHistory, storyRecord],
          lastStoryDay: { ...s.lastStoryDay, [state.currentStory!.id]: state.day },
          storyScores: newStoryScores,
          reputationHistory: [...s.reputationHistory, repHistory],
        }))

        get().addLedgerRecord('收入', '基础门票', result.baseEarnings, '晚场门票')
        if (result.tasteMatchBonus > 0)
          get().addLedgerRecord('收入', '口味匹配', result.tasteMatchBonus, '故事对味')
        if (result.seatViewBonus > 0)
          get().addLedgerRecord('收入', '视野加成', result.seatViewBonus, '座位优良')
        if (result.storyHeatBonus > 0)
          get().addLedgerRecord('收入', '热度加成', result.storyHeatBonus, '故事热门')
        if (result.serialExpectBonus > 0)
          get().addLedgerRecord('收入', '连载期待', result.serialExpectBonus, '观众期待')
        if (result.tips > 0)
          get().addLedgerRecord('收入', '客人打赏', result.tips, '客人满意打赏')
        if (result.snackRevenue > 0)
          get().addLedgerRecord('收入', '茶点售卖', result.snackRevenue, '消费茶点')
        if (result.badReviewPenalty > 0)
          get().addLedgerRecord('支出', '差评损失', result.badReviewPenalty, '客人不满索赔')

        const rumorCount = Math.floor(Math.random() * 2) + 1
        const allTags = [
          ...state.currentStory.tags,
          ...state.currentBranch.tags,
        ]
        for (let i = 0; i < rumorCount; i++) {
          const rumor = generateRumorFromStory(
            state.currentStory.id,
            state.currentBranch.id,
            allTags,
            result.avgSatisfaction,
            state.day
          )
          get().addRumor(rumor)
        }
      },

      nextDay: () => {
        const state = get()
        const decayedRumors = decayRumors(state.rumors, 1)

        let inspection: OfficialInspection | null = null
        const inspectionChance = getOfficialInspectionChance(state.rumors)
        if (Math.random() < inspectionChance) {
          const negativeRumors = state.rumors.filter((r) => r.tone === 'negative')
          const severity = Math.min(
            100,
            negativeRumors.reduce((sum, r) => sum + r.intensity, 0) / Math.max(1, negativeRumors.length)
          )
          inspection = {
            active: true,
            severity: Math.round(severity),
            reason: '坊间传闻不利，官府上门巡查',
            fine: Math.round(severity * 2),
            reputationLoss: Math.round(severity * 0.3),
          }
        }

        set((s) => ({
          day: s.day + 1,
          phase: 'day',
          weather: randomWeather(),
          customers: [],
          currentStory: null,
          currentBranch: null,
          storyProgress: 0,
          availableStories: [],
          performanceActive: false,
          currentInterruption: null,
          isSettlement: false,
          seats: s.seats.map((seat) => ({ ...seat, occupied: false })),
          rumors: decayedRumors,
          officialInspection: inspection,
        }))
      },

      resetGame: () => {
        set({ ...initialState, weather: randomWeather() })
      },

      addLedgerRecord: (type, category, amount, note) => {
        set((s) => ({
          ledger: [
            ...s.ledger,
            {
              day: s.day,
              id: uid(),
              type,
              category,
              amount,
              note,
              timestamp: Date.now(),
            },
          ],
        }))
      },

      addRumor: (rumor) => {
        set((s) => ({
          rumors: [...s.rumors, rumor],
          lastRumorDay: s.day,
        }))
      },

      amplifyRumor: (rumorId) => {
        const state = get()
        const cost = 50
        if (state.gold < cost) return

        set((s) => ({
          gold: s.gold - cost,
          rumors: s.rumors.map((r) =>
            r.id === rumorId
              ? { ...r, intensity: Math.min(100, r.intensity + 15) }
              : r
          ),
        }))
        get().addLedgerRecord('支出', '传闻操作', cost, '故意放大传闻')
      },

      clarifyRumor: (rumorId) => {
        const state = get()
        const cost = 80
        if (state.gold < cost) return

        set((s) => ({
          gold: s.gold - cost,
          rumors: s.rumors.map((r) =>
            r.id === rumorId
              ? { ...r, intensity: Math.max(0, r.intensity - 20) }
              : r
          ).filter((r) => r.intensity > 0),
        }))
        get().addLedgerRecord('支出', '传闻操作', cost, '私下澄清传闻')
      },

      useTeaMaster: (rumorId, option) => {
        const state = get()
        if (state.gold < option.cost) return

        set((s) => ({
          gold: s.gold - option.cost,
          rumors: s.rumors.map((r) =>
            r.id === rumorId
              ? {
                  ...r,
                  content: option.newContent,
                  tone: option.newTone,
                  category: option.newCategory,
                  intensity: Math.max(5, r.intensity - 5),
                }
              : r
          ),
        }))
        get().addLedgerRecord('支出', '茶博士改口', option.cost, option.name)
      },

      resolveOfficialInspection: () => {
        const state = get()
        if (!state.officialInspection) return

        const inspection = state.officialInspection
        const newGold = state.gold - inspection.fine
        const newRep = Math.max(0, state.reputation - inspection.reputationLoss)

        set((s) => ({
          gold: newGold,
          reputation: newRep,
          officialInspection: null,
          reputationHistory: [
            ...s.reputationHistory,
            {
              day: s.day,
              value: newRep,
              delta: -inspection.reputationLoss,
              reason: '官府巡查处罚',
            },
          ],
        }))

        if (inspection.fine > 0) {
          get().addLedgerRecord('支出', '官府巡查', inspection.fine, inspection.reason)
        }
      },
    }),
    {
      name: 'teahouse-storyteller-save',
      partialize: (s) => ({
        day: s.day,
        gold: s.gold,
        reputation: s.reputation,
        snacks: s.snacks,
        seats: s.seats,
        renovations: s.renovations,
        ledger: s.ledger,
        storyHistory: s.storyHistory,
        reputationHistory: s.reputationHistory,
        lastStoryDay: s.lastStoryDay,
        storyScores: s.storyScores,
        rumors: s.rumors,
        officialInspection: s.officialInspection,
        branchUnlocks: s.branchUnlocks,
        lastRumorDay: s.lastRumorDay,
      }),
    }
  )
)
