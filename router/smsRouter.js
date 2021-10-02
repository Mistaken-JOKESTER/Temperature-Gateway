const executeQuerySync = require('../DatabaseFunctions/executeDBquery')
const { sendSMS } = require('../telstra/getSIMData')
const { getToken, TelstraAPI } = require('../telstra/makeRequest')
const { redirectLogin, redirectHome } = require('./redirects')
const router = require('express').Router()

const invalidPass = (pass) => {
    if((typeof pass != 'string') ||(Number(pass)).toString() == 'NaN' || pass.length != 6){
        return true
    }

    return false
}

const invalidIP = (ip) => {
    return !(/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip))
}

router.post('/sms/modifyPass/:IMEI', redirectLogin, async (req, res) => {
    try{
        const {oldPassword, newPassword} = req.body

        let {IMEI} = req.params
        if(!IMEI || (Number(IMEI)).toString() == 'NaN' || IMEI < 0){
            req.flash('error_msg', [{msg:"Device not found"}])
            return res.redirect('/dashboard')
        }

        IMEI = Number(IMEI)
        const redirectURL = `/sms/${IMEI}`

        let erros = []

        if(invalidPass(oldPassword)){
            erros.push({msg:"Old password must have length of six and all numeric"})          
        }

        if(invalidPass(newPassword)){
            erros.push({msg:"New password must have length of six and all numeric"})
        }

        if(erros.length){
            return res.redirect(redirectURL)
        }
        
        const [exesist, error] = await executeQuerySync(`select IMEI from gateway where IMEI = ?;`, [IMEI])
        //console.log(exesist, error)

        if(error || !exesist.length){
            req.flash('error_msg', error||[{msg:'Device not found'}])
            return res.redirect(redirectURL)
        }

        const sms_body = `*${oldPassword},001,${newPassword}#`
        const [sms_satus, sms_data] = await sendSMS(sms_body, IMEI)
        // [1, {
        //     messages: [
        //       {
        //         to: '+61477280939',
        //         deliveryStatus: 'MessageWaiting',
        //         messageId: 'FCB2E7978823EC61AF6A00000300554C',
        //         messageStatusURL: 'https://tapi.telstra.com/v2/messages/sms/FCB2E7978823EC61AF6A00000300554C/status'
        //       }
        //     ],
        //     Country: [ { AUS: 1 } ],
        //     messageType: 'SMS',
        //     numberSegments: 1
        // }]

        console.log(sms_satus, sms_data)

        if(sms_satus == 0){
            req.flash('error_msg', sms_data)
            return res.redirect(redirectURL)
        }

        const [sms_sotred, sms_error] = await executeQuerySync(`CALL add_message(?,?,?,?);`, [sms_data.messages[0].messageId, sms_data.messages[0].to, sms_body, IMEI])

        if(sms_error){
            req.flash('error_msg', [{msg:"SMS is sent but failed to store in database"}])
            return res.redirect(redirectURL)
        }

        req.flash('success_msg', [{msg:"SMS sent successfully"}])
        res.redirect(redirectURL)
    } catch (e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.post('/sms/extensionSetting/:IMEI', redirectLogin, async (req, res) => {
    try{
        let {password, sadf, casf, saf} = req.body
        sadf = sadf?'1':'0'
        casf = casf?'1':'0'
        saf = saf?'1':'0'

        let {IMEI} = req.params
        if(!IMEI || (Number(IMEI)).toString() == 'NaN' || IMEI < 0){
            req.flash('error_msg', [{msg:"Device not found"}])
            return res.redirect('/dashboard')
        }

        IMEI = Number(IMEI)
        const redirectURL = `/sms/${IMEI}`

        if(invalidPass(password)){
            req.flash('error_msg', [{msg:"Password must have length of six and all numeric"}])
            return res.redirect(redirectURL)
        }

        const [exesist, error] = await executeQuerySync(`select IMEI from gateway where IMEI = ?;`, [IMEI])

        if(error || !exesist.length){
            req.flash('error_msg', error||[{msg:'Device not found'}])
            return res.redirect(redirectURL)
        }

        const sms_body = `*${password},008,${sadf}00${casf}00${saf}#`

        const [sms_satus, sms_data] = await sendSMS(sms_body, IMEI)

        console.log(sms_satus, sms_data)

        if(sms_satus == 0){
            req.flash('error_msg', sms_data)
            return res.redirect(redirectURL)
        }

        const [sms_sotred, sms_error] = await executeQuerySync(`CALL add_message(?,?,?,?);`, [sms_data.messages[0].messageId, sms_data.messages[0].to, sms_body, IMEI])

        if(sms_error){
            req.flash('error_msg', [{msg:"SMS is sent but failed to store in database"}])
            return res.redirect(redirectURL)
        }

        req.flash('success_msg', [{msg:"SMS sent successfully"}])
        res.redirect(redirectURL)
    } catch (e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.post('/sms/changeBand/:IMEI', redirectLogin, async (req, res) => {
    try{
        let {password, band} = req.body

        band = Number(band)
        if(!band || band == 'Nan' || band != 0 || band != 1 || band != 2 || band != 4){
            band = 4
        }

        let {IMEI} = req.params
        if(!IMEI || (Number(IMEI)).toString() == 'NaN' || IMEI < 0){
            req.flash('error_msg', [{msg:"Device not found"}])
            return res.redirect('/dashboard')
        }

        IMEI = Number(IMEI)
        const redirectURL = `/sms/${IMEI}`

        if(invalidPass(password)){
            req.flash('error_msg', [{msg:"Password must have length of six and all numeric"}])
            return res.redirect(redirectURL)
        }

        const [exesist, error] = await executeQuerySync(`select IMEI from gateway where IMEI = ?;`, [IMEI])
        //console.log(exesist, error)

        if(error || !exesist.length){
            req.flash('error_msg', error||[{msg:'Device not found'}])
            return res.redirect(redirectURL)
        }

        const sms_body = `*${password},009,${band}#`
        const [sms_satus, sms_data] = await sendSMS(sms_body, IMEI)

        console.log(sms_satus, sms_data)

        if(sms_satus == 0){
            req.flash('error_msg', sms_data)
            return res.redirect(redirectURL)
        }

        const [sms_sotred, sms_error] = await executeQuerySync(`CALL add_message(?,?,?,?);`, [sms_data.messages[0].messageId, sms_data.messages[0].to, sms_body, IMEI])

        if(sms_error){
            req.flash('error_msg', [{msg:"SMS is sent but failed to store in database"}])
            return res.redirect(redirectURL)
        }

        req.flash('success_msg', [{msg:"SMS sent successfully"}])
        res.redirect(redirectURL)
    } catch (e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.post('/sms/setAUP/:IMEI', redirectLogin, async (req, res) => {
    try{
        let {password, apn, username, pass} = req.body
        console.log({password, apn, username, pass})
        apn = apn?apn.slice(0,27):""
        username = username?username.slice(0,27):""
        pass = pass?pass.slice(0,27):""

        let {IMEI} = req.params
        if(!IMEI || (Number(IMEI)).toString() == 'NaN' || IMEI < 0){
            req.flash('error_msg', [{msg:"Device not found"}])
            return res.redirect('/dashboard')
        }

        IMEI = Number(IMEI)
        const redirectURL = `/sms/${IMEI}`

        if(invalidPass(password)){
            req.flash('error_msg', [{msg:"Password must have length of six and all numeric"}])
            res.redirect(redirectURL)
        }

        const [exesist, error] = await executeQuerySync(`select IMEI from gateway where IMEI = ?;`, [IMEI])
        //console.log(exesist, error)

        if(error || !exesist.length){
            req.flash('error_msg', error||[{msg:'Device not found'}])
            return res.redirect(redirectURL)
        }

        const sms_body = `*${password},011,${apn},${username},${pass}#`
        const [sms_satus, sms_data] = await sendSMS(sms_body, IMEI)

        console.log(sms_satus, sms_data)

        if(sms_satus == 0){
            req.flash('error_msg', sms_data)
            return res.redirect(redirectURL)
        }

        const [sms_sotred, sms_error] = await executeQuerySync(`CALL add_message(?,?,?,?);`, [sms_data.messages[0].messageId, sms_data.messages[0].to, sms_body, IMEI])

        if(sms_error){
            req.flash('error_msg', [{msg:"SMS is sent but failed to store in database"}])
            return res.redirect(redirectURL)
        }

        req.flash('success_msg', [{msg:"SMS sent successfully"}])
        res.redirect(redirectURL)
    } catch (e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.post('/sms/setIPP/:IMEI', redirectLogin, async (req, res) => {
    try{
        let {password, ip, port, x} = req.body
        x = x?1:0
        port = Number(port)
        console.log("setIPP",  {password, ip, port, x} )

        let {IMEI} = req.params
        if(!IMEI || (Number(IMEI)).toString() == 'NaN' || IMEI < 0){
            req.flash('error_msg', [{msg:"Device not found"}])
            return res.redirect('/dashboard')
        }

        IMEI = Number(IMEI)
        const redirectURL = `/sms/${IMEI}`

        let erros = []
        if(invalidPass(password)){
            erros.push({msg:"Password must have length of six and all numeric"})
        }
        if(!x && invalidIP(ip)){
            erros.push({msg:"IP was Invalid"})
        }

        if(port == 'Nan' || port < 1024 || port > 49151){
            erros.push({msg:"PORT is not valid"})
        }

        if(erros.length){
            req.flash('error_msg', erros)
            return res.redirect(redirectURL)
        }

        const [exesist, error] = await executeQuerySync(`select IMEI from gateway where IMEI = ?;`, [IMEI])
        //console.log(exesist, error)

        if(error || !exesist.length){
            req.flash('error_msg', error||[{msg:'Device not found'}])
            return res.redirect(redirectURL)
        }

        const sms_body = `*${password},015,${x},${ip},${port}#`

        const [sms_satus, sms_data] = await sendSMS(sms_body, IMEI)

        console.log(sms_satus, sms_data)

        if(sms_satus == 0){
            req.flash('error_msg', sms_data)
            return res.redirect(redirectURL)
        }

        const [sms_sotred, sms_error] = await executeQuerySync(`CALL add_message(?,?,?,?);`, [sms_data.messages[0].messageId, sms_data.messages[0].to, sms_body, IMEI])

        if(sms_error){
            req.flash('error_msg', [{msg:"SMS is sent but failed to store in database"}])
            return res.redirect(redirectURL)
        }

        req.flash('success_msg', [{msg:"SMS sent successfully"}])
        res.redirect(redirectURL)
    } catch (e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.post('/sms/sethps/:IMEI', redirectLogin, async (req, res) => {
    try{
        let {password, ip, port, x} = req.body
        x = x?1:0
        port = Number(port)
        console.log("seth", {password, ip, port, x} )

        let {IMEI} = req.params
        if(!IMEI || (Number(IMEI)).toString() == 'NaN' || IMEI < 0){
            req.flash('error_msg', [{msg:"Device not found"}])
            return res.redirect('/dashboard')
        }

        IMEI = Number(IMEI)
        const redirectURL = `/sms/${IMEI}`

        let erros = []
        if(invalidPass(password)){
            erros.push({msg:"Password must have length of six and all numeric"})
        }
        if(!x && invalidIP(ip)){
            erros.push({msg:"IP was Invalid"})
        }

        if(port == 'Nan' || port < 1024 || port > 49151){
            erros.push({msg:"PORT is not valid"})
        }

        if(erros.length){
            req.flash('error_msg', erros)
            return res.redirect(redirectURL)
        }

        const [exesist, error] = await executeQuerySync(`select IMEI from gateway where IMEI = ?;`, [IMEI])
        //console.log(exesist, error)

        if(error || !exesist.length){
            req.flash('error_msg', error||[{msg:'Device not found'}])
            return res.redirect(redirectURL)
        }

        const sms_body = `*${password},015,${x},${ip},${port}#`
        const [sms_satus, sms_data] = await sendSMS(sms_body, IMEI)

        console.log(sms_satus, sms_data)

        if(sms_satus == 0){
            req.flash('error_msg', sms_data)
            return res.redirect(redirectURL)
        }

        const [sms_sotred, sms_error] = await executeQuerySync(`CALL add_message(?,?,?,?);`, [sms_data.messages[0].messageId, sms_data.messages[0].to, sms_body, IMEI])

        if(sms_error){
            req.flash('error_msg', [{msg:"SMS is sent but failed to store in database"}])
            return res.redirect(redirectURL)
        }

        req.flash('success_msg', [{msg:"SMS sent successfully"}])
        res.redirect(redirectURL)
    } catch (e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})


router.post('/sms/readIMEI/:IMEI', redirectLogin, async (req, res) => {
    try{
        let {password} = req.body

        let {IMEI} = req.params
        if(!IMEI || (Number(IMEI)).toString() == 'NaN' || IMEI < 0){
            req.flash('error_msg', [{msg:"Device not found"}])
            return res.redirect('/dashboard')
        }

        IMEI = Number(IMEI)
        const redirectURL = `/sms/${IMEI}`

        if(invalidPass(password)){
            req.flash('error_msg', [{msg:"Password must have length of six and all numeric"}])
            res.redirect(redirectURL)
        }

        const [exesist, error] = await executeQuerySync(`select IMEI from gateway where IMEI = ?;`, [IMEI])
        //console.log(exesist, error)

        if(error || !exesist.length){
            req.flash('error_msg', error||[{msg:'Device not found'}])
            return res.redirect(redirectURL)
        }

        const sms_body = `*${password},801#`

        const [sms_satus, sms_data] = await sendSMS(sms_body, IMEI)

        console.log(sms_satus, sms_data)

        if(sms_satus == 0){
            req.flash('error_msg', sms_data)
            return res.redirect(redirectURL)
        }

        const [sms_sotred, sms_error] = await executeQuerySync(`CALL add_message(?,?,?,?);`, [sms_data.messages[0].messageId, sms_data.messages[0].to, sms_body, IMEI])

        if(sms_error){
            req.flash('error_msg', [{msg:"SMS is sent but failed to store in database"}])
            return res.redirect(redirectURL)
        }

        req.flash('success_msg', [{msg:"SMS sent successfully"}])
        res.redirect(redirectURL)
    } catch (e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.post('/sms/sensorCommand/:IMEI', redirectLogin, async (req, res) => {
    try{
        let {password, sensorId, command} = req.body
        console.log({password, sensorId, command})

        let {IMEI} = req.params
        if(!IMEI || (Number(IMEI)).toString() == 'NaN' || IMEI < 0){
            req.flash('error_msg', [{msg:"Device not found"}])
            return res.redirect('/dashboard')
        }

        IMEI = Number(IMEI)
        const redirectURL = `/sms/${IMEI}`

        let errors = []
        if(invalidPass(password)){
            errors.push({msg:"Password must have length of six and all numeric"})
        }
        if(!sensorId || typeof sensorId !== 'string'){
            errors.push({msg:"Invalid sensor ID"})
        }
        if(!command || typeof command !== 'string'){
            errors.push({msg:"Invalid command"})
        }

        if(errors.length){
            req.flash('error_msg', erros)
            return res.redirect(redirectURL)
        }

        const [exesist, error] = await executeQuerySync(`select IMEI from gateway where IMEI = ?;`, [IMEI])
        //console.log(exesist, error)

        if(error || !exesist.length){
            req.flash('error_msg', error||[{msg:'Device not found'}])
            return res.redirect(redirectURL)
        }

        const sms_body = `*${password},900,${sensorId},${command}#`
        const [sms_satus, sms_data] = await sendSMS(sms_body, IMEI)

        console.log(sms_satus, sms_data)

        if(sms_satus == 0){
            req.flash('error_msg', sms_data)
            return res.redirect(redirectURL)
        }

        const [sms_sotred, sms_error] = await executeQuerySync(`CALL add_message(?,?,?,?);`, [sms_data.messages[0].messageId, sms_data.messages[0].to, sms_body, IMEI])

        if(sms_error){
            req.flash('error_msg', [{msg:"SMS is sent but failed to store in database"}])
            return res.redirect(redirectURL)
        }

        req.flash('success_msg', [{msg:"SMS sent successfully"}])
        res.redirect(redirectURL)
    } catch (e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.post('/sms/intialize/:IMEI', redirectLogin, async (req, res) => {
    try{
        let {password} = req.body

        let {IMEI} = req.params
        if(!IMEI || (Number(IMEI)).toString() == 'NaN' || IMEI < 0){
            req.flash('error_msg', [{msg:"Device not found"}])
            return res.redirect('/dashboard')
        }

        IMEI = Number(IMEI)
        const redirectURL = `/sms/${IMEI}`

        if(invalidPass(password)){
            req.flash('error_msg', [{msg:"Password must have length of six and all numeric"}])
            res.redirect(redirectURL)
        }

        const [exesist, error] = await executeQuerySync(`select IMEI from gateway where IMEI = ?;`, [IMEI])
        //console.log(exesist, error)

        if(error || !exesist.length){
            req.flash('error_msg', error||[{msg:'Device not found'}])
            return res.redirect(redirectURL)
        }

        const sms_body = `*${password},990,099#`
        const [sms_satus, sms_data] = await sendSMS(sms_body, IMEI)

        console.log(sms_satus, sms_data)

        if(sms_satus == 0){
            req.flash('error_msg', sms_data)
            return res.redirect(redirectURL)
        }

        const [sms_sotred, sms_error] = await executeQuerySync(`CALL add_message(?,?,?,?);`, [sms_data.messages[0].messageId, sms_data.messages[0].to, sms_body, IMEI])

        if(sms_error){
            req.flash('error_msg', [{msg:"SMS is sent but failed to store in database"}])
            return res.redirect(redirectURL)
        }

        req.flash('success_msg', [{msg:"SMS sent successfully"}])
        res.redirect(redirectURL)
    } catch (e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

router.post('/sms/reboot/:IMEI', redirectLogin, async (req, res) => {
    try{
        let {password} = req.body

        let {IMEI} = req.params
        if(!IMEI || (Number(IMEI)).toString() == 'NaN' || IMEI < 0){
            req.flash('error_msg', [{msg:"Device not found"}])
            return res.redirect('/dashboard')
        }

        IMEI = Number(IMEI)
        const redirectURL = `/sms/${IMEI}`

        if(invalidPass(password)){
            req.flash('error_msg', [{msg:"Password must have length of six and all numeric"}])
            res.redirect(redirectURL)
        }

        const [exesist, error] = await executeQuerySync(`select IMEI from gateway where IMEI = ?;`, [IMEI])
        //console.log(exesist, error)

        if(error || !exesist.length){
            req.flash('error_msg', error||[{msg:'Device not found'}])
            return res.redirect(redirectURL)
        }

        const sms_body = `*${password},991#`
        const [sms_satus, sms_data] = await sendSMS(sms_body, IMEI)

        console.log(sms_satus, sms_data)

        if(sms_satus == 0){
            req.flash('error_msg', sms_data)
            return res.redirect(redirectURL)
        }

        const [sms_sotred, sms_error] = await executeQuerySync(`CALL add_message(?,?,?,?);`, [sms_data.messages[0].messageId, sms_data.messages[0].to, sms_body, IMEI])

        if(sms_error){
            req.flash('error_msg', [{msg:"SMS is sent but failed to store in database"}])
            return res.redirect(redirectURL)
        }

        req.flash('success_msg', [{msg:"SMS sent successfully"}])
        res.redirect(redirectURL)
    } catch (e) {
        console.log(e)
        req.flash('error_msg', [{msg:'Internal app error, plesase refer logs or console.'}])
        res.redirect('/')
    }
})

module.exports = router