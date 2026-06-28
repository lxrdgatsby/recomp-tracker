import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react'
import { useCallback, useState } from 'react'
import { FAQ_QUESTIONS, getFaqGuidance } from '../../constants/chatPrompts'
import { useAuth } from '../../contexts/AuthContext'
import { askAssistant } from '../../lib/askAssistant'
import { buildUserContextForChat } from '../../utils/buildUserContext'

type AnswerState = 'idle' | 'loading' | 'done' | 'error'

interface FaqEntry {
  state: AnswerState
  answer?: string
  error?: string
}

export function FAQsView() {
  const { userProfile, trackerState } = useAuth()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [entries, setEntries] = useState<Record<string, FaqEntry>>({})

  const fetchAnswer = useCallback(
    async (question: string) => {
      setEntries((prev) => ({
        ...prev,
        [question]: { state: 'loading' },
      }))

      try {
        const answer = await askAssistant(
          question,
          buildUserContextForChat(userProfile, trackerState),
          getFaqGuidance(question)
        )
        setEntries((prev) => ({
          ...prev,
          [question]: { state: 'done', answer },
        }))
      } catch (err) {
        setEntries((prev) => ({
          ...prev,
          [question]: {
            state: 'error',
            error:
              err instanceof Error
                ? err.message
                : 'Something went wrong. Please try again.',
          },
        }))
      }
    },
    [userProfile, trackerState]
  )

  const handleToggle = (question: string) => {
    if (expanded === question) {
      setExpanded(null)
      return
    }

    setExpanded(question)
    const entry = entries[question]
    const hasAuthoritativeGuidance = Boolean(getFaqGuidance(question))
    if (
      !entry ||
      entry.state === 'error' ||
      (hasAuthoritativeGuidance && entry.state === 'done')
    ) {
      void fetchAnswer(question)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10">
          <HelpCircle className="text-teal-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">FAQs</h1>
          <p className="mt-1 text-sm text-slate-400">
            Commonly asked questions — tap any question and your AI assistant
            will generate a personalized answer.
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {FAQ_QUESTIONS.map((question) => {
          const isOpen = expanded === question
          const entry = entries[question]
          const isLoading = entry?.state === 'loading'

          return (
            <li key={question}>
              <button
                type="button"
                onClick={() => handleToggle(question)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                  isOpen
                    ? 'border-teal-500/40 bg-teal-500/5'
                    : 'border-slate-800 bg-navy-900/60 hover:border-slate-700 hover:bg-navy-900'
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    isOpen ? 'text-teal-400' : 'text-slate-200'
                  }`}
                >
                  {question}
                </span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-slate-500 transition-transform ${
                    isOpen ? 'rotate-180 text-teal-400' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="mt-1 rounded-xl border border-slate-800/80 bg-navy-900/40 px-4 py-4">
                  {isLoading && (
                    <div className="flex items-center gap-3">
                      <Sparkles
                        size={16}
                        className="animate-pulse text-teal-400"
                      />
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
            </li>
          )
        })}
      </ul>
    </div>
  )
}