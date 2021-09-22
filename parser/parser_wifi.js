const utils = require('util')
const fs = require('fs')
const path = require('path')
const insertPacket = require('../DatabaseFunctions/insertPackets');

const writeLogs = async (packet) => {
    packet = JSON.stringify(packet, null, 4);
    fs.appendFile(path.join(__dirname,'4glogs.json'), packet + ',', (err) => {
        if (err) {
            console.log(err)
        }
        console.log('written to logs')
    });
} 

const object_4g = {
    protocol:24,
    firmware:null,
    IMEI:null,
    RTC_time: null,
    connectToPower:0,
    LSB:{
        present:false,
        LAC:null,
        cell_id:null,
        MCC:null,
        MNC:null
    },
    status:{
        present:false,
        alarm_type:null,
        terminal_info:null,
        battery_voltage: null,
        power_voltage: null,
    },
    sensor_info:{
        present:false,
        type:null,
        number_of_sensors:0,
        sensors:[]
    }
}

const rough_sensor = {
    id:null,
    status:[],
    battery_voltage:null,
    sensor_condition:null,
    temperature:null,
    humidity:null,
    RSSI:null,
    time:null
}

const parseData = async (data, ip, port) => {
    const sensor_packet = JSON.parse(JSON.stringify(object_4g))
    console.log(data)
    let counter = 8
    sensor_packet.firmware = `${data[counter++]}.${data[counter++]}.${data[counter++]}.${data[counter++]}`
    sensor_packet.IMEI = `${data[counter++].toString(16).padStart(2, '0')}${data[counter++].toString(16).padStart(2, '0')}${data[counter++].toString(16).padStart(2, '0')}${data[counter++].toString(16).padStart(2, '0')}${data[counter++].toString(16).padStart(2, '0')}${data[counter++].toString(16).padStart(2, '0')}${data[counter++].toString(16).padStart(2, '0')}${data[counter++].toString(16).padStart(2, '0')}`
    sensor_packet.RTC_time = `20${data[counter++].toString(10).padStart(2, '0')}/${data[counter++].toString(10).padStart(2, '0')}/${data[counter++].toString(10).padStart(2, '0')} ${data[counter++].toString(10).padStart(2, '0')}:${data[counter++].toString(10).padStart(2, '0')}:${data[counter++].toString(10).padStart(2, '0')}`
    
    counter++
    counter++

    if(data[counter++] != 0 || data[counter++] != 0){
        sensor_packet.status.present = true
        counter = await putStatus_data(data, sensor_packet, counter)
    }

    //console.log(data[counter], data[counter+1])
    if(data[counter++] != 0 || data[counter++] != 0){
        //console.log(data[counter-2], data[counter-2])
        sensor_packet.sensor_info.present = true
        counter = await putSensorInfo_data(data, sensor_packet, counter)
    }

    //console.log(utils.inspect(sensor_packet, false, null))
    //await writeLogs(sensor_packet)
    insertPacket('WIFI',sensor_packet, ip, port)
}

const putStatus_data = (data, sensor_object, start) => {
    let alarm = data[start++].toString(16)
    if(alarm == 'aa'){
        sensor_object.status.alarm_type = 'Interval 4G Data'
    } else if(alarm == '10'){
        sensor_object.status.alarm_type = 'Low Battery'
    } else if(alarm == '60'){
        sensor_object.status.alarm_type = 'Begin Charge'
    } else {
        sensor_object.status.alarm_type = 'End Charge'
    }

    let ternimanl_info = data[start++].toString(2).padStart( 8, '0')
    sensor_object.connectToPower = ternimanl_info[0] == '0'?0:1
    sensor_object.status.terminal_info = (ternimanl_info[0] == '0'?'Not connect Power':'Connect to power')
    
    start++
    start++
    sensor_object.status.battery_voltage = (256 * data[start++] + data[start++])/1000
    sensor_object.status.power_voltage = (256 * data[start++] + data[start++])/1000

    return start
}

const putSensorInfo_data = (data, sensor_object,start) => {
    let sensor_type = data[start++]
    sensor_object.sensor_info.type = sensor_type == 1?'TAG07/07B/08':"TAG08B"

    let number_of_sensors = data[start++]
    sensor_object.sensor_info.number_of_sensors = number_of_sensors
    let sensor_packet_lenght = data[start++]
    //console.log(sensor_packet_lenght)

    if(number_of_sensors == 0 || sensor_packet_lenght == 0){
       return 
    }

    for (let i = 0; i < number_of_sensors; i++) {
        let sensor_temp = JSON.parse(JSON.stringify(rough_sensor));

        sensor_temp.id = `${data[start++].toString(16).padStart(2, '0')}${data[start++].toString(16).padStart(2, '0')}${data[start++].toString(16).padStart(2, '0')}${data[start++].toString(16).padStart(2, '0')}`

        let temp_status = data[start++].toString(2).padStart( 8, '0')
        //console.log(temp_status)
        sensor_temp.status.push((temp_status[0]=='0'?"Voltage normal":"Low Voltage"))
        sensor_temp.status.push((temp_status[1]=='0'?"Temperature normal":"Temperature alert"))
        sensor_temp.status.push(temp_status[2]=='0'?"Don't Press sesor button":"Press sensor button")
        sensor_temp.status.push(temp_status[3]=='0'?"ACK disable":"ACK enable")
        sensor_temp.status.push(temp_status[4]=='0'?"Sensor RTC disable":"Sensor RTC enable")

        sensor_temp.battery_voltage = (256 * data[start++] + data[start++])/1000
        
        let temp_temprature = (256 * data[start++] + data[start++])
        sensor_temp.sensor_condition = temp_temprature & (0b1000000000000000)?'normal':'abnormal'
        sensor_temp.temperature = (temp_temprature & (0b010000000000000)?-1 * (temp_temprature & (0b001111111111111)):(temp_temprature & (0b001111111111111)))/10
            
        if(data[start] != 255){
            sensor_temp.humidity = data[start++]
        } else {
            start++
        }

        sensor_temp.RSSI = data[start++]

        sensor_temp.time = `20${data[start++].toString(10).padStart(2, '0')}/${data[start++].toString(10).padStart(2, '0')}/${data[start++].toString(10).padStart(2, '0')} ${data[start++].toString(10).padStart(2, '0')}:${data[start++].toString(10).padStart(2, '0')}:${data[start++].toString(10).padStart(2, '0')}`
        sensor_object.sensor_info.sensors.push(sensor_temp)
        delete sensor_temp
    }

    return start
}

module.exports = parseData