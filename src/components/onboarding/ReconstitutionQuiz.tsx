import { useState } from 'react'
import {
  RECONSTITUTION_QUIZ_SCORED,
  type QuizQuestion,
} from '../../constants/reconstitutionQuiz'

const CHOICE_CLASS = (selected: boolean, showResult: boolean, correct: boolean) => {
  if (!showResult) {
    return `w-full rounded-2xl border p-4 text-left text-sm transition-all ${
      selected
        ? 'border-emerald-500 bg-emerald-500/10'
        : 'border-white/10 hover:border-white/30'
    }`
  }
  if (correct) return 'w-full rounded-2xl border border-emerald-500 bg-emerald-500/10 p-4 text-left text-sm'
  if (selected && !correct)
    return 'w-full rounded-2xl border border-red-500/50 bg-red-500/10 p-4 text-left text-sm'
  return 'w-full rounded-2xl border border-white/10 p-4 text-left text-sm opacity-60'
}

interface ReconstitutionQuizProps {
  onComplete: () => void
}

export function ReconstitutionQuiz({ onComplete }: ReconstitutionQuizProps) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const question: QuizQuestion = RECONSTITUTION_QUIZ_SCORED[index]
  const isLast = index === RECONSTITUTION_QUIZ_SCORED.length - 1

  const allCorrect = () =>
    RECONSTITUTION_QUIZ_SCORED.every(
      (q) => answers[q.id] === q.correctOptionId
    )

  const handleCheck = () => {
    if (!selected) return
    setAnswers((prev) => ({ ...prev, [question.id]: selected }))
    setShowResult(true)
  }

  const handleNext = () => {
    if (!showResult) return
    if (isLast) {
      const finalAnswers = { ...answers, [question.id]: selected! }
      const passed = RECONSTITUTION_QUIZ_SCORED.every(
        (q) => finalAnswers[q.id] === q.correctOptionId
      )
      if (passed) {
        onComplete()
      } else {
        setAnswers({})
        setIndex(0)
        setSelected(null)
        setShowResult(false)
      }
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
    setShowResult(false)
  }

  return (
    <div>
      <h2 className="mb-2 text-2xl font-semibold">Quick reconstitution quiz</h2>
      <p className="mb-6 text-sm text-slate-400">
        Learn the standard BAC water volumes for 5mg, 10mg, and 15mg vials using a
        U-100 insulin syringe.
      </p>

      <p className="mb-1 text-xs text-emerald-400/80">
        Question {index + 1} of {RECONSTITUTION_QUIZ_SCORED.length}
      </p>
      <p className="mb-4 text-base leading-relaxed">{question.prompt}</p>

      <div className="space-y-3">
        {question.options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={showResult}
            onClick={() => setSelected(opt.id)}
            className={CHOICE_CLASS(
              selected === opt.id,
              showResult,
              opt.id === question.correctOptionId
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {showResult && (
        <p
          className={`mt-4 text-sm ${
            selected === question.correctOptionId
              ? 'text-emerald-400'
              : 'text-amber-400'
          }`}
        >
          {selected === question.correctOptionId
            ? 'Correct!'
            : 'Not quite.'}{' '}
          {question.explanation}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        {!showResult ? (
          <button
            type="button"
            onClick={handleCheck}
            disabled={!selected}
            className="flex-1 rounded-2xl bg-emerald-500 py-3.5 font-medium text-black disabled:opacity-40"
          >
            Check answer
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 rounded-2xl bg-emerald-500 py-3.5 font-medium text-black"
          >
            {isLast
              ? allCorrect() && selected === question.correctOptionId
                ? 'Continue'
                : 'Retry quiz'
              : 'Next question'}
          </button>
        )}
      </div>
    </div>
  )
}