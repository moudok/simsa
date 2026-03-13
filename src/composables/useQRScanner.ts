import { ref } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'

export function useQRScanner() {
  const scanning = ref(false)
  let scanner: Html5Qrcode | null = null

  async function start(elementId: string, onSuccess: (text: string) => void) {
    if (scanning.value) return

    scanner = new Html5Qrcode(elementId)
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => onSuccess(decodedText),
      () => {},
    )
    scanning.value = true
  }

  async function stop() {
    if (scanner && scanning.value) {
      try {
        await scanner.stop()
      } catch {
        // Ignore cleanup errors
      }
      scanning.value = false
      scanner = null
    }
  }

  return { scanning, start, stop }
}
