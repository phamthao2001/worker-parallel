import { IWorker, TCallbackParallel, TDataExec } from "../types";

export class BrowserWorker implements IWorker {
    private _wrk: Worker

    get onmessage() {
        return this._wrk.onmessage
    }
    set onmessage(cb: ((e: MessageEvent) => any) | null) {
        this._wrk.onmessage = cb
    }

    get onerror() {
        return this._wrk.onerror
    }
    set onerror(cb: ((...args: any[]) => void) | null) {
        this._wrk.onerror = cb
    }

    constructor(cb: TCallbackParallel) {
        const src = this.stringifyCallback(cb)
        const blob = new Blob([src], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        this._wrk = new Worker(url);
    }

    /**
     * Convert callback to string to apply in worker
     * 
     * @param cb - callback need stringify 
     * @returns - string convert
     */
    public stringifyCallback(cb: TCallbackParallel): string {
        return (
            `self.onmessage = function(e) { 
                var data = JSON.parse(e.data); 
                self.postMessage(
                    (${cb.toString()}).call(data.binding, data.data)
                );
            }`
        )
    }

    /**
     * Send data to worker
     * 
     * @param data - data need send to worker
     */
    public postMessage(data: TDataExec): void {
        this._wrk.postMessage(JSON.stringify(data))
    }

    /**
     * Terminate worker
     */
    public terminate(): void {
        this._wrk.terminate()
    }
}