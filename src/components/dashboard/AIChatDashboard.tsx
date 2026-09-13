import { ArrowUp, History, Sparkles, Star } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { MedicalDisclaimer } from '../layout/MedicalDisclaimer'
import {
  ASSISTANT_INPUT_PLACEHOLDER,
  ASSISTANT_QUICK_CHIPS,
  ASSISTANT_TITLE,
  ASSISTANT_WELCOME,
} from '../../constants/chatPrompts'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import { useChat } from '../../hooks/useChat'
import { ChatHistorySidebar } from './ChatHistorySidebar'

const CHIP_EASE = 'duration-300 ease-out'
const SCROLL_THRESHOLD = 32
/** Matches BottomNav content + home-indicator; tighter than --mobile-nav-height. */
const NAV_CLEARANCE = '3rem'

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
  const [keyboardInset, setKeyboardInset] = useState(0)
  const [footerH, setFooterH] = useState(132)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const lastScrollTop = useRef(0)
  const scrollAcc = useRef(0)
  const ignoreRevealRef = useRef(false)

  const showInstall = !isInstalled && (canInstall || canShowIOSGuide)
  const hasUserMessage = messages.some((m) => m.role === 'user')
  const hasAssistantReply =
    loading || messages.some((m) => m.role === 'assistant')
  const showHero = !hasUserMessage
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
    lastScrollTop.current = 0
    scrollAcc.current = 0
    ignoreRevealRef.current = false
  }, [activeConversationId, isDraft])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const sync = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setKeyboardInset(inset > 40 ? inset : 0)
    }
    sync()
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
    }
  }, [])

  useEffect(() => {
    const el = footerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      setFooterH(el.getBoundingClientRect().height)
    })
    ro.observe(el)
    setFooterH(el.getBoundingClientRect().height)
    return () => ro.disconnect()
  }, [showQuickActions])

  const handleMessagesScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const top = el.scrollTop
    const delta = top - lastScrollTop.current
    lastScrollTop.current = top

    if (!hasAssistantReply) {
      setShowQuickActions(true)
      scrollAcc.current = 0
      return
    }

    if (ignoreRevealRef.current) {
      if (Math.abs(delta) < 2) return
      ignoreRevealRef.current = false
    }

    const fromBottom = el.scrollHeight - top - el.clientHeight
    const nearComposer = fromBottom < 56

    if (delta > 0) {
      scrollAcc.current = Math.max(0, scrollAcc.current) + delta
      if (scrollAcc.current >= SCROLL_THRESHOLD || nearComposer) {
        setShowQuickActions(true)
        scrollAcc.current = 0
      }
    } else if (delta < 0) {
      scrollAcc.current = Math.min(0, scrollAcc.current) + delta
      if (scrollAcc.current <= -SCROLL_THRESHOLD && !nearComposer) {
        setShowQuickActions(false)
        scrollAcc.current = 0
      }
    }
  }

  const hideChipsForReply = () => {
    ignoreRevealRef.current = true
    scrollAcc.current = 0
    setShowQuickActions(false)
  }

  const handleSend = () => {
    if (!input.trim() || loading) return
    hideChipsForReply()
    void sendMessage(input)
    setInput('')
  }

  const handleQuickPrompt = (action: string) => {
    if (loading) return
    hideChipsForReply()
    void sendMessage(action)
  }

  const handleSelectConversation = (id: string) => {
    void selectConversation(id)
    setHistoryOpen(false)
  }

  const handleNewChat = () => {
    startNewConversation()
    setHistoryOpen(false)
  }

  const composerBottom =
    keyboardInset > 40
      ? keyboardInset
      : `calc(${NAV_CLEARANCE} + env(safe-area-inset-bottom, 0px))`

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
        {/* Top Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 pb-3 pt-3 lg:hidden">
          <div>
            <div className="text-xl font-semibold tracking-tight text-white">
              PeptideTracker
            </div>
            {userProfile?.username && (
              <div className="text-xs text-gray-400">
                @{userProfile.username}
              </div>
            )}
          </div>
          {showInstall && (
            <button
              type="button"
              onClick={install}
              className="flex items-center gap-1 rounded-full bg-white/10 px-4 py-1.5 text-sm transition-colors hover:bg-white/15"
            >
              ↓ Install App
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

        {showHero && (
          <>
            <div className="flex shrink-0 justify-center pt-5 pb-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10">
                <Star className="text-emerald-400" size={36} />
              </div>
            </div>
            <div className="shrink-0 px-6 pb-4 text-center">
              <h2 className="text-2xl font-semibold">{ASSISTANT_TITLE}</h2>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400">
                <Sparkles size={12} />
                Context active
              </div>
              <p className="mx-auto mt-2 max-w-sm text-xs text-slate-500">
                Coach can see your stack, recent doses, check-ins, vials & plan
                health
              </p>
            </div>
          </>
        )}

        {!showHero && (
          <div className="flex shrink-0 justify-center border-b border-white/5 px-6 py-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Context active
            </div>
          </div>
        )}

        <div
          ref={scrollRef}
          onScroll={handleMessagesScroll}
          className={`min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 ${
            showHero ? '' : 'pt-3'
          }`}
          style={{ paddingBottom: footerH + 16 }}
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
              <div className="flex items-center gap-2 rounded-3xl bg-white/10 px-4 py-3 text-sm text-slate-400">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 [animation-delay:300ms]" />
                </span>
                Thinking
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div
          ref={footerRef}
          className="fixed inset-x-0 z-30 bg-[#0a0a0a] pt-1 lg:relative lg:inset-x-auto lg:!bottom-auto lg:z-auto lg:shrink-0"
          style={{ bottom: composerBottom }}
        >
          <div className="relative">
            <div
              className={`overflow-hidden transition-[max-height] ${CHIP_EASE} ${
                showQuickActions ? 'max-h-14' : 'max-h-0'
              }`}
            >
              <div
                className={`assistant-chip-row flex snap-x snap-mandatory flex-nowrap gap-2 overflow-x-auto px-4 pb-2 transition-transform ${CHIP_EASE} ${
                  showQuickActions
                    ? 'translate-y-0'
                    : 'pointer-events-none translate-y-[110%]'
                }`}
              >
                {ASSISTANT_QUICK_CHIPS.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => handleQuickPrompt(action)}
                    disabled={loading}
                    className="snap-start shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-40"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative z-20 bg-[#0a0a0a] px-4 pb-1">
              <div className="flex items-center gap-3 rounded-3xl border border-white/20 bg-white/5 px-4 py-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={ASSISTANT_INPUT_PLACEHOLDER}
                  disabled={loading}
                  className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500 disabled:opacity-50"
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
              <MedicalDisclaimer compact className="mt-1.5 mb-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
