import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const STATE_PATH = resolve(import.meta.dirname, '../../../coverage/.test-state.json')

function readState(): Record<string, unknown> {
  if (!existsSync(STATE_PATH)) return {}
  return JSON.parse(readFileSync(STATE_PATH, 'utf-8'))
}

function writeState(state: Record<string, unknown>): void {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2))
}

export function saveState(key: string, value: unknown): void {
  const state = readState()
  state[key] = value
  writeState(state)
}

export function loadState<T = string>(key: string): T | undefined {
  const state = readState()
  return state[key] as T | undefined
}

export function resetState(): void {
  writeState({})
}

// --- collect-arrive-ids.ts の出力を読む ---
const COLLECTED_PATH = resolve(import.meta.dirname, '../../../coverage/.collect-arrive-ids.json')

interface CollectedSubmission {
  proc_id: string
  arrive_id: string
  purpose: string
}

interface CollectedData {
  submissions: Record<string, CollectedSubmission>
  dry?: boolean
}

/** collect-arrive-ids.ts の出力があるか */
export function hasCollectedData(): boolean {
  if (!existsSync(COLLECTED_PATH)) return false
  try {
    const data: CollectedData = JSON.parse(readFileSync(COLLECTED_PATH, 'utf-8'))
    if (data.dry) return false
    return Object.values(data.submissions).some(s => s.arrive_id && s.arrive_id !== '(dry-run)')
  } catch { return false }
}

/** collect-arrive-ids.ts の出力を読む */
export function loadCollectedData(): CollectedData | undefined {
  if (!existsSync(COLLECTED_PATH)) return undefined
  try {
    const data: CollectedData = JSON.parse(readFileSync(COLLECTED_PATH, 'utf-8'))
    if (data.dry) return undefined
    return data
  } catch { return undefined }
}
