import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const input = (await readFile(`${dirname}/input.txt`, 'utf-8')).split('\n')

class Device {
  public outputs: Device[] = []
  constructor(public name: string) {}

  pathCountToDeviceCache: Map<string, number> = new Map()
  pathsToDeviceCache: Map<string, Device[][]> = new Map()

  connect(device: Device) {
    this.outputs.push(device)
  }

  countPathsTo(target: Device): number {
    if (this === target) return 1
    const cacheEntry = this.pathCountToDeviceCache.get(target.name)
    if (cacheEntry !== undefined) return cacheEntry

    let pathCount = 0
    for (const output of this.outputs) {
      pathCount += output.countPathsTo(target)
    }
    this.pathCountToDeviceCache.set(target.name, pathCount)
    return pathCount
  }

  pathsTo(target: Device): Device[][] {
    if (this === target) return [[this]]
    const cacheEntry = this.pathsToDeviceCache.get(target.name)
    if (cacheEntry !== undefined) return cacheEntry

    const paths: Device[][] = []
    for (const output of this.outputs) {
      if (output.countPathsTo(target) === 0) continue
      const subPaths = output.pathsTo(target)
      for (const subPath of subPaths) {
        paths.push([this, ...subPath])
      }
    }
    this.pathsToDeviceCache.set(target.name, paths)
    return paths
  }
}

class DeviceMap {
  private devices = new Map<string, Device>()

  constructor(input: string[]) {
    for (const line of input) {
      const [sourceName, rest] = line.split(': ')
      if (sourceName === undefined || rest === undefined) throw new Error('Invalid line')
      const sourceDevice = this.getOrSet(sourceName)

      const targetNames = rest.trim().split(' ')
      for (const targetName of targetNames) {
        const targetDevice = this.getOrSet(targetName)
        sourceDevice.connect(targetDevice)
      }
    }
  }

  getOrSet(name: string): Device {
    if (!this.devices.has(name)) {
      this.devices.set(name, new Device(name))
    }
    const device = this.devices.get(name)
    if (!device) throw new Error('No device even though we just set it')
    return device
  }

  get(name: string): Device | undefined {
    return this.devices.get(name)
  }
}

const deviceMap = new DeviceMap(input)
const youDevice = deviceMap.get('you')
if (!youDevice) throw new Error("No 'you'-device")
const outDevice = deviceMap.get('out')
if (!outDevice) throw new Error("No 'out'-device")

const pathsFromYouToOutCount = youDevice.countPathsTo(outDevice)
console.log(`Total number of distinct paths from 'you' to 'out': ${pathsFromYouToOutCount}`)

const svrDevice = deviceMap.get('svr')
if (!svrDevice) throw new Error("No 'svr'-device")
const fftDevice = deviceMap.get('fft')
if (!fftDevice) throw new Error("No 'fft'-device")
const dacDevice = deviceMap.get('dac')
if (!dacDevice) throw new Error("No 'dac'-device")

const totalPathCountFromSvrToOut = svrDevice.countPathsTo(outDevice)
console.log(`Total number of distinct paths from 'svr' to 'out': ${totalPathCountFromSvrToOut}`)

const pathsFromSvrToOut = svrDevice.pathsTo(outDevice)
const filteredPaths = pathsFromSvrToOut.filter(
  (path) => path.some((device) => device === fftDevice) && path.some((device) => device === dacDevice),
)

// Note: This fails because of it uses too much memory for the full input
console.log(
  `Number of distinct paths from 'svr' to 'out' that pass through both 'fft' and 'dac': ${filteredPaths.length}`,
)
