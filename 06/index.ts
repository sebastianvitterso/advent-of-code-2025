import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

function transposeArray<T>(array: T[][]): T[][] {
  return array[0]?.map((_, colIndex) => array.map((row) => row[colIndex])) as T[][]
}
const tokenLines = (await readFile(`${dirname}/input.txt`, 'utf-8'))
  .split('\n')
  .map((line) => line.split(/[ ]+/).filter(Boolean))

if (!tokenLines.every((line) => line.length === tokenLines[0]?.length)) {
  throw new Error('Inconsistent line lengths')
}

const problemColumns = transposeArray(tokenLines)

type Operator = '+' | '*'

type Problem = {
  operator: Operator
  numbers: number[]
}

const problems: Problem[] = problemColumns.map((col) => {
  const numbers = col.slice(0, -1).map((numStr) => parseInt(numStr, 10))
  const operator = col.at(-1) as Operator
  return { numbers, operator }
})

function evaluateProblem(problem: Problem): number {
  return problem.numbers.reduce(
    (acc, num) => (problem.operator === '*' ? acc * num : acc + num),
    problem.operator === '*' ? 1 : 0,
  )
}

const results = problems.map(evaluateProblem)

const resultSum = results.reduce((acc, res) => acc + res, 0)

console.log('Result Sum:', resultSum)

// Part 2:

const inputGrid = (await readFile(`${dirname}/input.txt`, 'utf-8')).split('\n').map((line) => line.split(''))

const blocks: Block[] = []
const lineLength = inputGrid[0]?.length ?? 0
const blockHeight = inputGrid.length

class Block {
  grid: string[][]

  constructor(blockHeight: number) {
    this.grid = Array.from({ length: blockHeight }, () => [])
  }

  isEmpty(): boolean {
    return this.grid.every((line) => line.length === 0)
  }

  addColumn(columnValues: string[]) {
    for (const [idx, value] of columnValues.entries()) {
      this.grid[idx]?.push(value)
    }
  }
}

let workingBlock: Block = new Block(blockHeight)

for (let col = 0; col < lineLength; col++) {
  const columnValues = inputGrid.map((row) => row[col]) as string[]
  if (columnValues.some((val) => val === undefined)) throw new Error('Inconsistent row lengths')
  if (columnValues.every((val) => val === ' ')) {
    if (!workingBlock.isEmpty()) {
      blocks.push(workingBlock)
      workingBlock = new Block(blockHeight)
    }
    continue
  }

  workingBlock.addColumn(columnValues)
}

if (!workingBlock.isEmpty()) blocks.push(workingBlock)

console.log('Number of blocks identified:', blocks.length)

class CephProblem {
  constructor(
    public numbers: number[],
    public operator: Operator,
  ) {}

  static fromBlock(block: Block): CephProblem {
    const numbers: number[] = []
    const gridWidth = block.grid[0]?.length ?? 0
    for (let col = 0; col < gridWidth; col++) {
      const numStr = block.grid
        .slice(0, -1)
        .map((row) => row[col])
        .join('')
        .trim()
      const number = parseInt(numStr, 10)
      if (Number.isNaN(number)) throw new Error('Invalid number in block')
      numbers.push(number)
    }
    const operatorChar = block.grid.at(-1)?.join('').trim()
    if (operatorChar !== '+' && operatorChar !== '*') throw new Error('Invalid operator in block')
    return new CephProblem(numbers, operatorChar)
  }

  evaluate(): number {
    return this.numbers.reduce(
      (acc, num) => (this.operator === '*' ? acc * num : acc + num),
      this.operator === '*' ? 1 : 0,
    )
  }
}

const cephProblems = blocks.map(CephProblem.fromBlock)
const cephResults = cephProblems.map((problem) => problem.evaluate())
const cephResultSum = cephResults.reduce((acc, res) => acc + res, 0)

console.log('Ceph Result Sum:', cephResultSum)
