import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const input = (await readFile(`${dirname}/input.txt`, 'utf-8')).split('\n')

class NoMorePairsError extends Error {}

class JunctionBox {
  constructor(
    public x: number,
    public y: number,
    public z: number,
  ) {}

  get key(): string {
    return `${this.x},${this.y},${this.z}`
  }

  /** Euclidean distance between two junction boxes */
  distanceTo(other: JunctionBox): number {
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2 + (this.z - other.z) ** 2)
  }
}

class JunctionBoxCircuit {
  public boxes: JunctionBox[] = []

  /** Adds a box to the circuit and returns its key */
  addBox(box: JunctionBox) {
    this.boxes.push(box)
  }

  contains(box: JunctionBox): boolean {
    return this.boxes.some((b) => b.key === box.key)
  }
}

class JunctionBoxNetwork {
  // Map from box coordinates 'x,y,z' to list of junction boxes at that location
  public circuits: Map<string, JunctionBoxCircuit> = new Map()
  // Set of directly connected box pairs represented as 'x1,y1,z1_x2,y2,z2'
  public directlyConnectedPairs: Set<string> = new Set()
  constructor(public boxes: JunctionBox[]) {}

  mergeCircuits(boxes: JunctionBox[]) {
    const mergedCircuit = new JunctionBoxCircuit()
    for (const box of boxes) {
      mergedCircuit.addBox(box)
      this.circuits.set(box.key, mergedCircuit)
    }
  }

  boxPairIsInSameCircuit(boxA: JunctionBox, boxB: JunctionBox): boolean {
    const circuitA = this.circuits.get(boxA.key)
    if (!circuitA) return false
    return circuitA.contains(boxB)
  }

  boxPairIsDirectlyConnected(boxA: JunctionBox, boxB: JunctionBox): boolean {
    const pairKey = `${boxA.key}_${boxB.key}`
    const reversePairKey = `${boxB.key}_${boxA.key}`
    return this.directlyConnectedPairs.has(pairKey) || this.directlyConnectedPairs.has(reversePairKey)
  }

  /** Find the two closest junction boxes in the network */
  findClosestPair(skipIndirectlyConnectedPairs: boolean): [JunctionBox, JunctionBox] {
    let closestDistance = Infinity
    let closestPair: [JunctionBox, JunctionBox] | null = null

    for (let i = 0; i < this.boxes.length; i++) {
      for (let j = i + 1; j < this.boxes.length; j++) {
        const boxA = this.boxes[i]
        const boxB = this.boxes[j]
        if (boxA === undefined || boxB === undefined) throw new Error('Unexpected undefined junction box')
        const distance = boxA.distanceTo(boxB)
        if (distance < closestDistance && !this.boxPairIsDirectlyConnected(boxA, boxB)) {
          if (skipIndirectlyConnectedPairs && this.boxPairIsInSameCircuit(boxA, boxB)) continue
          closestDistance = distance
          closestPair = [boxA, boxB]
        }
      }
    }

    if (closestPair === null) throw new NoMorePairsError('No junction boxes found in the network')
    return closestPair
  }

  connectClosestPair(skipIndirectlyConnectedPairs: boolean) {
    const [boxA, boxB] = this.findClosestPair(skipIndirectlyConnectedPairs)
    const circuitA = this.circuits.get(boxA.key)
    const circuitB = this.circuits.get(boxB.key)

    this.directlyConnectedPairs.add(`${boxA.key}_${boxB.key}`)

    if (circuitA && circuitB) {
      if (circuitA === circuitB) return // Already connected

      this.mergeCircuits([...circuitA.boxes, ...circuitB.boxes])
    } else if (circuitA) {
      circuitA.addBox(boxB)
      this.circuits.set(boxB.key, circuitA)
    } else if (circuitB) {
      circuitB.addBox(boxA)
      this.circuits.set(boxA.key, circuitB)
    } else {
      const newCircuit = new JunctionBoxCircuit()
      newCircuit.addBox(boxA)
      newCircuit.addBox(boxB)
      this.circuits.set(boxA.key, newCircuit)
      this.circuits.set(boxB.key, newCircuit)
    }
  }

  buildNetwork(connectionCount: number, skipIndirectlyConnectedPairs: boolean = false) {
    for (let i = 0; i < connectionCount; i++) {
      try {
        if (i % 10 === 0) {
          console.log(`Connecting pair ${i} of ${connectionCount}`)
        }
        this.connectClosestPair(skipIndirectlyConnectedPairs)
      } catch (error) {
        if (error instanceof NoMorePairsError) {
          console.log(`No more pairs to connect, stopping at iteration ${i}.`)
          break
        }
        throw error
      }
    }
    console.log('Finished iterating')
  }

  getTopThreeLargestCircuits(): JunctionBoxCircuit[] {
    const circuitsArray = Array.from(new Set(this.circuits.values()))
    circuitsArray.sort((a, b) => b.boxes.length - a.boxes.length)
    return circuitsArray.slice(0, 3)
  }
}

const junctionBoxes: JunctionBox[] = input.map((line) => {
  const [x, y, z] = line.trim().split(',').map(Number)
  if (x === undefined || y === undefined || z === undefined) throw new Error(`Invalid input line: ${line}`)
  return new JunctionBox(x, y, z)
})
const network = new JunctionBoxNetwork(junctionBoxes)

network.buildNetwork(1000)
const topThreeCircuits = network.getTopThreeLargestCircuits()
const topThreeCircuitSizes = topThreeCircuits.map((circuit) => circuit.boxes.length)
const productOfTopThreeSizes = topThreeCircuitSizes.reduce((prod, size) => prod * size, 1)

console.log('Sizes of the three largest circuits:', topThreeCircuitSizes)
console.log('Product of the sizes of the three largest circuits:', productOfTopThreeSizes)

// Part 2, continue until everything is connected
network.buildNetwork(Number.POSITIVE_INFINITY, true)
const connectionsAsArray = Array.from(network.directlyConnectedPairs)
const lastConnectedPair = connectionsAsArray.at(-1)
const [boxAKey, boxBKey] = lastConnectedPair ? lastConnectedPair.split('_') : [null, null]
if (!boxAKey || !boxBKey) throw new Error('No last connected pair found')
const boxA = junctionBoxes.find((box) => box.key === boxAKey)
const boxB = junctionBoxes.find((box) => box.key === boxBKey)
if (!boxA || !boxB) throw new Error('Could not find junction boxes for the last connected pair')
const xCoordinateProduct = boxA.x * boxB.x

console.log('Last connected pair of boxes:', boxA.key, boxB.key)
console.log('Product of their x-coordinates:', xCoordinateProduct)
