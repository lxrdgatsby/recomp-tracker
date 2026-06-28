import { ArrowUp, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useChat } from '../../hooks/useChat'
import { MedicalDisclaimer } from '../layout/MedicalDisclaimer'

const SUGGESTIONS = [
  'What should my Retatrutide titration look like?',
  'Review my current peptide stack',
  'Help me plan my 90-day recomp',
  'What are common Tesamorelin side effects?',
]

export function AIChatDashboard() {
  const { messages, loading, sendMessage } = useChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || loading) return
    sendMessage(input)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col lg:h-[calc(100vh-0px)]">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {messages.length <= 1 && (
            <div className="pt-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10">
                <Sparkles className="text-teal-400" size={24} />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Peptide Protocol Assistant
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Ask anything about peptides, dosing, stacking, or your 90-day
                plan. I can update your profile from our conversation.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-teal-500/15 text-slate-100'
                    : 'bg-navy-800/80 text-slate-300'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-navy-800/80 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-slate-800/80 bg-navy-950/95 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto max-w-2xl">
          {messages.length <= 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="rounded-full border border-slate-800 bg-navy-900 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-teal-500/30 hover:text-teal-400"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about peptides, dosing, your stack, or training…"
              rows={1}
              className="w-full resize-none rounded-2xl border border-slate-700 bg-navy-900 py-3.5 pr-14 pl-4 text-base text-slate-100 placeholder:text-slate-500 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 bottom-2 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-navy-950 transition-colors hover:bg-teal-400 disabled:opacity-40"
              aria-label="Send message"
            >
              <ArrowUp size={18} />
            </button>
          </form>

          <div className="mt-3">
            <MedicalDisclaimer compact />
          </div>
        </div>
      </div>
    </div>
  )
}