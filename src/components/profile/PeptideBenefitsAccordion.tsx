import { ChevronDown, Sparkles } from 'lucide-react'
import { useCallback, useState } from 'react'
import {
  getPeptideBenefitsGuidance,
  getPeptideBenefitsQuestion,
} from '../../constants/chatPrompts'
import { useAuth } from '../../contexts/AuthContext'
import { askAssistant } from '../../lib/askAssistant'
import { buildUserContextForChat } from '../../utils/buildUserContext'

type AnswerState = 'idle' | 'loading' | 'done' | 'error'

interface FaqEntry {
  state: AnswerState
  answer?: string
  error?: string
}

interface PeptideBenefitsAccordionProps {
  peptideName: string
  catalogId?: string
}

export function PeptideBenefitsAccordion({
  peptideName,
  catalogId,
}: PeptideBenefitsAccordionProps) {
  const { userProfile, trackerState } = useAuth()
  const question = getPeptideBenefitsQuestion(peptideName)
  const [expanded, setExpanded] = useState(false)
  const [entry, setEntry] = useState<FaqEntry | null>(null)

  const fetchAnswer = useCallback(async () => {
    setEntry({ state: 'loading' })

    try {
      const answer = await askAssistant(
        question,
        buildUserContextForChat(userProfile, trackerState),
        getPeptideBenefitsGuidance(peptideName, catalogId)
      )
      setEntry({ state: 'done', answer })
    } catch (err) {
      setEntry({
        state: 'error',
        error:
          err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again.',
      })
    }
  }, [question, userProfile, trackerState, peptideName, catalogId])

  const handleToggle = () => {
    if (expanded) {
      setExpanded(false)
      return
    }

    setExpanded(true)
    if (!entry || entry.state === 'error') {
      void fetchAnswer()
    }
  }

  const isLoading = entry?.state === 'loading'

  return (
    <div className="sm:col-span-2">
      <button
        type="button"
        onClick={handleToggle}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${
          expanded
            ? 'border-teal-500/40 bg-teal-500/5'
            : 'border-slate-800 bg-navy-900/60 hover:border-slate-700 hover:bg-navy-900'
        }`}
      >
        <span
          className={`text-sm font-medium ${
            expanded ? 'text-teal-400' : 'text-slate-200'
          }`}
        >
          {question}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-500 transition-transform ${
            expanded ? 'rotate-180 text-teal-400' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="mt-1 rounded-xl border border-slate-800/80 bg-navy-900/40 px-4 py-4">
          {isLoading && (
            <div className="flex items-center gap-3">
              <Sparkles size={16} className="animate-pulse text-teal-400" />
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400" />
              </div>
            </div>
          )}

          {entry?.state === 'error' && (
            <p className="text-sm text-red-400">{entry.error}</p>
          )}

          {entry?.state === 'done' && entry.answer && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-300">
              {entry.answer}
            </p>
          )}
        </div>
      )}
    </div>
  )
}