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
