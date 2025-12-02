import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

type Range = [number, number]

const input = (await readFile(`${dirname}/input.txt`, 'utf-8'))
  .split(',')
  .map((range) => range.split('-').map(Number) as Range)

function allEqual(strings: string[]): boolean {
  return strings.length > 0 && strings.every((str) => str === strings[0])
}

function splitStringIntoSegments(str: string, segmentCount: number): string[] {
  const segmentLength = str.length / segmentCount
  const segments: string[] = []
  for (let i = 0; i < segmentCount; i++) {
    segments.push(str.slice(i * segmentLength, (i + 1) * segmentLength))
  }
  return segments
}

function advancedInvalid(id: number): boolean {
  const idString = String(id)
  for (let segmentCount = 2; segmentCount <= idString.length; segmentCount++) {
    if (idString.length % segmentCount !== 0) continue
    const segments = splitStringIntoSegments(idString, segmentCount)
    if (allEqual(segments)) return true
  }
  return false
}

function getAdvancedInvalidIdsFromRange(range: Range): number[] {
  const [start, end] = range
  const invalidIds: number[] = []
  for (let id = start; id <= end; id++) {
    if (advancedInvalid(id)) invalidIds.push(id)
  }
  return invalidIds
}

function basicInvalid(id: number): boolean {
  const idString = String(id)
  if (idString.length % 2 !== 0) false
  const halves = splitStringIntoSegments(idString, 2)
  return allEqual(halves)
}

/** Basic invalidity is only for identical halves, not further repetition (like 121212 which is repeated thrice). */
function getBasicInvalidIdsFromRange(range: Range): number[] {
  const [start, end] = range
  const invalidIds: number[] = []
  for (let id = start; id <= end; id++) {
    if (basicInvalid(id)) invalidIds.push(id)
  }
  return invalidIds
}

let sumOfBasicInvalidIdValues = 0
let sumOfAdvancedInvalidIdValues = 0
for (const range of input) {
  const basicInvalidIds = getBasicInvalidIdsFromRange(range)
  const advancedInvalidIds = getAdvancedInvalidIdsFromRange(range)
  for (const id of basicInvalidIds) {
    sumOfBasicInvalidIdValues += id
  }
  for (const id of advancedInvalidIds) {
    sumOfAdvancedInvalidIdValues += id
  }
}

console.log('Total invalid IDs in ranges:', sumOfBasicInvalidIdValues)
console.log('Total advanced invalid IDs in ranges:', sumOfAdvancedInvalidIdValues)
