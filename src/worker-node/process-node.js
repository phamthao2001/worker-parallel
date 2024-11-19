process.once('message', (e) => {
    const {data: code} = JSON.parse(e)
    eval(code[0])
})
