import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

class BatteryBank {
  constructor(public cells: number[]) {}

  getHighestJoltageUsingTwoBatteries(): number {
    let highest = 0
    for (const [idx, cell] of this.cells.entries()) {
      for (const otherCell of this.cells.slice(idx + 1)) {
        const combinedJoltage = Number(`${cell}${otherCell}`)
        if (combinedJoltage > highest) {
          highest = combinedJoltage
        }
      }
    }
    return highest
  }

  getHighestJoltageUsingSpecifiedBatteryCount(cellCount: number): number {
    const combination: number[] = []
    let previousUsedIndex = -1
    for (let i = 0; i < cellCount; i++) {
      const availableCellIndexRangeEnd = this.cells.length - cellCount + 1 + i
      const availableCells = this.cells.slice(previousUsedIndex + 1, availableCellIndexRangeEnd)
      const highestAvailableCell = Math.max(...availableCells)
      combination.push(highestAvailableCell)
      previousUsedIndex = this.cells.indexOf(highestAvailableCell, previousUsedIndex + 1)
    }
    return Number(combination.join(''))
  }
}

const input = (await readFile(`${dirname}/input.txt`, 'utf-8')).split('\n')
const batteryBanks = input.map((line) => new BatteryBank(line.split('').map(Number)))
const highestJoltagesWithTwo = batteryBanks.map((bank) => bank.getHighestJoltageUsingSpecifiedBatteryCount(2))
const joltageSumWithTwo = highestJoltagesWithTwo.reduce((acc, val) => acc + val, 0)
const highestJoltagesWithTwelve = batteryBanks.map((bank) => bank.getHighestJoltageUsingSpecifiedBatteryCount(12))
const joltageSumWithTwelve = highestJoltagesWithTwelve.reduce((acc, val) => acc + val, 0)

console.log('Sum of highest joltages with 2 batteries:', joltageSumWithTwo)
console.log('Sum of highest joltages with 12 batteries:', joltageSumWithTwelve)
