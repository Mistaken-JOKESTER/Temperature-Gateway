const {getToken, TelstraAPI} = require('./makeRequest')

const getSimData = async (IMEI) => {
    const request_url = `https://tapi.telstra.com/v1/iot-connectivity/v2/services?imei=${IMEI}`
    const [token_status, token_data] = await getToken()
    if(token_status == 0){
        return [token_status, token_data]
    }

    const [sim_status, sim_data] = await TelstraAPI(request_url, {}, 'GET', {})
    if(sim_status == 0){
        return [sim_status, sim_data]
    }

    return [sim_status, sim_data.sims[0]]
}

const getPhoneNumber = async (IMEI) => {
    const [number_status, number_data] = await getSimData(IMEI)
    if(number_status == 0){
        return [number_status, number_data]
    } else {
        return [number_status, number_data.msisdn]
    }
}

const sendSMS = async (sms_body, IMEI) => {
    const [number_status, number_data] = await getPhoneNumber(IMEI)
    if(number_status == 0){
        return [number_status, number_data]
    }

    console.log("NUMber ", number_status, number_data)
    const request_url = `https://tapi.telstra.com/v2/messages/sms`
    const data = {
        to: ["+61" + number_data.toString()],
        body: sms_body
    }

    const [sms_status, sms_data] = await TelstraAPI(request_url, data, 'POST', {})
    if(sms_status == 0){
        return [sms_status, sms_data]
    }

    return [sms_status, sms_data]
}

const sendSimpleSMS = async (number, sms_body) => {
    const [token_status, token_data] = await getToken()
    if(token_status == 0){
        return [token_status, token_data]
    }

    const request_url = `https://tapi.telstra.com/v2/messages/sms`
    const data = {
        to: [number.toString()],
        body: sms_body
    }

    const [sms_status, sms_data] = await TelstraAPI(request_url, data, 'POST', {})
    if(sms_status == 0){
        return [sms_status, sms_data]
    }

    return [sms_status, sms_data]
}

module.exports = {getSimData, sendSMS, getPhoneNumber, sendSimpleSMS}