const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
// const pool = require("../db/pool");
const prisma = require("../lib/prisma");

module.exports = (passport) => {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await prisma.user.findUnique({ where: { email } });

          // console.log("USER:", user);

          if (!user) {
            return done(null, false, { message: "Incorrect email" });
          }

          // console.log("HASH:", user.passwordHash);

          const isMatch = await bcrypt.compare(password, user.passwordHash);

          if (!isMatch) {
            return done(null, false, { message: "Invalid password." });
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
  // Source - https://stackoverflow.com/a/74549824
  // Posted by Pompedup, modified by community. See post 'Timeline' for change history
  // Retrieved 2026-06-09, License - CC BY-SA 4.0

  // I don't need all of users table...
  // passport.deserializeUser(async (id, done) => {
  //   try {
  //     const user = await prisma.user.findFirst({ where: { id } });
  //     console.log("Passport.js says user is:", user)

  //     done(null, user);
  //   } catch (error) {
  //     done(error);
  //   }
  // });

  // Note - better approach...
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
        },
      });
      console.log("Passport.js says user is:", user);

      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};
