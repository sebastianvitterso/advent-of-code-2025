import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

type Direction = 'L' | 'R'
function dirToSign(dir: Direction): -1 | 1 {
  return dir === 'L' ? -1 : 1
}

class Dial {
  public position: number = 50
  public landedOnZeroCount: number = 0
  public passedZeroCount: number = 0
  private readonly size: number = 100

  public rotate(steps: number) {
    // not sure what was wrong with the "landedOnZeroCount" logic in here, so implemented a brute-force version below, which works correctly
    let newPosition = this.position + steps
    if (newPosition < 0) {
      if (this.position === 0) {
        // if we start on zero and go left, we have to "uncount" that we passed zero once
        this.passedZeroCount--
      }
      while (newPosition < 0) {
        newPosition += this.size
        this.passedZeroCount++
      }
    } else if (newPosition >= this.size) {
      while (newPosition >= this.size) {
        newPosition -= this.size
        this.passedZeroCount++
      }
    } else if (newPosition === 0) {
      this.passedZeroCount++
    }

    if (newPosition === 0) {
      this.landedOnZeroCount++
    }
    this.position = newPosition
  }

  public rotateBruteForce(steps: number) {
    const direction = steps < 0 ? -1 : 1
    for (let i = 0; i < Math.abs(steps); i++) {
      this.position += direction
      if (this.position === -1) {
        this.position = this.size - 1
      } else if (this.position === this.size) {
        this.position = 0
      }
      if (this.position === 0) {
        this.passedZeroCount++
      }
    }
    if (this.position === 0) {
      this.landedOnZeroCount++
    }
  }
}

const input = (await readFile(`${dirname}/input.txt`, 'utf-8')).split('\n').map((line) => {
  const direction: Direction = line[0] as Direction
  return dirToSign(direction) * parseInt(line.slice(1), 10)
})

const dial = new Dial()
for (const steps of input) {
  dial.rotateBruteForce(steps)
  // dial.rotate(steps)
}

console.log(`Dial position: ${dial.position}`)
console.log(`Landed on zero ${dial.landedOnZeroCount} times`)
console.log(`Passed zero ${dial.passedZeroCount} times`)
