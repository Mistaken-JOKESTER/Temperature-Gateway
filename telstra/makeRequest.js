const axios = require('axios')
const path = require('path')
const fs = require('fs')

const $CLIENT_KEY = process.env.TELSTRA_CLINET_ID
const $CLIENT_SECRET = process.env.TELSTRA_CLINET_SECRETE

const writeToken = async (token) => {
    token = JSON.stringify(token, null, 4);
    return new Promise((resolve, reject) => {
        fs.writeFile(path.join(__dirname,'token.json'), token, (err) => {
            if (err) {
                console.log(err)
                resolve([0, [{msg:"Failed to save your API token."}]])
            }
            resolve([1, null])
        });
    })
    
}

const readToken = async () => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname,'token.json'), 'utf8', function(err, data){
            if (err) {
                console.log(err)
                resolve([0, [{msg:"Failed to read your API token."}]])
            }
            resolve([1, JSON.parse(data)])
        });
    })
}

const getToken = () => {
    return new Promise((resolve, reject) => {
        axios({
            url:'https://tapi.telstra.com/v2/oauth/token',
            method:"post",
            headers:{
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data:`grant_type=client_credentials&client_id=${encodeURIComponent($CLIENT_KEY)}&client_secret=${$CLIENT_SECRET}&scope=NSMS`
        }).then(async res => {
            //console.log(res.data)
            const [status, result] = await writeToken(res.data)
            if(status == 0){
                resolve([0, result])
            }
            resolve([1, null])
        }).catch(err => {
            console.log(err.response.data)
            resolve([0, [{msg: "Failed to authorize with telstra API"}]])
        })
    })
}

const TelstraAPI = async (url, data, type, head) =>{
    console.log('request')
    const [status, result] = await readToken()
    if(status == 0){
        return ([0, result])
    }

    if(type == 'GET'){
        return new Promise((resolve, reject) => {
            axios({
                url:url,
                method:"get",
                headers:{
                    "Authorization":`Bearer ${result.access_token}`,
                    "Content-Type":"application/json",
                    "Accept":"application/json",
                    ...head
                }
            }).then(async res => {
                //console.log(res.data)
                resolve([1, res.data])
            }).catch(err => {
                console.log(err.response.data || err.response)
                if(err.response){
                    if(err.response.status = 401){
                        if(err.response.data.message){
                            resolve([0, [{msg:err.response.data.message}]])
                        } else if(err.response.data.fault){
                            resolve([0, [{msg:err.response.data.fault.faultstring}]])
                        } else {
                            resolve([0, [{msg:"API call failed"}]])
                        }
                    }
                } else {
                    resolve([0, [{msg:"API call failed"}]])
                }
                
            })
        })
    } else if(type == 'POST') {
        return new Promise( async (resolve, reject) => {
            axios({
                url:url,
                method:"post",
                headers:{
                    "Authorization":`Bearer ${result.access_token}`,
                    "Content-Type":"application/json",
                    "Accept":"application/json",
                    ...head
                },
                data:data
            }).then(res => {
                //console.log(res.data)
                resolve([1, res.data])
            }).catch(err => {
                console.log(err.response.data || err.response)
                if(err.response){
                    if(err.response.status = 401){
                        if(err.response.data.message){
                            resolve([0, [{msg:err.response.data.message}]])
                        } else if(err.response.data.fault){
                            resolve([0, [{msg:err.response.data.fault.faultstring}]])
                        } else {
                            resolve([0, [{msg:"API call failed"}]])
                        }
                    }
                } else {
                    resolve([0, [{msg:"API call failed"}]])
                }
            })
        })
    } else {
        return [0, [{msg:'Invalid request Type'}]]
    }
}

module.exports = {getToken, TelstraAPI}

const rought_data = {
    "count": 1,
    "sims": [
        {
            "imsi": "505013539187060",
            "cidn": "3891510879",
            "accountNumber": "4720718982",
            "msisdn": "477280939",
            "iccid": "89610182000964852496",
            "serialNumber": "8200096485246",
            "serviceInstanceId": null,
            "serviceStatus": "AC",
            "createdAt": "2021-07-26T07:39:48.979Z",
            "updatedAt": "2021-09-30T21:55:53.253Z",
            "deletedAt": null,
            "basePlanCode": "IOTSH5MB",
            "basePlanDescription": "Telstra IOT Shared Data 5MB",
            "basePlanAllocation": "5",
            "basePlanCost": null,
            "bonusPlanCode": null,
            "bonusPlanDescription": null,
            "bonusPlanAllocation": null,
            "bonusPlanCost": null,
            "subscriptionNumber": null,
            "ipAddress": "22.232.25.186",
            "inSession": true,
            "totalData": "2832785",
            "uploadData": "2465882",
            "downloadData": "366903",
            "dataCallCount": 6648,
            "incomingVoiceCallCount": 0,
            "incomingVoiceCallDuration": "0",
            "outgoingVoiceCallCount": 0,
            "outgoingVoiceCallDuration": "0",
            "incomingSmsCount": 13,
            "outgoingSmsCount": 0,
            "cellName": "SGWEBM1",
            "cellLatitude": "-27.464",
            "cellLongitude": "153.021",
            "accountName": null,
            "sourceSystem": "MICA",
            "nextBillDate": "2021-10-14T00:00:00.000Z",
            "lastBillDate": "2021-09-14T00:00:00.000Z",
            "customFieldsValues": {
                "2ce6f66c-d565-4b30-83fa-b0fa8230d29d": "Marcus Testing"
            },
            "planType": "SHARED",
            "imei": "863427040095946",
            "imeiSv": "8634270400959400",
            "lastConnected": "2021-10-01T02:49:45.000Z",
            "totalDataAllocation": "5",
            "blockStatus": null,
            "groups": [
                {
                    "id": "6d069067-e7f2-4497-ae52-743a9ecab19a",
                    "name": "SpareSIMs"
                },
                {
                    "id": "eb66d277-fc80-456f-b97a-f75e3dc13f23",
                    "name": "5 MB Account"
                }
            ]
        }
    ]
}