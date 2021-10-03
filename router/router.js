const executeQuerySync = require('../DatabaseFunctions/executeDBquery')
const { redirectLogin, redirectHome } = require('./redirects')
const {getSimData} = require('../telstra/getSIMData')
const router = require('express').Router()

router.post('/login', redirectHome, async(req,res) => {
    try{
        const {
            username,
            password
        } = JSON.parse(JSON.stringify(req.body))

        if (!username || !password) {
            req.flash('error_msg', [{
                msg: "Please provide a valid username and password."
            }])
            return res.redirect('/')
        }
        const USER = process.env.ADMIN_UERNAME
        const PASSWORD = process.env.ADMIN_PASS

        console.log(username != USER || password != PASSWORD)
        if (username != USER || password != PASSWORD) {
            req.flash('error_msg', [{
                msg: "Please provide a valid username and password."
            }])
            return res.redirect('/')
        }

        req.session.type = "admin"
        req.session.logged_in = true
        req.session.deviceSearch = ''
        req.session.sensorSearch = ''

        res.redirect('/dashboard')
    } catch(e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.get('/dashboardR', redirectLogin, async(req, res) => {
    try{
        req.session.sensorSearch = ''
        req.session.deviceSearch = ''
        res.redirect('/dashboard')
    } catch(e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.get('/dashboard', redirectLogin, async (req, res) => {
    try{
        let search = req.session.deviceSearch
        req.session.sensorSearch = ''

        if(!search || (Number(search)).toString() == 'NaN' || search < 1){
            req.session.deviceSearch=''
            search = ''
        }

        const error_msg = req.flash('error_msg')
        const success_msg = req.flash('success_msg')

        let {offset} = req.query
        if(!offset || (Number(offset)).toString() == 'NaN' || offset < 0){
            offset = 0
        }
        offset = Number(offset)

        let query = ''
        if(search != ''){
            query = `select * from gateway where concat(gateway.IMEI, '') REGEXP '${search}' order by IMEI desc limit 50 offset ${offset};`
        } else {
            query = `select * from gateway order by IMEI desc limit 50 offset ${offset};`
        }


        const [resluts, error] = await executeQuerySync(query)
        //console.log(resluts, error)

        if(error){
            error_msg.push(...error)
        }

        res.render('dashboard', {
            error_msg,
            success_msg,
            response:resluts,
            offset: offset,
            search
        })
    } catch(e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.post('/serachDevice', redirectLogin, (req, res) => {
    try{
        const {IMEI} = req.body
        if(IMEI == ''){
            req.session.deviceSearch = ''
            req.session.sensorSearch = ''
            return res.redirect('/dashboard')
        }
        if(!IMEI || (Number(IMEI)).toString() == 'NaN' || IMEI < 1){
            req.flash('error_msg', [{msg:"Invalid search"}])
            return res.redirect('/dashboard')
        }

        req.session.deviceSearch = Number(IMEI)
        req.session.sensorSearch = ''
        res.redirect('/dashboard')
    } catch(e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.get('/viewDevice/:IMEI', redirectLogin, async (req, res) => {
    try{
        const error_msg = req.flash('error_msg')
        const success_msg = req.flash('success_msg')

        let {IMEI} = req.params
        if(!IMEI || (Number(IMEI)).toString() == 'NaN' || IMEI < 0){
            req.flash('error_msg', [{msg:"Device not found"}])
            res.redirect('/dashboard')
        }
        IMEI = Number(IMEI)
        let {offset} = req.query
        if(!offset || (Number(offset)).toString() == 'NaN' || offset < 0){
            offset = 0
        }
        offset = Number(offset)

        const [resluts, error] = await executeQuerySync(`call gateway_latest(${IMEI}); select * from sensor where gateway_id = ${IMEI}`)
        //console.log(resluts[6], error)

        // console.log(resluts[0])
        if(error || !resluts[0][0]['@status']){
            req.flash('error_msg', error||[{msg:'Device not found'}])
            return res.redirect('/dashboard')
        }

        res.render('viewDevice', {
            error_msg,
            success_msg,
            gateway:resluts[1][0],
            gateway_data: resluts[2][0],
            lsb:resluts[1][0].lsb_present?resluts[3][0]:{},
            status:resluts[1][0].status_present?resluts[4][0]:{},
            isTelsta:true,
            sensors: resluts[6]
        })
    } catch(e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.get('/sensorsR', redirectLogin, async(req, res) => {
    try{
        req.session.sensorSearch = ''
        req.session.deviceSearch = ''
        res.redirect('/sensors')
    } catch(e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.get('/lowsensorsR', redirectLogin, async(req, res) => {
    try{
        req.session.sensorSearch = ''
        req.session.deviceSearch = ''
        req.session.lowsensorSearch = ''
        res.redirect('/lowsensors')
    } catch(e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.get('/sensors', redirectLogin, async (req, res) => {
    try{
        let search = req.session.sensorSearch
        req.session.deviceSearch = ''
        req.session.lowsensorSearch = ''

        if(!search || (Number(search)).toString() == 'NaN' || search < 1){
            req.session.sensorSearch=''
            search = ''
        }

        const error_msg = req.flash('error_msg')
        const success_msg = req.flash('success_msg')

        let {offset} = req.query
        if(!offset || (Number(offset)).toString() == 'NaN' || offset < 0){
            offset = 0
        }
        offset = Number(offset)

        let query = ''
        if(search != ''){
            query = `select * from sensor where concat(sensor.sensor_id, '') REGEXP '${search}'`
        } else {
            query = `select * from sensor`
        }

        query += ` order by sensor_id desc limit 50 offset ${offset};`

        const [resluts, error] = await executeQuerySync(query)
        //console.log(resluts, error)

        if(error){
            error_msg.push(...error)
        }

        res.render('sensors', {
            error_msg,
            success_msg,
            response:resluts,
            offset: offset,
            search,
            low:0
        })
    } catch(e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.get('/lowsensors', redirectLogin, async (req, res) => {
    try{
        let search = req.session.lowsensorSearch
        req.session.deviceSearch = ''
        req.session.sensorSearch = ''

        if(!search || (Number(search)).toString() == 'NaN' || search < 1){
            req.session.lowsensorSearch=''
            search = ''
        }

        const error_msg = req.flash('error_msg')
        const success_msg = req.flash('success_msg')

        let {offset} = req.query
        if(!offset || (Number(offset)).toString() == 'NaN' || offset < 0){
            offset = 0
        }
        offset = Number(offset)

        let query = ''
        if(search != ''){
            query = `select * from sensor where concat(sensor.sensor_id, '') REGEXP '${search}' AND battery_voltage < 1`
        } else {
            query = `select * from sensor where battery_voltage < 1`
        }
            
        query += ` order by sensor_id desc limit 50 offset ${offset};`

        const [resluts, error] = await executeQuerySync(query)
        //console.log(resluts, error)

        if(error){
            error_msg.push(...error)
        }

        res.render('sensors', {
            error_msg,
            success_msg,
            response:resluts,
            offset: offset,
            search,
            low:1
        })
    } catch(e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.post('/serachSensor', redirectLogin, (req, res) => {
    try{
        const {sensor_id} = req.body
        if(sensor_id == ''){
            req.session.deviceSearch = ''
            req.session.sensorSearch = ''
            return res.redirect('/sensors')
        }
        if(!sensor_id || (Number(sensor_id)).toString() == 'NaN' || sensor_id < 1){
            req.flash('error_msg', [{msg:"Invalid search"}])
            return res.redirect('/sensors')
        }

        req.session.deviceSearch = ''
        req.session.sensorSearch = Number(sensor_id)
        res.redirect('/sensors')
    } catch(e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.post('/lowserachSensor', redirectLogin, (req, res) => {
    try{
        const {sensor_id} = req.body
        if(sensor_id == ''){
            req.session.deviceSearch = ''
            req.session.sensorSearch = ''
            req.session.lowsensorSearch = ''
            return res.redirect('/lowsensors')
        }
        if(!sensor_id || (Number(sensor_id)).toString() == 'NaN' || sensor_id < 1){
            req.flash('error_msg', [{msg:"Invalid search"}])
            return res.redirect('/lowsensors')
        }

        req.session.deviceSearch = ''
        req.session.sensorSearch = ''
        req.session.lowsensorSearch = Number(sensor_id)
        res.redirect('/lowsensors')
    } catch(e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.get('/viewSensor/:sensorID', redirectLogin, async (req, res) => {
    try{
        const error_msg = req.flash('error_msg')
        const success_msg = req.flash('success_msg')

        let {sensorID} = req.params
        if(!sensorID || (Number(sensorID)).toString() == 'NaN' || sensorID < 0){
            req.flash('error_msg', "Sensor not found")
            res.redirect('/dashboard')
        }
        sensorID = Number(sensorID)

        let {offset} = req.query
        if(!offset || (Number(offset)).toString() == 'NaN' || offset < 0){
            offset = 0
        }
        offset = Number(offset)

        const [resluts, error] = await executeQuerySync(`call sensor_latest(${sensorID}, ${offset});`)
        //console.log(resluts, error)

        //console.log(resluts[0])
        if(error || !resluts[0][0]['@status']){
            req.flash('error_msg', error||[{msg:'Sensor not found'}])
            return res.redirect('/sensors')
        }

        res.render('viewSensor', {
            error_msg,
            success_msg,
            sensor:resluts[1][0],
            sensor_data:resluts[2][0],
            all_sensor: resluts[3],
            offset: offset
        })
    } catch(e) {
        console.log(e)
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.get('/batteryData/:sensorID', async (req, res) => {
    try{

        let {sensorID} = req.params

        console.log(sensorID)
        if(!sensorID || (Number(sensorID)).toString() == 'NaN' || sensorID < 0){
            res.status(403).send({msg:'Not a vaild sensor'})
        }
        sensorID = Number(sensorID)

        const [resluts, error] = await executeQuerySync(`SELECT battery_voltage bv FROM sensor_data where sensor_id = ${sensorID} LIMIT 100;`)
        console.log(resluts, error)

        if(error){
            return res.status(404).send({msg:'Data not found'})
        }

        res.send(resluts)

    } catch(e) {
        console.log(e)
        res.status(404).send({msg:'Internal Error'})
    }
})

router.get('/dataDownload/:sensorID', redirectLogin, async (req, res) => {
    try{
        const error_msg = req.flash('error_msg')
        const success_msg = req.flash('success_msg')

        let {sensorID} = req.params

        console.log(sensorID)
        if(!sensorID || (Number(sensorID)).toString() == 'NaN' || sensorID < 0){
            req.flash('error_msg', [{msg:"Sensor not found"}])
            return res.redirect('/dashboard')
        }
        sensorID = Number(sensorID)

        let {limit} = req.query
        if(!limit || (Number(limit)).toString() == 'NaN' || limit < 0){
            limit=50
        }
        limit = Number(limit)

        const [resluts, error] = await executeQuerySync(`SELECT * FROM sensor_data where sensor_id = ${sensorID} LIMIT ${limit};`)
        //console.log(resluts, error)

        //console.log(resluts)
        if(error){
            req.flash('error_msg', error||[{msg:'Failed to fetch data for download'}])
            return res.redirect(`/viewSensor/${sensorID}`)
        }

        const items = resluts
        const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
        const header = Object.keys(items[0])
        const csv = [
        header.join(','), // header row first
        ...items.map(row => header.map(fieldName => {
            if(fieldName == 'status'){
                return JSON.stringify(row[fieldName], replacer).replace(',', ';').replace(',', ';').replace(',', ';').replace(',', ';').replace(',', ';')
            }
            return JSON.stringify(row[fieldName], replacer)
        }).join(','))
        ].join('\r\n')

        res.setHeader('Content-Disposition', `attachment; filename="sensor_data_${Date.now()}.csv"`)
        res.send(csv)

    } catch(e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.get('/logout', redirectLogin, async(req, res) => {
    try{
        req.session.type = null
        req.session.logged_in = false

        delete req.session.type
        delete req.session.logged_in
        res.redirect('/')
    } catch(e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/dashboard')
    }
})


router.get('/timeline', redirectLogin, async (req, res) => {
    try{

        const error_msg = req.flash('error_msg')
        const success_msg = req.flash('success_msg')

        let {offset} = req.query
        if(!offset || (Number(offset)).toString() == 'NaN' || offset < 0){
            offset = 0
        }

        let {limit} = req.query
        if(!limit || (Number(limit)).toString() == 'NaN' || limit < 0){
            limit = 50
        }

        offset = Number(offset)
        limit = Number(limit)
        console.log(limit, offset)
        let query = `
        select sd.temperature, sd.humidity, sd.condition, sd. battery_voltage, sd.time, sd.rssi, sd.buttonPress, sd.sensor_id, gd.gateway_id from sensor_data sd 
        left join gateway_data gd
        on gd.id = sd.gateway_data_id 
        order by sd.id desc limit ${limit} offset ${offset};
        `

        const [resluts, error] = await executeQuerySync(query)
        //console.log(resluts, error)

        if(error){
            error_msg.push(...error)
        }

        res.render('timeline', {
            error_msg,
            success_msg,
            response:resluts,
            offset: offset,
            limit
        })
    } catch(e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

//test it with wrong token
router.get('/telstra/:IMEI', redirectLogin, async (req, res) => {
    try{
        const error_msg = req.flash('error_msg')
        const success_msg = req.flash('success_msg')

        let {IMEI} = req.params
        if(!IMEI || (Number(IMEI)).toString() == 'NaN' || IMEI < 0){
            req.flash('error_msg', [{msg:"Device not found"}])
            res.redirect('/dashboard')
        }

        IMEI = Number(IMEI)

        const [exesist, error] = await executeQuerySync(`select IMEI from gateway where IMEI = ?;`, [IMEI])
        //console.log(exesist, error)

        if(error || !exesist.length){
            req.flash('error_msg', error||[{msg:'Device not found'}])
            return res.redirect('/dashboard')
        }
        
        const [req_status, req_result] = await getSimData(IMEI)
        if(req_status == 0){
            req.flash('error_msg', req_result)
            return res.redirect(`/viewDevice/${IMEI}`)
        }

        res.render('telstraData', {
            IMEI,
            sim:req_result,
            error_msg,
            success_msg
        })
    } catch (e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.get('/sms/:IMEI', redirectLogin, async (req, res) => {
    try{
        const error_msg = req.flash('error_msg')
        const success_msg = req.flash('success_msg')

        let {IMEI} = req.params
        if(!IMEI || (Number(IMEI)).toString() == 'NaN' || IMEI < 0){
            req.flash('error_msg', [{msg:"Device not found"}])
            return res.redirect('/dashboard')
        }

        IMEI = Number(IMEI)
        console.log(IMEI)

        let {offset} = req.query
        if(!offset || (Number(offset)).toString() == 'NaN' || offset < 0){
            offset = 0
        }
        offset = Number(offset)

        const [exesist, error] = await executeQuerySync(`select IMEI from gateway where IMEI = ?; select * from messages where gateway_id = ? order by id desc limit 50 offset ?; select sensor_id from sensor order by sensor_id;`, [IMEI, IMEI, offset])
        //console.log(exesist, error)

        if(error || !exesist[0].length){
            req.flash('error_msg', error||[{msg:'Device not found'}])
            return res.redirect('/dashboard')
        }

        res.render('telstraSMS', {
            IMEI,
            messages:exesist[1],
            error_msg,
            success_msg,
            offset,
            sensors:exesist[2]
        })
    } catch (e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.get('/responses', redirectLogin, async (req, res) => {
    try{
        const error_msg = req.flash('error_msg')
        const success_msg = req.flash('success_msg')

        let {offset} = req.query
        if(!offset || (Number(offset)).toString() == 'NaN' || offset < 0){
            offset = 0
        }
        offset = Number(offset)

        const [exesist, error] = await executeQuerySync(`select * from responses order by id desc limit 50 offset ?;`, [offset])

        if(error){
            req.flash('error_msg', error||[{msg:'Device not found'}])
            return res.redirect('/dashboard')
        }

        res.render('responses', {
            messages:exesist,
            error_msg,
            success_msg,
            offset
        })
    } catch (e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

module.exports = router