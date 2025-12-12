import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import util from 'node:util'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const input = (await readFile(`${dirname}/input.txt`, 'utf-8')).split('\n')

class Shape {
  constructor(public drawing: string[]) {}

  // Basiccally a toString for util.inspect, used in console.log
  public [util.inspect.custom] = () => `Shape {\n  ${this.drawing.join('\n  ')}\n}`

  getAllRotationsAndFlips(): Shape[] {
    const results: Shape[] = [new Shape([...this.drawing])]

    let currentShape: Shape = this
    for (let i = 0; i < 3; i++) {
      currentShape = currentShape.rotate90()
      if (!results.some((s) => Shape.isEqual(s, currentShape))) results.push(currentShape)
      const flipped = currentShape.flipHorizontal()
      if (!results.some((s) => Shape.isEqual(s, flipped))) results.push(flipped)
    }

    return results
  }

  rotate90(): Shape {
    const height = this.drawing.length
    const width = this.drawing[0]?.length ?? 0
    const newDrawing: string[] = []
    for (let x = 0; x < width; x++) {
      let newRow = ''
      for (let y = height - 1; y >= 0; y--) {
        newRow += this.drawing[y]?.[x] ?? '.'
      }
      newDrawing.push(newRow)
    }
    return new Shape(newDrawing)
  }

  flipHorizontal(): Shape {
    return new Shape(this.drawing.map((row) => row.split('').reverse().join('')))
  }

  static isEqual(drawingA: Shape, drawingB: Shape): boolean {
    return drawingA.drawing.join('\n') === drawingB.drawing.join('\n')
  }
}

const presentShapes: Shape[] = []
let currentShapeDrawing: string[] = []
for (const line of input) {
  // End of shapes section
  if (line.includes('x')) break

  if (line.trim() === '') {
    if (currentShapeDrawing.length > 0) {
      presentShapes.push(new Shape(currentShapeDrawing))
      currentShapeDrawing = []
    }
    continue
  }
  // if the line looks like "12:"
  if (/^\d+:$/.test(line.trim())) continue

  currentShapeDrawing.push(line)
}

for (const [index, shape] of presentShapes.entries()) {
  console.log(`Flippified and rotated shapes of shape ${index}:`, shape.getAllRotationsAndFlips())
}

class AreaDescription {
  constructor(
    public areaDrawing: string[][],
    public presentShapeCounts: [number, number, number, number, number, number],
  ) {}

  static fromInputLine(line: string): AreaDescription {
    const [sizePart, countsPart] = line.split(': ')
    if (!sizePart || !countsPart) throw new Error(`Invalid area line: ${line}`)
    const [widthStr, heightStr] = sizePart.split('x')
    if (!widthStr || !heightStr) throw new Error(`Invalid size part: ${sizePart}`)
    const width = parseInt(widthStr, 10)
    const height = parseInt(heightStr, 10)
    const areaDrawing: string[][] = Array(height)
      .fill(null)
      .map(() => Array(width).fill('.'))

    const counts = countsPart
      .trim()
      .split(' ')
      .map((s) => parseInt(s, 10)) as [number, number, number, number, number, number]
    if (counts.length !== 6) throw new Error(`Invalid counts part: ${countsPart}`)
    if (counts.some(Number.isNaN)) throw new Error(`Invalid counts in part: ${countsPart}`)

    return new AreaDescription(areaDrawing, counts)
  }

  clone(): AreaDescription {
    const areaDrawingClone = this.areaDrawing.map((row) => [...row])
    const countsClone = [...this.presentShapeCounts]
    return new AreaDescription(areaDrawingClone, countsClone as [number, number, number, number, number, number])
  }

  place(shape: Shape, shapeIndex: number, posX: number, posY: number): void {
    if (!this.shapeFitsAt(shape, posX, posY)) throw new Error(`Shape does not fit at position (${posX}, ${posY})`)

    for (let y = 0; y < shape.drawing.length; y++) {
      for (let x = 0; x < (shape.drawing[0]?.length ?? 0); x++) {
        if (shape.drawing[y]?.[x] === '#') {
          const line = this.areaDrawing[posY + y]
          if (!line) throw new Error(`Area drawing line ${posY + y} out of bounds`)
          line[posX + x] = '#'
        }
      }
    }
    this.presentShapeCounts[shapeIndex] = (this.presentShapeCounts[shapeIndex] ?? 0) - 1
  }

  canFitAllPresentsWithoutPacking(): boolean {
    // If there's any filled cell in the area, we've already started packing, so this check is invalid
    if (this.areaDrawing.some((row) => row.some((cell) => cell === '#'))) return false

    const flooredWidth = 3 * Math.floor((this.areaDrawing[0]?.length ?? 0) / 3)
    const flooredHeight = 3 * Math.floor(this.areaDrawing.length / 3)
    const flooredArea = flooredWidth * flooredHeight
    const totalPresentCount = this.presentShapeCounts.reduce((a, b) => a + b, 0)
    // Each present shape covers exactly 3x3 units of area
    const totalPresentArea = totalPresentCount * 9
    console.log({ flooredWidth, flooredHeight, flooredArea, totalPresentCount, totalPresentArea })
    return totalPresentArea <= flooredArea
  }

  /** Attempts to fill the area recursively. Returns true if successful, false otherwise. */
  canFitAllPresents(): boolean {
    if (this.canFitAllPresentsWithoutPacking()) return true
    if (this.presentShapeCounts.every((count) => count === 0)) return true

    for (const { x, y } of this.openPositions()) {
      for (let shapeIndex = 0; shapeIndex < presentShapes.length; shapeIndex++) {
        if ((this.presentShapeCounts[shapeIndex] ?? 0) <= 0) continue // No more shapes of this type left

        const shape = presentShapes[shapeIndex]
        if (!shape) throw new Error(`Shape index ${shapeIndex} out of bounds`)

        for (const shapeVariant of shape.getAllRotationsAndFlips()) {
          if (this.shapeFitsAt(shapeVariant, x, y)) {
            const areaClone = this.clone()
            areaClone.place(shapeVariant, shapeIndex, x, y)
            if (areaClone.canFitAllPresents()) {
              return true
            }
          }
        }
      }
    }

    return false
  }

  openPositions(): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = []
    for (let y = 0; y < this.areaDrawing.length; y++) {
      for (let x = 0; x < (this.areaDrawing[0]?.length ?? 0); x++) {
        if (this.areaDrawing[y]?.[x] === '.') {
          positions.push({ x, y })
        }
      }
    }
    return positions
  }

  /** "fits at" doesn't make sense on its own, so the posX posY coordinates refer to the
   * "upper left corner" of the shape, and then we try to place the entire shape */
  shapeFitsAt(shape: Shape, posX: number, posY: number): boolean {
    for (let y = 0; y < shape.drawing.length; y++) {
      for (let x = 0; x < (shape.drawing[0]?.length ?? 0); x++) {
        const areaX = posX + x
        const areaY = posY + y
        if (shape.drawing[y]?.[x] === '#') {
          // Check bounds
          if (areaY >= this.areaDrawing.length || areaX >= (this.areaDrawing[0]?.length ?? 0)) {
            return false
          }
          // Check if the area is already filled
          if (this.areaDrawing[areaY]?.[areaX] !== '.') {
            return false
          }
        }
      }
    }
    return true
  }
}

const areas = input.filter((line) => line.includes('x') && line.includes(':')).map(AreaDescription.fromInputLine)

// Does not even work with test input, as it just freezes from the computational overload. Not even gonna try with real input.
console.log(
  'Can the areas be completely filled?',
  areas.map((area) => area.clone().canFitAllPresents()),
)
