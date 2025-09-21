export function ExoraLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8 4L24 4C26.2091 4 28 5.79086 28 8V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z"
          fill="currentColor"
          className="text-primary"
        />
        <path d="M12 12L20 12M12 16L20 16M12 20L16 20" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}
