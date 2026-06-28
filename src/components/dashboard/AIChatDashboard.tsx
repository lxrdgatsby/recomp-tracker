import { ArrowUp, History, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useChat } from '../../hooks/useChat'
import { MedicalDisclaimer } from '../layout/MedicalDisclaimer'
import { CHAT_SUGGESTIONS } from '../../constants/chatPrompts'
import { ChatHistorySidebar } from './ChatHistorySidebar'

export function AIChatDashboard() {
  const {
    messages,
    loading,
    sendMessage,
    conversations,
    activeConversationId,
    isDraft,
    selectConversation,
    startNewConversation,
    pinConversation,
    removeConversation,
    refreshConversations,
  } = useChat()

  const handleSuggestion = (text: string) => {
    if (loading) return
    void sendMessage(text)
  }
  const [input, setInput] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const showEmptyState = messages.length === 0

  const updateSuggestionVisibility = () => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight
    setShowSuggestions(distanceFromBottom < 72)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    requestAnimationFrame(updateSuggestionVisibility)
  }, [messages, loading])

  useEffect(() => {
    if (showEmptyState) setShowSuggestions(true)
  }, [showEmptyState])

  useEffect(() => {
    if (historyOpen) {
      void refreshConversations()
    }
  }, [historyOpen, refreshConversations])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || loading) return
    sendMessage(input)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = '48px'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSelectConversation = (id: string) => {
    void selectConversation(id)
    setHistoryOpen(false)
  }

  const handleNewChat = () => {
    startNewConversation()
    setHistoryOpen(false)
  }

  const suggestionsVisible = showEmptyState || showSuggestions

  return (
    <div className="flex h-full min-h-0">
      <ChatHistorySidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        isDraft={isDraft}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onPin={(id, pinned) => void pinConversation(id, pinned)}
        onDelete={(id) => void removeConversation(id)}
        className="hidden lg:flex"
      />

      {historyOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setHistoryOpen(false)}
            aria-hidden
          />
          <ChatHistorySidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            isDraft={isDraft}
            onSelect={handleSelectConversation}
            onNewChat={handleNewChat}
            onPin={(id, pinned) => void pinConversation(id, pinned)}
            onDelete={(id) => void removeConversation(id)}
            onClose={() => setHistoryOpen(false)}
            className="fixed inset-y-0 left-0 z-50 lg:hidden"
          />
        </>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800/80 px-4 py-2.5 lg:hidden">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:border-teal-500/30 hover:text-teal-400"
          >
            <History size={14} />
            History
          </button>
          <button
            type="button"
            onClick={handleNewChat}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:border-teal-500/30 hover:text-teal-400"
          >
            New chat
          </button>
        </div>

        <div
          ref={scrollRef}
          onScroll={updateSuggestionVisibility}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-4 max-lg:pb-[calc(var(--mobile-nav-height)+11rem)] lg:py-6"
        >
          <div className="mx-auto max-w-2xl space-y-6">
            {showEmptyState && (
              <div className="pt-2 text-center lg:pt-8">
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

        <div className="relative z-[60] shrink-0 border-t border-slate-800/80 bg-navy-950 px-4 pt-2.5 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-[var(--mobile-nav-height)] max-lg:pb-0 lg:relative lg:bottom-auto lg:bg-navy-950/95 lg:py-4 lg:backdrop-blur-md">
          <div className="mx-auto max-w-2xl">
            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                suggestionsVisible
                  ? 'mb-2 max-h-28 translate-y-0 opacity-100'
                  : 'pointer-events-none mb-0 max-h-0 translate-y-3 opacity-0'
              }`}
              aria-hidden={!suggestionsVisible}
            >
              <div className="flex flex-wrap gap-2">
                {CHAT_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggestion(s)}
                    tabIndex={suggestionsVisible ? 0 : -1}
                    className="rounded-full border border-slate-800 bg-navy-900 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-teal-500/30 hover:text-teal-400 active:scale-95"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="relative z-10 flex items-end gap-2 rounded-2xl border border-slate-700 bg-navy-900 px-3 py-2 focus-within:border-teal-500/50 focus-within:ring-1 focus-within:ring-teal-500/30"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  e.target.style.height = '48px'
                  e.target.style.height = `${Math.max(48, Math.min(e.target.scrollHeight, 120))}px`
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask about peptides, dosing, your stack, or training…"
                rows={2}
                className="min-h-[48px] max-h-[120px] flex-1 resize-none border-0 bg-transparent py-1 pl-1 text-base leading-[24px] text-slate-100 placeholder:whitespace-normal placeholder:leading-[24px] placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-navy-950 transition-colors hover:bg-teal-400 disabled:opacity-40"
                aria-label="Send message"
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            </form>

            <div className="mt-1.5">
              <MedicalDisclaimer compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}