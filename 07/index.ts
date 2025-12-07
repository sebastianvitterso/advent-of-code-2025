import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

type InputTrackTile = 'S' | '.' | '^'
type NumericTrackTile = '^' | number
const input = (await readFile(`${dirname}/input.txt`, 'utf-8'))
  .split('\n')
  .map((line) => line.trim().split('')) as InputTrackTile[][]
if (!input.every((line) => line.length === input[0]?.length)) throw new Error('Input lines are not of equal length')
if (!input.every((line) => line.every((char) => ['S', '.', '^'].includes(char))))
  throw new Error('Invalid character in input')

function convertSymbolicToNumeric(grid: InputTrackTile): NumericTrackTile {
  switch (grid) {
    case 'S':
      return 1
    case '.':
      return 0
    case '^':
      return '^'
  }
}

class TachyonTrack {
  beamFired = false
  splitCount = 0

  constructor(public grid: NumericTrackTile[][]) {}

  static fromSymbolicGrid(symbolicGrid: InputTrackTile[][]): TachyonTrack {
    const numericGrid: NumericTrackTile[][] = symbolicGrid.map((line) => line.map(convertSymbolicToNumeric))
    return new TachyonTrack(numericGrid as NumericTrackTile[][])
  }

  fireBeam() {
    for (let y = 1; y < this.grid.length; y++) {
      const previousLine = this.grid[y - 1]
      const line = this.grid[y]
      if (!previousLine || !line) throw new Error('Broken state')
      for (let x = 0; x < line.length; x++) {
        const previousLineValue = previousLine[x]
        if (typeof previousLineValue === 'number' && (previousLineValue ?? 0) > 0) {
          if (typeof line[x] === 'number') {
            this.addBeam(x, y, previousLineValue)
          } else if (line[x] === '^') {
            this.splitCount++
            this.addBeam(x - 1, y, previousLineValue)
            this.addBeam(x + 1, y, previousLineValue)
          }
        }
      }
    }
    this.beamFired = true
  }

  addBeam(x: number, y: number, count = 1) {
    const line = this.grid[y]
    if (!line) throw new Error('Broken state')
    if (typeof line[x] === 'number') line[x] = line[x] + count
  }

  countAlternateTimelines(): number {
    if (!this.beamFired) throw new Error('Beam has not been fired yet')
    const lastLine = this.grid[this.grid.length - 1]
    if (!lastLine) throw new Error('Broken state')
    return lastLine.reduce<number>((sum, tile) => {
      if (typeof tile === 'number') return sum + tile
      return sum
    }, 0 as number)
  }
}

const track = TachyonTrack.fromSymbolicGrid(input)
track.fireBeam()
console.log(`Tachyon split count: ${track.splitCount}`)
const alternateTimelines = track.countAlternateTimelines()
console.log(`Alternate timelines count: ${alternateTimelines}`)
