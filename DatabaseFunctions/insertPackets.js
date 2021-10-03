const DbQuerySync = require("./executeDBquery")
const utils = require('util')

const insertPacketQuery = `call add_new_packet(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
const insertSensorQuery = `call add_sensor(?,?,?,?,?,?,?,?,?,?,?,?,?);`

const insertPacket = async (type, data, ip, port) => {
    const pakcetData_array = []
    data.status.GSM_status = JSON.stringify(data.status.GSM_status)
    pakcetData_array.push(data.IMEI, type, data.RTC_time, data.connectToPower, data.sensor_info.number_of_sensors, data.sensor_info.type, data.firmware, data.status.present,data.LSB.present, data.LSB.LAC, data.LSB.cell_id, data.LSB.MCC, data.LSB.MNC,data.status.alarm_type, data.status.terminal_info, data.status.CSQ, data.status.GSM_status, data.status.battery_voltage, data.status.power_voltage, ip, port)
    const [result, error] = await DbQuerySync(insertPacketQuery, pakcetData_array)
    
    if(error){
        //save this to logs
        //***************** */
        console.log({result})
    }
    const gateway_data_id = result[0][0]['@gateway_data_id']

    for (let i = 0; i < data.sensor_info.sensors.length; i++) {
        let sensor = data.sensor_info.sensors[i];
        let sensor_data_array = []
        
        console.log("my : ", sensor.buttonPressed)
        sensor_data_array.push(Number(sensor.id), Number(data.IMEI), data.sensor_info.type, sensor.buttonPressed, JSON.stringify(sensor.status), sensor.battery_voltage, sensor.sensor_condition, sensor.temperature, sensor.humidity, Number(sensor.RSSI), sensor.time, gateway_data_id,Number(data.IMEI))
        const [result1, error] = await DbQuerySync(insertSensorQuery, sensor_data_array)
        if(error){
            //save this to logs
            //***************** */
            console.log({error:"error"})
        }
        console.log(result1)
    }
}

module.exports = insertPacket