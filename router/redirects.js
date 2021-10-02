const redirectHome = (req, res, next) => {
    try {
        if (req.session.type == "admin" && req.session.logged_in) {
            return res.redirect('/dashboard')
        }

        next()
    } catch (e) {
        console.log(e)
        req.flash('error_msg', [{
            msg: "Inter website Error."
        }])
        res.redirect('/')
    }
}

const redirectLogin = async (req, res, next) => {
    try {
        if (req.session.type != "admin" || !req.session.logged_in) {
            req.session.type = null
            req.session.logged_in = null

            req.flash('error_msg', [{
                msg: "You are unautharized, please login."
            }])
            return res.redirect('/')
        }

        next()
    } catch (e) {
        console.log(e)
        req.flash('error_msg', [{
            msg: "Internal app error."
        }])
        res.redirect('/')
    }
}

module.exports = {redirectHome, redirectLogin}