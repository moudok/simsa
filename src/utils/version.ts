export const APP_VERSION = '1.0.0'

export interface VersionCheckResult {
  compatible: boolean
  warning?: string
  error?: string
}

// Parse a semver string into [major, minor, patch]
function parseSemver(version: string): [number, number, number] | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/)
  if (!match) return null
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
}

// Check whether data from another version is compatible with this app
export function checkVersionCompatibility(receivedVersion: string | undefined): VersionCheckResult {
  if (!receivedVersion) {
    return {
      compatible: false,
      error: 'Format de données non reconnu ou trop ancien.',
    }
  }

  const received = parseSemver(receivedVersion)
  const current = parseSemver(APP_VERSION)

  if (!received || !current) {
    return {
      compatible: false,
      error: 'Format de données non reconnu ou trop ancien.',
    }
  }

  const [receivedMajor, receivedMinor] = received
  const [currentMajor] = current

  if (receivedMajor !== currentMajor) {
    return {
      compatible: false,
      error: `Format incompatible : données générées avec Simsa v${receivedMajor}.x, cette version est v${currentMajor}.x. Veuillez mettre à jour l'application.`,
    }
  }

  if (receivedMinor !== current[1]) {
    return {
      compatible: true,
      warning: `Ces données ont été générées avec une version différente de Simsa (v${receivedVersion} vs v${APP_VERSION}). En cas de problème, mettez à jour l'application.`,
    }
  }

  return { compatible: true }
}
