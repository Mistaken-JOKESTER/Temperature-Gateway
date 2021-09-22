const { v4: uuidv4 } = require('uuid');

//generating uuid for session id
const genuuid = () =>{
    const id = uuidv4().split('-')
    return UUID = id[0] + id[1] + id[2] + id[3] + id[4]
}

module.exports= genuuid