import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const [firstInput, secondInput] = (await readFile(`${dirname}/input.txt`, 'utf-8')).split('\n\n')
if (!firstInput || !secondInput) throw new Error('Invalid input')

class RangeSet {
  constructor(public ranges: IdRange[] = []) {}

  has(id: number): boolean {
    return this.ranges.some(({ start, end }) => id >= start && id <= end)
  }

  overlapFreeRangeSet(): RangeSet {
    const mergedRanges: IdRange[] = []
    for (const originalRange of this.ranges) {
      let range = originalRange
      while (mergedRanges.some((mergedRange) => range.overlaps(mergedRange))) {
        const overlappingRangeIndex = mergedRanges.findIndex((mergedRange) => range.overlaps(mergedRange))
        if (overlappingRangeIndex === -1) break

        const overlappingRange = mergedRanges.splice(overlappingRangeIndex, 1)[0]
        if (overlappingRange === undefined) {
          throw new Error("Don't make no sense")
        }

        range = range.union(overlappingRange)
      }
      mergedRanges.push(range)
    }
    return new RangeSet(mergedRanges.toSorted((a, b) => a.start - b.start))
  }
}

class IdRange {
  constructor(
    public start: number,
    public end: number,
  ) {}

  contains(id: number): boolean {
    return id >= this.start && id <= this.end
  }

  overlaps(other: IdRange): boolean {
    return (
      this.contains(other.start) || this.contains(other.end) || other.contains(this.start) || other.contains(this.end)
    )
  }

  union(other: IdRange): IdRange {
    if (!this.overlaps(other)) {
      throw new Error("Don't make no sense")
    }
    return new IdRange(Math.min(this.start, other.start), Math.max(this.end, other.end))
  }

  get length(): number {
    return this.end - this.start + 1
  }
}

const freshIdRanges = firstInput
  .split('\n')
  .map((line): IdRange => {
    const [start, end] = line.split('-').map(Number)
    if (start === undefined || end === undefined) throw new Error('Invalid input')
    return new IdRange(start, end)
  })
  .toSorted((a, b) => a.start - b.start)

const availableIds = secondInput.split('\n').map(Number)
const rangeSet = new RangeSet(freshIdRanges)
let freshCount = 0
for (const id of availableIds) {
  if (rangeSet.has(id)) {
    freshCount++
  }
}
console.log(`Original range set length: ${rangeSet.ranges.length}`)

console.log(freshCount)

const overlapFreeRangeSet = rangeSet.overlapFreeRangeSet()
const totalIdCountInRangeSet = overlapFreeRangeSet.ranges
  .map((range) => range.length)
  .reduce((acc, val) => acc + val, 0)
console.log(`Overlap free range set length: ${overlapFreeRangeSet.ranges.length}`)

console.log(overlapFreeRangeSet)
console.log(totalIdCountInRangeSet)

for (const [idx, range] of overlapFreeRangeSet.ranges.entries()) {
  const previousRange = overlapFreeRangeSet.ranges[idx - 1]
  if (previousRange) {
    console.log(`Gap between ${previousRange.end} and ${range.start}: ${range.start - previousRange.end - 1}`)
  }
}
