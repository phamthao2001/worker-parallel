import { ChildProcess, fork } from "child_process"
import { join } from "path"
import { IWorker, TCallbackParallel, TDataExec } from "../types"

export class NodeWorker implements IWorker {
    private _childProcess: ChildProcess
    private _url = join(__dirname, 'process-node.js');

    private _onMessageCb: ((e: {data: any}) => void) | null = null
    private _onErrorCb: ((...args: any[]) => void) | null = null

    get onmessage() {
        return this._onMessageCb
    }
    set onmessage(v: ((e: {data: any}) => void) | null) {
        this._onMessageCb = v
    }

    get onerror() {
        return this._onErrorCb
    }
    set onerror(v: ((...args: any[]) => void) | null) {
        this._onErrorCb = v
    }

    constructor(cb: TCallbackParallel) {
        this._childProcess = fork(this._url)

        this._setUpListener()

        const cbSrc = this.stringifyCallback(cb)
        this.postMessage({data: cbSrc})
    }

    /**
     * Setup listener for child process
     */
    private _setUpListener(): void {
        this._childProcess.on('message', (msg: string) => {
            if(this._onMessageCb) {
                this._onMessageCb({ data: JSON.parse(msg) })
            }
        })

        this._childProcess.on('error', (err) => {
            if(this._onErrorCb) {
                this._onErrorCb(err)
            }
        })
    }

    /**
     * Convert callback to string to apply in child process
     * 
     * @param cb - callback need stringify 
     * @returns - string convert
     */
    public stringifyCallback(cb: TCallbackParallel):string {
        return (
            `process.on("message", function(e) {
                    var data = JSON.parse(e)
                    process.send(
                        (${cb.toString()}).call(data.binding, data.data)
                    )
                }
            )`
        )
    }

    /**
     * Send data to child process
     * 
     * @param data - data need send to child process
     */
    public postMessage(data: TDataExec) {
        this._childProcess.send(JSON.stringify(data));
    }

    /**
     * Kill child process
     */
    public terminate() {
        this._childProcess.kill()
    }
}