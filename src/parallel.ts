import { IParallelImplement, IWorkerImplement, TCallbackParallel, TDataExec } from "./types";
import { isBrowser } from "./utils";
import * as os from 'os'
import { WorkerConvert } from "./worker-convert";

export class Parallel implements IParallelImplement{
    static maxWorkers = isBrowser ? (navigator.hardwareConcurrency || 4) : os.cpus().length

    private _isRunningParallel = false
    private _callbackParallel: TCallbackParallel
    private _dataExecute: TDataExec = {
        binding: null,
        data: []
    }
    private startDataIndexCalculate = 0
    private resultData: any[] = []
    private resultCallback: any

    constructor(cb: TCallbackParallel) {
        this._callbackParallel = cb
    }

    public calculateData<T extends any[]>(data: T): IParallelImplement {
        if(!this._isRunningParallel) {
            this._dataExecute.data = data
            this.startDataIndexCalculate = 0
        }

        return this
    }

    public bindingParallel(bindingInstance: any): IParallelImplement {
        if(!this._isRunningParallel) {
            this._dataExecute.binding = bindingInstance
            this.startDataIndexCalculate = 0
        }

        return this
    }

    public then<T>(cb: (resultParallel: T[]) => void): any {
        if(this._isRunningParallel) {
            return
        }

        this._isRunningParallel = true

        const lengthData = this._dataExecute.data.length
        this.startDataIndexCalculate = 0
        this.resultData = []
        this.resultCallback = cb

        for(;this.startDataIndexCalculate < Parallel.maxWorkers && this.startDataIndexCalculate < lengthData; this.startDataIndexCalculate++) {
            this.invokeWorker(this.startDataIndexCalculate)
        }
    }

    private invokeWorker(index: number, worker?: IWorkerImplement): void {
        if(!worker) {
            worker = new WorkerConvert(this._callbackParallel)
        }

        const lengthData = this._dataExecute.data.length
        worker.onmessage =  (msg) => {
            this.resultData[index] = msg.data

            if(this.startDataIndexCalculate < lengthData) {
                this.invokeWorker(this.startDataIndexCalculate++, worker)
            } else {
                // TODO: update case out range data length
            }
        }
        worker.onerror = (err) => {
            // TODO: update case error when execute worker
        }
    }
}