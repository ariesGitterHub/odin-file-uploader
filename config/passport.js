const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
// const pool = require("../db/pool"); // Not needed, using Prisma
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

          if (!user) {
            return done(null, false, { message: "Incorrect email" });
          }

          const isMatch = await bcrypt.compare(password, user.passwordHash);

          if (!isMatch) {
            return done(null, false, { message: "Invalid password." });
          }

          // Update last login date
          await prisma.user.update({
            where: { id: user.id },
            data: {
              lastLoginAt: new Date(),
            },
          });

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

  // DESERIALIZE USER (creates req.user)
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};
