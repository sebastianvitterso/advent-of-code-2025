import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const input = (await readFile(`${dirname}/input.txt`, 'utf-8')).split('\n')

class Machine {
  /** A number of lights, with a boolean describing whether each light is on or off, all initially off */
  lights: boolean[]
  /** The target pattern of lights to achieve, also described by booleans for on or off */
  targetLightPattern: boolean[]
  /** A number of buttons, each represented by a list of indices of the lights that it toggles, and joltageCounters it increments */
  buttons: number[][]
  /** The joltage counters, all initially zero */
  joltageCounters: number[]
  /** The joltage requirements */
  joltageRequirements: number[]

  constructor(manualDescription: string) {
    const closingBracketIndex = manualDescription.indexOf(']')
    const openingBraceIndex = manualDescription.indexOf('{')
    this.targetLightPattern = manualDescription
      .slice(1, closingBracketIndex)
      .split('')
      .map((char) => char === '#')
    this.lights = this.targetLightPattern.map(() => false)

    this.buttons = manualDescription
      .slice(closingBracketIndex + 3, openingBraceIndex - 2)
      .split(') (')
      .map((buttonDescription) => buttonDescription.split(',').map((index) => parseInt(index, 10)))

    this.joltageRequirements = manualDescription
      .slice(openingBraceIndex + 1, -1)
      .split(',')
      .map((joltage) => parseInt(joltage, 10))
    this.joltageCounters = this.joltageRequirements.map(() => 0)
  }

  clone(): Machine {
    const newMachine = new Machine('[] () {}')
    newMachine.lights = [...this.lights]
    newMachine.targetLightPattern = [...this.targetLightPattern]
    newMachine.buttons = this.buttons.map((button) => [...button])
    newMachine.joltageRequirements = [...this.joltageRequirements]
    return newMachine
  }

  simulateButtonPress(buttonIndex: number): Machine {
    const machineClone = this.clone()
    const button = machineClone.buttons[buttonIndex]
    if (button === undefined) throw new Error(`Button with index ${buttonIndex} is undefined`)
    for (const index of button) {
      machineClone.lights[index] = !machineClone.lights[index]
      machineClone.joltageCounters[index] = (machineClone.joltageCounters[index] ?? 0) + 1
    }
    return machineClone
  }
}

type QueueEntry = {
  machine: Machine
  buttonIndexSequence: number[]
}

/** A bfs search to find the shortest sequence of button presses to achieve the target light pattern */
function bfsToSolveLights(machine: Machine): number[] {
  const queue: QueueEntry[] = [{ machine, buttonIndexSequence: [] }]

  while (queue.length > 0) {
    const currentEntry = queue.shift()
    if (currentEntry === undefined) throw new Error('Queue entry is undefined, which should be impossible here')

    for (let buttonIndex = 0; buttonIndex < currentEntry.machine.buttons.length; buttonIndex++) {
      // avoid pressing the same button twice, which would be simply undo the previous press
      if (currentEntry.buttonIndexSequence.includes(buttonIndex)) continue
      const newMachine = currentEntry.machine.simulateButtonPress(buttonIndex)
      const newButtonIndexSequence = [...currentEntry.buttonIndexSequence, buttonIndex]
      const isSolved = newMachine.lights.every((light, index) => light === newMachine.targetLightPattern[index])
      queue.push({ machine: newMachine, buttonIndexSequence: newButtonIndexSequence })

      // our escape condition:
      if (isSolved) {
        return newButtonIndexSequence
      }
    }
  }
  throw new Error('No solution found')
}

function bfsToSolveJoltage(machine: Machine): number[] {
  const queue: QueueEntry[] = [{ machine, buttonIndexSequence: [] }]

  while (queue.length > 0) {
    const currentEntry = queue.shift()
    if (currentEntry === undefined) throw new Error('Queue entry is undefined, which should be impossible here')

    if (
      currentEntry.machine.joltageCounters.some((count, index) => {
        const joltageRequirement = currentEntry.machine.joltageRequirements[index] ?? 0
        return count > joltageRequirement
      })
    ) {
      // prune this branch, as we've exceeded the joltage requirement for at least one counter
      continue
    }
    for (let buttonIndex = 0; buttonIndex < currentEntry.machine.buttons.length; buttonIndex++) {
      const newMachine = currentEntry.machine.simulateButtonPress(buttonIndex)
      const newButtonIndexSequence = [...currentEntry.buttonIndexSequence, buttonIndex]
      const isSolved = newMachine.joltageCounters.every(
        (count, index) => count === newMachine.joltageRequirements[index],
      )
      queue.push({ machine: newMachine, buttonIndexSequence: newButtonIndexSequence })

      // our escape condition:
      if (isSolved) {
        console.log('Solved with button sequence:', newButtonIndexSequence)
        return newButtonIndexSequence
      }
    }
  }
  throw new Error('No solution found')
}

const machines = input.map((line) => new Machine(line))
const lightSolutions = machines.map((machine) => bfsToSolveLights(machine))
const lightSolutionLengthSum = lightSolutions.reduce((sum, solution) => sum + solution.length, 0)
console.log('Light solutions:', lightSolutions)
console.log('Sum of light solution lengths:', lightSolutionLengthSum)

const joltageSolutions = machines.map((machine) => bfsToSolveJoltage(machine))
const joltageSolutionLengthSum = joltageSolutions.reduce((sum, solution) => sum + solution.length, 0)
console.log('Joltage solutions:', joltageSolutions)
console.log('Sum of joltage solution lengths:', joltageSolutionLengthSum)
