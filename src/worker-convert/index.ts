import {
  IWorker,
  IWorkerImplement,
  TCallbackParallel,
  TDataExec,
} from "../types";
import { isBrowser } from "../utils";
import { BrowserWorker } from "../worker-browser";
import { NodeWorker } from "../worker-node";

export class WorkerConvert implements IWorkerImplement {
  private _active = true;
  private _worker: IWorker;

  get onmessage() {
    if (!this._active) {
      return null;
    }
    return this._worker.onmessage;
  }
  set onmessage(cb: ((e: MessageEvent) => any) | null) {
    if (!this._active) {
      return;
    }
    this._worker.onmessage = cb;
  }

  get onerror() {
    if (!this._active) {
      return null;
    }
    return this._worker.onerror;
  }
  set onerror(cb: ((...args: any[]) => void) | null) {
    if (!this._active) {
      return;
    }
    this._worker.onerror = cb;
  }

  constructor(cb: TCallbackParallel) {
    if (isBrowser) {
      this._worker = new BrowserWorker(cb);
    } else {
      this._worker = new NodeWorker(cb);
    }
  }

  postMessage(data: TDataExec): void {
    if (!this._active) {
      return;
    }

    this._worker.postMessage(data);
  }

  terminate(): void {
    if (!this._active) {
      return;
    }

    this._active = false;
    this._worker.terminate();
  }
}
