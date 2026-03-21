interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 ${className}`}
    >
      {children}
    </div>
  )
}
