const express = require('express')
const router = new express.Router
const User = require('../models/user')
const { SECRET_KEY } = require('../config')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const ExpressError = require('../expressError')


/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body
        const loginOK = await User.authenticate(username, password)
        console.log('login finished authenticating', username, password)
        if (loginOK) {
            const token = jwt.sign({ username: username }, SECRET_KEY)
            await User.updateLoginTimestamp()
            return res.json({ token: token })

        } else {
            throw new ExpressError("Username/password invalid", 400)
        }
    } catch (e) {
        next(e)
    }

})


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post('/register', async (req, res, next) => {
    try {
        const { username, password, first_name, last_name, phone } = req.body
        const results = await User.register(username, password, first_name, last_name, phone)
        if (results) {
            // log them in
            const token = jwt.sign({ username: username }, SECRET_KEY)
            await User.updateLoginTimestamp()
            return res.json({ token: token })
        }
    } catch (e) {
        next(e)
    }

})

module.exports = router