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

// --- spec/final_confirmation_test_data.json (最終確認試験用データ一覧) ---
const FINAL_TEST_DATA_PATH = resolve(import.meta.dirname, '../../../spec/final_confirmation_test_data.json')

export interface FinalTestSlot {
  送信番号: string
  到達番号: string
}

export interface FinalTestEntry {
  format: 'standard' | 'individual'
  proc_id: string
  proc_name: string
  data_state: string
  status: string
  remarks: string
  slots: Record<string, FinalTestSlot>
  updatedAt?: string
}

export interface FinalTestPick {
  proc_id: string
  arrive_id: string
  send_number: string
  entry: FinalTestEntry
}

export function loadFinalTestData(): FinalTestEntry[] | undefined {
  if (!existsSync(FINAL_TEST_DATA_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(FINAL_TEST_DATA_PATH, 'utf-8')) as FinalTestEntry[]
  } catch { return undefined }
}

/** data_state が pattern にマッチする最初の entry から、埋まっている slot を 1 件返す */
export function findFinalTestByDataState(
  pattern: RegExp,
  format: 'standard' | 'individual' = 'standard',
): FinalTestPick | undefined {
  const data = loadFinalTestData()
  if (!data) return undefined
  for (const entry of data) {
    if (entry.format !== format) continue
    if (!pattern.test(entry.data_state)) continue
    for (const slot of Object.values(entry.slots)) {
      if (slot.到達番号 && slot.到達番号.trim() !== '') {
        return { proc_id: entry.proc_id, arrive_id: slot.到達番号, send_number: slot.送信番号, entry }
      }
    }
  }
  return undefined
}

export function hasFinalTestData(
  pattern: RegExp,
  format: 'standard' | 'individual' = 'standard',
): boolean {
  return findFinalTestByDataState(pattern, format) !== undefined
}
