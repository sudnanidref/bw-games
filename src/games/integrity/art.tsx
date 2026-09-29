import type { CSSProperties } from 'react'

interface ArtProps {
  className?: string
  style?: CSSProperties
}

export function EdcLauncher({ className, style }: ArtProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 64 88" aria-hidden="true" focusable="false">
      <rect x="6" y="14" width="52" height="70" rx="6" fill="var(--ink)" />
      <rect x="10" y="4" width="44" height="12" rx="3" fill="var(--line)" stroke="var(--ink)" strokeWidth="2" />
      <rect x="12" y="22" width="40" height="18" rx="2" fill="var(--paper)" />
      <path d="M17 31h12M17 35h8" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
      <g fill="var(--integrity)">
        <rect x="12" y="47" width="10" height="8" rx="1.5" />
        <rect x="27" y="47" width="10" height="8" rx="1.5" />
        <rect x="42" y="47" width="10" height="8" rx="1.5" />
        <rect x="12" y="59" width="10" height="8" rx="1.5" />
        <rect x="27" y="59" width="10" height="8" rx="1.5" />
        <rect x="42" y="59" width="10" height="8" rx="1.5" />
      </g>
      <rect x="12" y="71" width="40" height="8" rx="1.5" fill="var(--paper)" opacity="0.85" />
    </svg>
  )
}

export function CardProjectile({ className, style }: ArtProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 32 48" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="28" height="44" rx="4" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
      <rect x="2" y="10" width="28" height="7" fill="var(--ink)" />
      <rect x="7" y="23" width="9" height="7" rx="1.5" fill="var(--integrity)" stroke="var(--ink)" strokeWidth="1" />
      <path d="M7 38h18" stroke="var(--line)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function CheckIcon({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M2.5 8.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CrossIcon({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function SpeakerIcon({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M3 8h3l4-3.5v11L6 12H3z" fill="currentColor" />
      <path d="M13 7.5a4 4 0 010 5M15.5 5a7.5 7.5 0 010 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function SpeakerOffIcon({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M3 8h3l4-3.5v11L6 12H3z" fill="currentColor" />
      <path d="M13.5 7.5l5 5M18.5 7.5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
