import { BaseSequencer } from 'vitest/node'
import type { TestSpecification } from 'vitest/node'

export default class AlphabeticalSequencer extends BaseSequencer {
  async sort(files: TestSpecification[]): Promise<TestSpecification[]> {
    return [...files].sort((a, b) => a.moduleId.localeCompare(b.moduleId))
  }
}
