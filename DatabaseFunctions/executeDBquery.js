const pool = require('./dbconnection')
//calling database quiries
//as result callback is called with
// error as error and result as null in case of error
// error as null and result as resluts array if successfull


const executeQuerySync = (query, data) => {
    return new Promise(async (resolve, reject) => {
        await pool.getConnection((err, connection) => {
            //checking if any errors
            if(err){
                console.log(err)
                return resolve([null, [{msg:'Falied to connect with database'}]])
            }

            connection.query(query, data, function (error, results, fields) {
                //checking if any error
                if (error) {
                        connection.release()
                        console.log("Error in Database >>>>>>>>>>>>>>>>>", error)
                        return resolve([null, [{msg:'Falied to fetch/update info in database.'}]])
                }
                //disconnecting form database and send success respose
                connection.release()
                resolve([results, null])
                
            })
        })
    })
}

module.exports = executeQuerySync