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

  /**
   * Binding data need execute parallel
   * 
   * @param data - data need mount to parallel
   * @returns - return this Parallel instance
   */
  public calculateData<T extends any[]>(data: T): IParallelImplement {
    if (!this._isRunningParallel) {
      this._dataExecute.data = data;
      this.startDataIndexCalculate = 0;
    }

    return this;
  }

  /**
   * Binding instance will be context this of hard work function
   * 
   * @param bindingInstance - binding instance. NOTE: Worker only execute raw data (so all function will be remove when binding)
   * @returns - return this Parallel instance
   */
  public bindingParallel(bindingInstance: any): IParallelImplement {
    if (!this._isRunningParallel) {
      this._dataExecute.binding = bindingInstance;
      this.startDataIndexCalculate = 0;
    }

    return this;
  }

  /**
   * Execute parallel from all data binding and hard work function
   * 
   * @returns - Promise to await data success or error
   */
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

  /**
   * Trigger calculate data from specific Worker enable
   * 
   * @param index - index data execute in worker
   * @param worker - Worker usage
   */
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

        if (this.workerCreated === 0) {
            this._isRunningParallel = false;
        }
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
