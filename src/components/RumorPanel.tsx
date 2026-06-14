import { useState } from 'react'
import { MessageSquare, TrendingUp, TrendingDown, Minus, Volume2, VolumeX, User } from 'lucide-react'
import { useGameStore } from '@/store/useGameStore'
import { TEA_MASTER_OPTIONS } from '@/data/rumors'
import type { Rumor, TeaMasterOption } from '@/types'

function RumorCard({ rumor }: { rumor: Rumor }) {
  const [showActions, setShowActions] = useState(false)
  const [showTeaMaster, setShowTeaMaster] = useState(false)
  const { gold, amplifyRumor, clarifyRumor, useTeaMaster } = useGameStore()

  const toneConfig = {
    positive: { icon: TrendingUp, color: 'text-tea', bg: 'bg-tea/10', border: 'border-tea/30', label: '正面' },
    negative: { icon: TrendingDown, color: 'text-cinnabar', bg: 'bg-cinnabar/10', border: 'border-cinnabar/30', label: '负面' },
    neutral: { icon: Minus, color: 'text-sandal', bg: 'bg-sandal/10', border: 'border-sandal/30', label: '中性' },
  }

  const config = toneConfig[rumor.tone]
  const Icon = config.icon

  const handleAmplify = () => {
    amplifyRumor(rumor.id)
    setShowActions(false)
  }

  const handleClarify = () => {
    clarifyRumor(rumor.id)
    setShowActions(false)
  }

  const handleTeaMaster = (option: TeaMasterOption) => {
    useTeaMaster(rumor.id, option)
    setShowTeaMaster(false)
    setShowActions(false)
  }

  const categoryLabels: Record<string, string> = {
    story: '故事传闻',
    shop: '茶楼传闻',
    customer: '客人传闻',
    official: '官府传闻',
  }

  return (
    <div className={`p-3 rounded-lg border-2 ${config.border} ${config.bg} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`w-4 h-4 ${config.color}`} />
            <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
            <span className="text-xs text-ink-light">· {categoryLabels[rumor.category] || '其他'}</span>
          </div>
          <p className="text-sm text-ink font-song leading-relaxed">{rumor.content}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-light">传播度</span>
          <div className="w-20 h-1.5 bg-paper-dark rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${config.color.replace('text-', 'bg-')}`}
              style={{ width: `${rumor.intensity}%` }}
            />
          </div>
          <span className={`text-xs font-semibold ${config.color}`}>{rumor.intensity}</span>
        </div>

        <button
          onClick={() => setShowActions(!showActions)}
          className="text-xs px-2 py-1 rounded bg-paper-dark/50 text-ink-light hover:text-sandal hover:bg-sandal/20 transition-all"
        >
          操作
        </button>
      </div>

      {showActions && (
        <div className="mt-3 pt-3 border-t border-sandal/20 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAmplify}
              disabled={gold < 50}
              className="text-xs p-2 rounded bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Volume2 className="w-3 h-3 inline mr-1" />
              故意放大
              <span className="block text-xs opacity-70">50 金币</span>
            </button>
            <button
              onClick={handleClarify}
              disabled={gold < 80}
              className="text-xs p-2 rounded bg-tea/10 border border-tea/30 text-tea hover:bg-tea/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <VolumeX className="w-3 h-3 inline mr-1" />
              私下澄清
              <span className="block text-xs opacity-70">80 金币</span>
            </button>
          </div>
          <button
            onClick={() => setShowTeaMaster(!showTeaMaster)}
            className="w-full text-xs p-2 rounded bg-sandal/10 border border-sandal/30 text-sandal hover:bg-sandal/20 transition-all"
          >
            <User className="w-3 h-3 inline mr-1" />
            找茶博士改口
          </button>

          {showTeaMaster && (
            <div className="space-y-2 p-2 bg-paper-dark/30 rounded">
              <div className="text-xs text-ink-light mb-1">茶博士的办法：</div>
              {TEA_MASTER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleTeaMaster(opt)}
                  disabled={gold < opt.cost}
                  className="w-full text-left text-xs p-2 rounded bg-paper/50 border border-sandal/20 hover:border-gold hover:bg-gold/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-medium text-ink">{opt.name}</div>
                  <div className="text-ink-light text-xs mt-0.5">{opt.description}</div>
                  <div className="text-gold text-xs mt-1">{opt.cost} 金币</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function RumorPanel() {
  const { rumors } = useGameStore()

  const positiveCount = rumors.filter((r) => r.tone === 'positive').length
  const negativeCount = rumors.filter((r) => r.tone === 'negative').length
  const neutralCount = rumors.filter((r) => r.tone === 'neutral').length

  return (
    <div className="scroll-panel">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-sandal" />
        <h3 className="font-brush text-xl text-ink">坊间传闻</h3>
        <div className="ml-auto flex gap-3 text-xs">
          <span className="text-tea">正面 {positiveCount}</span>
          <span className="text-cinnabar">负面 {negativeCount}</span>
          <span className="text-sandal">中性 {neutralCount}</span>
        </div>
      </div>

      {rumors.length === 0 ? (
        <div className="text-center py-8 text-ink-light">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">暂无坊间传闻</p>
          <p className="text-xs mt-1 opacity-70">说完书后客人会带走传闻散播出去</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {rumors.map((rumor) => (
            <RumorCard key={rumor.id} rumor={rumor} />
          ))}
        </div>
      )}

      {rumors.length > 0 && (
        <div className="mt-4 pt-3 border-t border-sandal/20">
          <p className="text-xs text-ink-light leading-relaxed">
            💡 传闻会影响次日的来客类型、故事热度和官府巡查几率。
            正面传闻吸引更多对应类型客人，负面传闻可能引来官府注意。
          </p>
        </div>
      )}
    </div>
  )
}
