const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const pool = require("../db/pool");

module.exports = (passport) => {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const { rows } = await pool.query(
            `SELECT id, email, password_hash, permission_status, is_active
             FROM users
             WHERE email = $1`,
            [email],
          );

          if (!rows.length) {
            return done(null, false, { message: "Invalid email or password." });
          }

          const user = rows[0];

          if (!user.is_active) {
            return done(null, false, { message: "Account disabled." });
          }

          const isMatch = await bcrypt.compare(password, user.password_hash);

          if (!isMatch) {
            return done(null, false, { message: "Invalid email or password." });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );

  // SERIALIZE USER
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // DESERIALIZE USER (CREATES req.user)
  passport.deserializeUser(async (id, done) => {
    try {
      const { rows } = await pool.query(
        `SELECT u.id, u.email
         FROM users u
         WHERE u.id = $1`,
        [id],
      );

      if (!rows.length) {
        return done(null, false);
      }

      return done(null, rows[0]);
    } catch (err) {
      return done(err);
    }
  });
};
