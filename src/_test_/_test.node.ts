import { Parallel } from "../parallel"

const hardWork = (n: number): number => {
    let out = 0
    for(let i = 0; i< n; i++) {
        out += i
    }
    return out
}

let data = [1_000_000, 1_500_000, 2_000_000, 2_500_000, 3_000_000, 3_500_000, 4_000_000, 4_500_000, 5_000_000]
data = data.map(i => i*1000)
const startTime = performance.now()

const p = new Parallel(hardWork)
p.calculateData(data)
p.execute<number[]>().then(result => {
    console.log('parallel')
    console.log(result)
    console.log(performance.now() - startTime)
}).catch((err) => {
    console.log(err)
})

// const out = []
// for(let i = 0; i< data.length; i++) {
//     out.push(hardWork(data[i]))
// }
// console.log('sequential')
// console.log(out)
// console.log(performance.now() - startTime)