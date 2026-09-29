// Component-free value order, safe for the server to import.
export const valueIds = ['integrity', 'collaborative', 'accountability', 'growth-mindset', 'customer-focus'] as const

export type ValueId = (typeof valueIds)[number]
