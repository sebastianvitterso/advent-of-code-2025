import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const input = (await readFile(`${dirname}/input.txt`, 'utf-8')).split('\n')

type Tile = '.' | '@'

class MapGrid {
  constructor(public grid: Tile[][]) {}

  isPaperRoll(x: number, y: number): boolean {
    return this.grid[y]?.[x] === '@'
  }

  isAvailablePaperRoll(x: number, y: number): boolean {
    if (!this.isPaperRoll(x, y)) return false
    // the eight neighbors:
    const neighbors = [
      [x - 1, y - 1],
      [x, y - 1],
      [x + 1, y - 1],

      [x - 1, y],
      [x + 1, y],

      [x - 1, y + 1],
      [x, y + 1],
      [x + 1, y + 1],
    ] as [number, number][]
    const paperRollNeighbors = neighbors.filter(([nx, ny]) => this.isPaperRoll(nx, ny))
    return paperRollNeighbors.length < 4
  }

  countAvailablePaperRolls(): number {
    let count = 0
    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < (this.grid[y]?.length ?? 0); x++) {
        if (this.isAvailablePaperRoll(x, y)) count++
      }
    }
    return count
  }

  removeAvailablePaperRolls(): MapGrid {
    const newGrid = this.grid.map((row, y) => row.map((tile, x) => (this.isAvailablePaperRoll(x, y) ? '.' : tile)))
    return new MapGrid(newGrid)
  }
}

const map = new MapGrid(input.map((line) => line.split('') as Tile[]))
const availablePaperRollCount = map.countAvailablePaperRolls()
console.log(availablePaperRollCount)

let previousCount = Number.POSITIVE_INFINITY
let removedRollsCount = 0
let currentMap = map
while (currentMap.countAvailablePaperRolls() > 0) {
  previousCount = currentMap.countAvailablePaperRolls()
  removedRollsCount += previousCount
  currentMap = currentMap.removeAvailablePaperRolls()
}
console.log(removedRollsCount)
