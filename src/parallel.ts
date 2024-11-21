import {
  IParallelImplement,
  IWorkerImplement,
  TCallbackParallel,
  TDataExec,
} from "./types";
import { createDeferred, isBrowser } from "./utils";
import * as os from "os";
import { WorkerConvert } from "./worker-convert";

export class Parallel implements IParallelImplement {
  static maxWorkers = isBrowser
    ? navigator.hardwareConcurrency || 4
    : os.cpus().length;

  private _isRunningParallel = false;
  private _isRunWorkerFail = false;
  private _callbackParallel: TCallbackParallel;
  private _dataExecute: TDataExec = {
    binding: null,
    data: [],
  };
  private startDataIndexCalculate = 0;
  private resultData: any[] = [];
  private deferred: any;
  private workerCreated = 0;

  constructor(cb: TCallbackParallel) {
    this._callbackParallel = cb;
  }

  public calculateData<T extends any[]>(data: T): IParallelImplement {
    if (!this._isRunningParallel) {
      this._dataExecute.data = data;
      this.startDataIndexCalculate = 0;
    }

    return this;
  }

  public bindingParallel(bindingInstance: any): IParallelImplement {
    if (!this._isRunningParallel) {
      this._dataExecute.binding = bindingInstance;
      this.startDataIndexCalculate = 0;
    }

    return this;
  }

  public execute<T = any>(): Promise<T> {
    if (this._isRunningParallel) {
      const def: any = createDeferred();
      def.reject("[Parallel] in running calculate");
      return def.promise;
    }

    this.deferred = createDeferred();
    this._isRunningParallel = true;

    const lengthData = this._dataExecute.data.length;
    this.startDataIndexCalculate = 0;
    this.resultData = [];
    this._isRunWorkerFail = false;

    for (
      ;
      this.startDataIndexCalculate < Parallel.maxWorkers &&
      this.startDataIndexCalculate < lengthData;
      this.startDataIndexCalculate++
    ) {
      this.invokeWorker(this.startDataIndexCalculate);
    }

    return this.deferred.promise;
  }

  private invokeWorker(index: number, worker?: IWorkerImplement): void {
    if (!worker) {
      this.workerCreated++;
      worker = new WorkerConvert(this._callbackParallel);
    }

    const lengthData = this._dataExecute.data.length;
    worker.onmessage = (msg) => {
      if (this._isRunWorkerFail) {
        worker.terminate();
        this.workerCreated--;
        return;
      }

      this.resultData[index] = msg.data;

      if (this.startDataIndexCalculate < lengthData) {
        this.invokeWorker(this.startDataIndexCalculate++, worker);
      } else {
        worker.terminate();
        this.workerCreated--;

        if (this.workerCreated === 0) {
          this._isRunningParallel = false;
          this.deferred.resolve(this.resultData);
        }
      }
    };
    worker.onerror = (err) => {
      if (this._isRunWorkerFail) {
        worker.terminate();
        this.workerCreated--;

        if (this.workerCreated === 0) {
          this._isRunningParallel = false;
        }
        return;
      }
      worker.terminate();
      this.workerCreated--;
      this._isRunWorkerFail = true;
      if (this.workerCreated === 0) {
        this._isRunningParallel = false;
      }
      this.deferred.reject(err);
    };
    worker.postMessage({
      data: this._dataExecute.data[index],
      binding: this._dataExecute.binding,
    });
  }
}
