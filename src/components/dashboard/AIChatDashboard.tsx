import { History } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useChat } from '../../hooks/useChat'
import { ASSISTANT_WELCOME, CHAT_SUGGESTIONS } from '../../constants/chatPrompts'
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

  const [input, setInput] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const showWelcome = messages.length === 0 && !loading

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (historyOpen) {
      void refreshConversations()
    }
  }, [historyOpen, refreshConversations])

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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-2.5 lg:hidden">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400"
          >
            <History size={14} />
            History
          </button>
          <button
            type="button"
            onClick={handleNewChat}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400"
          >
            New chat
          </button>
        </div>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-4 max-lg:pb-4"
        >
          {showWelcome && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-3xl bg-white/10 px-4 py-3 text-[15px] leading-relaxed">
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
                className={`max-w-[80%] rounded-3xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
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
              <div className="rounded-3xl bg-white/10 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 max-lg:pb-[var(--mobile-nav-height)]">
          <div className="flex flex-wrap gap-2 px-6 pb-3">
            {CHAT_SUGGESTIONS.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => setInput(action)}
                disabled={loading}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/20 disabled:opacity-40"
              >
                {action}
              </button>
            ))}
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="mx-auto flex max-w-2xl gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask anything or log your dose..."
                disabled={loading}
                className="flex-1 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="rounded-2xl bg-emerald-500 px-6 py-3 font-medium text-black transition-colors hover:bg-emerald-600 disabled:opacity-40"
              >
                Send
              </button>
            </div>
            <p className="mx-auto mt-2 max-w-2xl text-center text-[10px] text-slate-500">
              Not medical advice. Always consult your healthcare provider.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}