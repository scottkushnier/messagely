/** User class for message.ly */

const { BCRYPT_WORK_FACTOR } = require("../config");

/** User of the site. */
const bcrypt = require("bcrypt");
const db = require("../db");
const { del } = require("express/lib/application");

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    console.log("registering: ", username);
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    console.log("hashed: ", hashedPassword);
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
      VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)`,
      [username, hashedPassword, first_name, last_name, phone]
    );
    return { username, password, first_name, last_name, phone };
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(`SELECT * FROM users WHERE username = $1`, [
      username,
    ]);
    if (!result.rows.length) {
      console.log("no such user: ", username);
      return false;
    }
    const user = result.rows[0];
    const valid = bcrypt.compare(password, user.password);
    return valid;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users SET last_login_at = current_timestamp WHERE username = $1`,
      [username]
    );
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone FROM users`
    );
    return result.rows;
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
    try {
      const result = await db.query(
        `SELECT username,first_name,last_name,phone,join_at,last_login_at
        FROM users WHERE username = $1`,
        [username]
      );
      if (!result.rows.length) {
        console.log("no such user: ", username);
        throw "no such user";
      }
      const user = result.rows[0];
      return user;
    } catch (e) {
      return e;
    }
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT id, to_username, body, sent_at, read_at 
       FROM messages WHERE from_username = $1`,
      [username]
    );
    const messages = result.rows;
    const inflatedMessages = await Promise.all(
      messages.map(async function (m) {
        const to_user = await User.get(m.to_username);
        delete to_user.join_at;
        delete to_user.last_login_at;
        m.to_user = to_user;
        delete m.to_username;
        return m;
      })
    );
    // console.log("inflatedMessages: ", inflatedMessages);
    return inflatedMessages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT id, from_username, body, sent_at, read_at 
     FROM messages WHERE to_username = $1`,
      [username]
    );
    const messages = result.rows;
    const inflatedMessages = await Promise.all(
      messages.map(async function (m) {
        const from_user = await User.get(m.from_username);
        delete from_user.join_at;
        delete from_user.last_login_at;
        m.from_user = from_user;
        delete m.from_username;
        return m;
      })
    );
    // console.log("inflatedMessages: ", inflatedMessages);
    return inflatedMessages;
  }
}

module.exports = User;
