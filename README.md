# worker-parallel
This repo is inspired by [paralleljs](https://github.com/parallel-js/parallel.js).

Make easier when handle parallel computing in javascript.

Unlike paralleljs, which stores the function to process any array data.

---
## How to install
```
npm i worker-parallel
```
## Usage

### `Parallel(function)`
Use this constructor to create instance `Parallel` to store `function` need use to execute parallel process.

**Example**
```ts
const hardwork = (n: number): number => {
  let out = 0
  for(let i = 0; i < n; i++) {
    out += i
  }
  return out
}

const pInstance = new Parallel(hardwork) 
```
### `calculateData<T extends any[]>(data: T): IParallelImplement`
To binding `data` need to execute parallel with `function` when construct.

`calculateData` return self instance to keep handle other logic.

**Example**
```ts
let data = [1_000_000, 1_500_000, 2_000_000, 2_500_000, 3_000_000]

pInstance.calculateData(data)
```

### `bindingParallel(bindingInstance: any): IParallelImplement`
When `function` contain context `this` like that:

```ts
const A = {
  a: 1,
  hardwork: function(n: number): number {
    let out = 0
    for(let i = 0; i < n; i++) {
      out += i
    }
    return out + this.a
  }
}
```

When routing processing to Workers. The context of `this` is not guaranteed to be kept correct. So we need specific context `this` when handle parallel in Workers.

**Example**
```ts
const pInstance = new Parallel(A.hardwork)
pInstance.bindingParallel(A)
```

### `execute<T = any>(): Promise<T>`

After binding `data` and `bindingInstance` success we can execute parallel and receive `Promise` response to get value after execute done or error.

**Example**
```ts
const A = {
  a: 1,
  hardwork: function(n: number): number {
    let out = 0
    for(let i = 0; i < n; i++) {
      out += i
    }
    return out + this.a
  }
}
let data = [1_000_000, 1_500_000, 2_000_000, 2_500_000, 3_000_000]
const startTime = performance.now()

const pInstance = new Parallel(A.hardwork)
pInstance.calculateData(data)
        .bindingParallel(A)
        .execute<number[]>()
        .then(result => {
          console.log(result)
          console.log(performance.now() - startTime)
        })
```

## Contributor

[Thao Pham (Thao)](https://github.com/phamthao2001)

---
Any issues or information can be left at the repo or contact me.