export function OnboardingGeneratingScreen() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="relative mb-8 h-16 w-16">
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
        <div className="absolute inset-2 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <div className="absolute inset-0 flex items-center justify-center text-lg">
          ✦
        </div>
      </div>
      <h2 className="mb-3 max-w-sm text-2xl font-semibold leading-snug">
        Building your custom protocol…
      </h2>
      <p className="max-w-xs text-sm leading-relaxed text-slate-400">
        Our AI is gathering your information to optimize your peptide 90-day
        protocol tracker — custom and tailored to you!
      </p>
    </div>
  )
}