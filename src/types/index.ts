export interface IWorker {
    onmessage: ((...args: any[]) => void) | null
    onerror: ((...args: any[]) => void) | null
    stringifyCallback(cb: TCallbackParallel): string
    postMessage(data: TDataExec): void
    terminate(): void
}

export type TCallbackParallel = (...args: any[]) => any

export type TDataExec<T = any> = {
    binding?: any
    data: T
}