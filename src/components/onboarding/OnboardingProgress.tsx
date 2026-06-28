interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
  stepLabels?: string[]
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  stepLabels,
}: OnboardingProgressProps) {
  const percent = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className="px-6 pt-4 pb-2">
      <div className="mb-1.5 flex justify-between px-1 text-xs text-slate-400">
        <div>
          Step {currentStep} of {totalSteps}
        </div>
        <div>{percent}%</div>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {stepLabels && stepLabels.length > 0 && (
        <div className="mt-1 flex justify-between px-0.5 text-[10px] text-slate-500">
          {stepLabels.map((label, i) => (
            <div
              key={label}
              className={i + 1 === currentStep ? 'text-emerald-400' : ''}
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}