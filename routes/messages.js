const express = require('express')
const ExpressError = require('../expressError')
const router = new express.Router
const Message = require('../models/message')
const { ensureLoggedIn } = require('../middleware/auth')

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async (req, res, next) => {
    try {
        const { id } = req.params

        const results = await Message.get(id)
        console.log('got message', results)
        if (results) {
            console.log("to user is", results.to_user)
            if (results.to_user.username === req.user.username) {
                // mark as read
                const resultsMarked = Message.markRead(id)
                if (resultsMarked) {
                    return res.json({ message: results })
                } else {
                    throw new ExpressError("Cannot mark message as read", 400)
                }

            } else {
                throw new ExpressError("Unauthorized to view message", 401)
            }

        } else {
            throw new ExpressError(`No message with id ${id} is found`, 400)
        }
    } catch (e) {
        next(e)
    }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async (req, res, next) => {
    try {
        const { to_username, body } = req.body
        console.log('createing a message', req.user.username, to_username, body)
        const results = await Message.create(req.user.username, to_username, body)
        if (results) {
            return res.json({ message: results })
        }
    } catch (e) {
        next(e)
    }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', ensureLoggedIn, async (req, res, next) => {
    const { id } = req.params
    const results = await Message.get(id)
    if (results) {
        //got id 
        if (results.to_username === req.user.username) {
            const results2 = await Message.markRead(id)
            if (results2) {
                return res.json({ message: results2 })
            } else {
                throw new ExpressError('Message could not be marked as read', 400)
            }
        } else {
            throw new ExpressError("Not authorized to mark message as read", 401)
        }
    }
})

module.exports = router