"use client"
import { ExternalLink } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import type { EventLogItem } from "@/lib/types"

interface Props { items: EventLogItem[] }

function deriveImage(url: string): string | null {
	try {
		const u = new URL(url)
		// Favicon approach (future: attempt OG image fetch server-side)
		return `https://www.google.com/s2/favicons?sz=128&domain=${u.hostname}`
	} catch { return null }
}

export function CompanyNewsGrid({ items }: Props) {
	const grid = items.slice(0, 6)
	return (
		<section aria-labelledby="company-news" className="glass sketch-border rounded-xl p-5 hover-glow">
			<header className="mb-5">
				<h2 id="company-news" className="font-mono text-[11px] tracking-wider text-amber-300/90 mb-1">LATEST COMPANY NEWS</h2>
				<p className="text-xs text-slate-400">Recent updates & announcements</p>
			</header>
			{grid.length === 0 && (
				<div className="text-center py-12 text-slate-500 text-sm">No recent company news detected.</div>
			)}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
				{grid.map((n, i) => {
					const img = deriveImage(n.url)
					return (
						<a
							key={i}
							href={n.url}
							target="_blank"
							rel="noopener noreferrer"
							className="group relative rounded-xl border border-amber-400/25 bg-slate-800/40 overflow-hidden flex flex-col hover:border-amber-300/60 transition-colors"
						>
							<div className="h-28 w-full bg-slate-700/40 flex items-center justify-center relative">
								{img ? (
									<img
										src={img}
										alt={n.headline}
										className="w-14 h-14 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
									/>
								) : (
									<div className="w-12 h-12 rounded bg-gradient-to-br from-amber-500/30 to-amber-700/30 flex items-center justify-center text-amber-300 text-sm font-medium">
										{(n.headline || 'N')[0]}
									</div>
								)}
								<div className="absolute inset-0 ring-1 ring-white/5 group-hover:ring-amber-300/30 transition" />
							</div>
							<div className="p-4 flex-1 flex flex-col">
								<h3 className="text-sm font-medium text-slate-100 line-clamp-2 group-hover:text-amber-300 transition-colors mb-2">
									{n.headline}
								</h3>
								<div className="mt-auto flex items-center justify-between text-[11px] text-slate-400">
									<span className="truncate max-w-[120px]">
										{new URL(n.url).hostname.replace(/^www\./, '')}
									</span>
									<span>{formatDistanceToNow(new Date(n.date), { addSuffix: true })}</span>
								</div>
								<ExternalLink className="w-4 h-4 absolute top-2 right-2 text-slate-500 group-hover:text-amber-300 transition" />
							</div>
						</a>
					)
				})}
			</div>
		</section>
	)
}
