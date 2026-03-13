import { openDB, type DBSchema } from 'idb'

interface SimsaDB extends DBSchema {
  config: {
    key: string
    value: unknown
  }
  session: {
    key: string
    value: unknown
  }
}

export function getDB() {
  return openDB<SimsaDB>('simsa', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config')
      }
      if (!db.objectStoreNames.contains('session')) {
        db.createObjectStore('session')
      }
    },
  })
}
