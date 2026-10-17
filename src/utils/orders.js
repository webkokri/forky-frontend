const DONE = ['DELIVERED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'REFUNDED', 'FAILED', 'EXPIRED']
export const isActiveOrder = (o) => !DONE.includes(o.status)
export const isCancelled = (o) => /CANCEL|REJECT|FAIL|EXPIRE/.test(o.status)
export const statusLabel = (o) => o.statusLabel || o.status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
export const statusTone = (status) => (/CANCEL|REJECT|FAIL|EXPIRE/.test(status) ? 'bg-rose-100 text-rose-700' : DONE.includes(status) ? 'bg-mint-500/15 text-mint-600' : 'bg-brand-100 text-brand-700')
export const when = (d) => new Date(d).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })
