import {
  MessageSquarePlus,
  Pin,
  PinOff,
  Trash2,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ChatConversation } from '../../lib/chatService'

type HistoryTab = 'recent' | 'pinned'

interface ChatHistorySidebarProps {
  conversations: ChatConversation[]
  activeConversationId: string | null
  isDraft: boolean
  onSelect: (id: string) => void
  onNewChat: () => void
  onPin: (id: string, pinned: boolean) => void
  onDelete: (id: string) => void
  onClose?: () => void
  className?: string
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function ChatHistorySidebar({
  conversations,
  activeConversationId,
  isDraft,
  onSelect,
  onNewChat,
  onPin,
  onDelete,
  onClose,
  className = '',
}: ChatHistorySidebarProps) {
  const [tab, setTab] = useState<HistoryTab>('recent')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const pinned = useMemo(
    () => conversations.filter((c) => c.pinned),
    [conversations]
  )
  const recent = useMemo(
    () =>
      [...conversations].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt)
      ),
    [conversations]
  )

  const visible = tab === 'pinned' ? pinned : recent

  return (
    <aside
      className={`flex h-full w-72 shrink-0 flex-col border-r border-slate-800/80 bg-navy-900/60 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">Conversations</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-navy-800 hover:text-slate-200 lg:hidden"
            aria-label="Close history"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-2.5 text-sm font-medium text-teal-400 transition-colors hover:border-teal-500/50 hover:bg-teal-500/15"
        >
          <MessageSquarePlus size={16} />
          New chat
        </button>
      </div>

      <div className="flex gap-1 px-3 pb-2">
        {(['recent', 'pinned'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              tab === t
                ? 'bg-navy-800 text-teal-400'
                : 'text-slate-500 hover:bg-navy-800/60 hover:text-slate-300'
            }`}
          >
            {t === 'recent' ? 'Recent' : `Pinned${pinned.length ? ` (${pinned.length})` : ''}`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {isDraft && tab === 'recent' && (
          <div className="mb-1 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-2.5">
            <p className="truncate text-sm font-medium text-teal-400">
              New conversation
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">Draft</p>
          </div>
        )}

        {visible.length === 0 && !(isDraft && tab === 'recent') ? (
          <p className="px-3 py-6 text-center text-xs text-slate-500">
            {tab === 'pinned'
              ? 'Pin conversations to keep them here. Switch to Recent to see all chats.'
              : 'No conversations yet. Send a message or tap a suggestion to start one.'}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {visible.map((conv) => {
              const isActive =
                !isDraft && activeConversationId === conv.id
              const confirming = confirmDeleteId === conv.id

              return (
                <li key={conv.id}>
                  {confirming ? (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2">
                      <p className="text-xs text-slate-300">Delete this chat?</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(conv.id)
                            setConfirmDeleteId(null)
                          }}
                          className="rounded-md bg-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/30"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-md px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`group flex items-start gap-1 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-teal-500/10'
                          : 'hover:bg-navy-800/80'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(conv.id)}
                        className="min-w-0 flex-1 px-3 py-2.5 text-left"
                      >
                        <p
                          className={`truncate text-sm ${
                            isActive
                              ? 'font-medium text-teal-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {conv.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {formatRelativeTime(conv.updatedAt)}
                        </p>
                      </button>
                      <div className="flex shrink-0 items-center gap-0.5 pr-1.5 pt-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onPin(conv.id, !conv.pinned)
                          }}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-navy-700 hover:text-teal-400"
                          aria-label={conv.pinned ? 'Unpin' : 'Pin'}
                        >
                          {conv.pinned ? (
                            <PinOff size={14} />
                          ) : (
                            <Pin size={14} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmDeleteId(conv.id)
                          }}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-navy-700 hover:text-red-400"
                          aria-label="Delete conversation"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}