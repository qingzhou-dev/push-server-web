export function compareVersions(v1: string, v2: string): number {
  const normalize = (v: string) => v.replace(/^v/, '')
  const parts1 = normalize(v1).split('.').map(Number)
  const parts2 = normalize(v2).split('.').map(Number)
  
  const len = Math.max(parts1.length, parts2.length)
  
  for (let i = 0; i < len; i++) {
    const val1 = parts1[i] || 0
    const val2 = parts2[i] || 0
    
    if (val1 > val2) return 1
    if (val1 < val2) return -1
  }
  
  return 0
}
