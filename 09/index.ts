import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const input = (await readFile(`${dirname}/input.txt`, 'utf-8')).split('\n')

class Tile {
  constructor(
    public x: number,
    public y: number,
  ) {}

  static fromString(string: string) {
    const [x, y] = string.split(',').map(Number)
    if (x === undefined || y === undefined) throw new Error(`Invalid input line: ${string}`)
    return new Tile(x, y)
  }
}

class Rectangle {
  constructor(
    public cornerA: Tile,
    public cornerB: Tile,
  ) {}

  get area(): number {
    const width = Math.abs(this.cornerA.x - this.cornerB.x) + 1
    const height = Math.abs(this.cornerA.y - this.cornerB.y) + 1
    return width * height
  }
}

class Floor {
  constructor(public tiles: Tile[]) {}

  getLargestUnrestrictedRectangle(): Rectangle {
    let maxArea = 0
    let bestRectangle: Rectangle | null = null

    for (let i = 0; i < this.tiles.length; i++) {
      for (let j = i; j < this.tiles.length; j++) {
        const tileA = this.tiles[i]
        const tileB = this.tiles[j]
        if (tileA === undefined || tileB === undefined) throw new Error('Tile not found')
        const rectangle = new Rectangle(tileA, tileB)
        const area = rectangle.area
        if (area > maxArea) {
          maxArea = area
          bestRectangle = rectangle
        }
      }
    }

    if (bestRectangle === null) throw new Error('No rectangle found')
    return bestRectangle
  }
}

const floor = new Floor(input.map(Tile.fromString))
const largestRectangle = floor.getLargestUnrestrictedRectangle()

console.log('Largest Unrestricted Rectangle:')
console.log(`Corner A: (${largestRectangle.cornerA.x}, ${largestRectangle.cornerA.y})`)
console.log(`Corner B: (${largestRectangle.cornerB.x}, ${largestRectangle.cornerB.y})`)
console.log(`Area: ${largestRectangle.area} \n`)

// TODO: figure out a way to solve part 2
console.log('Part 2 not yet implemented.')
