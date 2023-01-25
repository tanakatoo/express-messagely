/** User class for message.ly */
const db = require('../db')
const expressError = require('../expressError')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require('../config')

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register(username, password, first_name, last_name, phone) {

    if (!username || !password || !first_name || !last_name || !phone) {
      console.log(username, password, first_name, last_name, phone)
      throw new expressError("Fill in all required information", 400)
    }
    // make hash
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
    const results = await db.query(`INSERT INTO users (username, password, first_name, last_name, phone, join_at) 
                      values ($1, $2, $3, $4, $5, CURRENT_DATE) RETURNING *`, [username, hashedPassword, first_name, last_name, phone])
    return results.rows
  }


  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const user = await User.get(username)
    if (user) {
      const res = await bcrypt.compare(password, user.password)
      if (res) {
        // user is authenticated
        return true
      } else {
        return false
      }
    } else {
      return false
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const results = await db.query(`UPDATE users SET last_login_at=CURRENT_DATE WHERE username=$1`, [username])
    return results.rows[0]
  }



  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(`SELECT * FROM users`)
    return results.rows
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(`SELECT * FROM users WHERE username=$1`, [username])
    return results.rows[0]
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */


  static async messagesFrom(username) {
    const results = await db.query(`SELECT * FROM messages WHERE username=$1`, [username])
    return results.rows
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(`SELECT * FROM messages WHERE username=$1`, [username])
    return results.rows
  }
}


module.exports = User;