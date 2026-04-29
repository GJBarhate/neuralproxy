export function getDisplayName(user) {
  const rawName = user?.name || user?.displayName || user?.username || user?.email || 'Workspace user'
  const trimmed = String(rawName).trim()

  if (!trimmed) return 'Workspace user'
  if (trimmed.includes('@')) {
    const localPart = trimmed.split('@')[0] || 'user'
    return localPart
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (match) => match.toUpperCase())
  }

  return trimmed
}

export function getSecondaryIdentity(user) {
  if (user?.email) return user.email
  if (user?.username) return user.username
  return 'No email connected'
}

export function getAvatarInitials(user) {
  const displayName = getDisplayName(user)
  const words = displayName.split(/\s+/).filter(Boolean)

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }

  return displayName.slice(0, 2).toUpperCase()
}
