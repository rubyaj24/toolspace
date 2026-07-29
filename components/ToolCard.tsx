import { formatInr } from '@/lib/format'
import { ArrowRight, MapPin, Tag } from 'lucide-react'

type Tool = { id: string; name: string; description: string; category: string; price_per_day: number; location: string; image_url: string | null }

export function ToolCard({ tool }: { tool: Tool }) {
  return <a className="card" href={`/tools/${tool.id}`}><div className="tool-image">{tool.image_url ? <img src={tool.image_url} alt={tool.name} /> : <span className="tool-placeholder">🛠️</span>}</div><div className="card-body"><h3>{tool.name}</h3><div className="meta"><span><Tag size={14} /> {tool.category}</span><span><MapPin size={14} /> {tool.location}</span></div><div className="card-foot"><div className="price">{formatInr(tool.price_per_day)} / day</div><ArrowRight size={18} className="card-arrow" /></div></div></a>
}
