import { ArrowUp, History, Star } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  ASSISTANT_INPUT_PLACEHOLDER,
  ASSISTANT_TITLE,
  ASSISTANT_WELCOME,
  CHAT_SUGGESTIONS,
} from '../../constants/chatPrompts'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import { useChat } from '../../hooks/useChat'
import { ChatHistorySidebar } from './ChatHistorySidebar'

export function AIChatDashboard() {
  const { userProfile } = useAuth()
  const { canInstall, canShowIOSGuide, isInstalled, install } = usePwaInstall()
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

  const [input, setInput] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const showInstall = !isInstalled && (canInstall || canShowIOSGuide)
  const showIntro = messages.length === 0 && !loading

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (historyOpen) {
      void refreshConversations()
    }
  }, [historyOpen, refreshConversations])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
    setShowQuickActions(true)
  }, [activeConversationId, isDraft])

  const handleMessagesScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setShowQuickActions(el.scrollTop < 80)
  }

  const handleSend = () => {
    if (!input.trim() || loading) return
    void sendMessage(input)
    setInput('')
  }

  const handleSelectConversation = (id: string) => {
    void selectConversation(id)
    setHistoryOpen(false)
  }

  const handleNewChat = () => {
    startNewConversation()
    setHistoryOpen(false)
  }

  return (
    <div className="flex h-full min-h-0 bg-[#0a0a0a] text-white">
      <ChatHistorySidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        isDraft={isDraft}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onPin={(id, pinned) => void pinConversation(id, pinned)}
        onDelete={(id) => void removeConversation(id)}
        className="hidden border-white/10 lg:flex"
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
            className="fixed inset-y-0 left-0 z-50 border-white/10 lg:hidden"
          />
        </>
      )}

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 pb-3 pt-1 lg:hidden">
          <Link
            to="/app"
            className="cursor-pointer rounded-lg transition-opacity hover:opacity-90"
            aria-label="Back to home"
          >
            <div className="text-xl font-semibold tracking-tight text-white">
              PeptideTracker
            </div>
            {userProfile?.username && (
              <div className="text-xs text-slate-400">
                @{userProfile.username}
              </div>
            )}
          </Link>
          {showInstall && (
            <button
              type="button"
              onClick={install}
              className="flex items-center gap-1 rounded-full bg-white/10 px-4 py-1.5 text-sm transition-colors hover:bg-white/15"
            >
              <span aria-hidden>↓</span> Install App
            </button>
          )}
        </div>

        <div className="flex shrink-0 gap-3 border-b border-white/10 px-6 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/5 py-2 text-sm transition-colors hover:bg-white/10"
          >
            <History size={14} />
            History
          </button>
          <button
            type="button"
            onClick={handleNewChat}
            className="flex-1 rounded-2xl bg-white/5 py-2 text-sm transition-colors hover:bg-white/10"
          >
            New chat
          </button>
        </div>

        <div className="flex shrink-0 justify-center pt-5 pb-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10">
            <Star className="text-emerald-400" size={36} />
          </div>
        </div>

        <div className="shrink-0 px-6 pb-6 text-center">
          <h2 className="text-2xl font-semibold">{ASSISTANT_TITLE}</h2>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleMessagesScroll}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 pb-32 lg:pb-4"
        >
          {showIntro && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-3xl bg-white/10 px-4 py-3 text-sm leading-relaxed text-slate-100">
                {ASSISTANT_WELCOME}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-emerald-500 text-black'
                    : 'bg-white/10 text-slate-100'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-3xl bg-white/10 px-4 py-3 text-sm text-slate-400">
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="fixed inset-x-0 bottom-[var(--mobile-nav-height)] z-30 border-t border-white/10 bg-[#0a0a0a] px-6 pt-4 pb-6 lg:relative lg:inset-x-auto lg:bottom-auto lg:z-auto lg:shrink-0">
          <div
            className={`mb-4 flex flex-wrap gap-2 transition-all duration-300 ${
              showQuickActions
                ? 'max-h-40 opacity-100'
                : 'max-h-0 overflow-hidden opacity-0'
            }`}
          >
            {CHAT_SUGGESTIONS.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => setInput(action)}
                disabled={loading}
                className="rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-40"
              >
                {action}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-3xl border border-white/20 bg-white/5 px-4 py-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={ASSISTANT_INPUT_PLACEHOLDER}
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-black transition-colors hover:bg-emerald-600 disabled:opacity-40"
              aria-label="Send message"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </div>

          <p className="mt-3 text-center text-[10px] text-slate-500">
            Not medical advice. Always consult your healthcare provider.
          </p>
        </div>
      </div>
    </div>
  )
}