import { Shield, AlertTriangle, Coins, Trophy } from 'lucide-react'
import { useGameStore } from '@/store/useGameStore'
import type { OfficialInspection as OfficialInspectionType } from '@/types'

interface Props {
  inspection: OfficialInspectionType
}

export default function OfficialInspection({ inspection }: Props) {
  const { resolveOfficialInspection, gold, reputation } = useGameStore()

  const canAffordFine = gold >= inspection.fine
  const canAffordRepLoss = reputation >= inspection.reputationLoss

  return (
    <div className="fixed inset-0 bg-ink/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="scroll-panel max-w-md w-full animate-slideUp">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-cinnabar/20 border-2 border-cinnabar flex items-center justify-center animate-pulse">
            <Shield className="w-7 h-7 text-cinnabar" />
          </div>
          <div>
            <div className="text-xs text-cinnabar font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              官府巡查
            </div>
            <div className="font-brush text-xl text-ink mt-1">官差上门</div>
          </div>
        </div>

        <div className="bg-paper-dark/40 rounded-lg p-4 mb-4">
          <p className="text-sm text-ink font-song leading-relaxed">
            {inspection.reason}
          </p>
          <div className="mt-3 text-xs text-ink-light">
            巡查严重度：
            <span className="text-cinnabar font-semibold ml-1">{inspection.severity}</span>
          </div>
        </div>

        <div className="divider-ancient text-sm font-brush">处罚</div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-2 bg-paper-dark/30 rounded">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-gold" />
              <span className="text-sm text-ink">罚银</span>
            </div>
            <span className={`font-semibold ${canAffordFine ? 'text-gold' : 'text-cinnabar'}`}>
              -{inspection.fine} 金币
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-paper-dark/30 rounded">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-cinnabar" />
              <span className="text-sm text-ink">声望损失</span>
            </div>
            <span className={`font-semibold ${canAffordRepLoss ? 'text-cinnabar' : 'text-cinnabar'}`}>
              -{inspection.reputationLoss} 声望
            </span>
          </div>
        </div>

        <button
          onClick={resolveOfficialInspection}
          className="w-full py-3 rounded-lg bg-cinnabar text-white font-song font-medium hover:bg-cinnabar/90 transition-all active:scale-[0.98]"
        >
          认罚结案
        </button>

        <p className="text-xs text-ink-light text-center mt-3">
          负面传闻越多，官府巡查的几率和处罚越重
        </p>
      </div>
    </div>
  )
}
