export function Loading({ label = 'Загружаем данные…' }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-muted" role="status">
      <span className="spinner" />
      {label}
    </div>
  )
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
      <p>{message}</p>
      {onRetry && <button className="mt-2 font-semibold underline" onClick={onRetry}>Попробовать снова</button>}
    </div>
  )
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-xl text-brand">↗</div>
      <h3 className="font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-muted">{text}</p>
    </div>
  )
}
