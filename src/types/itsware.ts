export interface ItsWareDevice {
  id: number
  device: string
  cabinet: string
  date: string
}

export interface ItsWareClickUpDevices {
  [clickUpTaskUrl: string]: number[] // Array of device IDs
}
