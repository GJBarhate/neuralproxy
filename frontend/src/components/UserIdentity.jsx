import React from 'react'
import { getAvatarInitials, getDisplayName, getSecondaryIdentity } from '../utils/userDisplay'

export default function UserIdentity({
  user,
  compact = false,
  subtitle,
  showSecondary = true,
  avatarSize = 'md',
  className = ''
}) {
  const initials = getAvatarInitials(user)
  const displayName = getDisplayName(user)
  const secondary = showSecondary ? getSecondaryIdentity(user) : null

  const avatarClass = avatarSize === 'lg'
    ? 'h-12 w-12 text-sm'
    : avatarSize === 'sm'
      ? 'h-9 w-9 text-xs'
      : 'h-11 w-11 text-sm'

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <div className={`flex ${avatarClass} flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 via-white to-slate-200 font-semibold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:from-slate-200 dark:via-white dark:to-slate-300 dark:text-slate-900`}>
        {initials}
      </div>
      <div className="min-w-0">
        <p className={`truncate font-semibold text-slate-950 dark:text-white ${compact ? 'text-sm' : 'text-[15px]'}`}>{displayName}</p>
        {subtitle ? <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        {!subtitle && secondary ? <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{secondary}</p> : null}
      </div>
    </div>
  )
}
