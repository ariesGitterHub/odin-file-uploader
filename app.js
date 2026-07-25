// *** FIRST!
require("dotenv").config();

// *** Safety checks for production-critical env vars
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required");
}

const passport = require("passport");
require("./config/passport")(passport);

// *** Imports
const express = require("express");
// const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const path = require("node:path");
const session = require("express-session");
const helmet = require("helmet");

// Middleware / routes
// const requireUserIsActive = require("./middleware/requireUserIsActive");
const {
  csrfProtection,
  csrfTokenMiddleware,
  csrfErrorHandler,
} = require("./middleware/csrfMiddleware");
// const setPermissions = require("./middleware/setPermissions");
const appRouter = require("./routes/appRouter");

// *** Create app
const app = express();

/* ----------------------------------------------------------
   THIS!!! RENDER FIX: trust proxy is REQUIRED for sessions
-------------------------------------------------------------*/
app.set("trust proxy", 1);

// *** Static / view config
app.use(express.static(__dirname + "/public"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// *** Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// *** Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:"],
      },
    },
  }),
);

// *** Session middleware (must be BEFORE passport)
const sessionConfig = {
  httpOnly: true,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 1, // 1 hour
  },
};

app.use(session(sessionConfig));

// *** Passport (after session)
app.use(passport.initialize());
app.use(passport.session());

// *** Custom middleware
// app.use(requireUserIsActive);

// *** CSRF protection (must come after session + passport)
// app.use(csrfProtection);
// app.use(csrfTokenMiddleware);

// *** Chrome devtools noise fix
app.use((req, res, next) => {
  if (req.path === "/.well-known/appspecific/com.chrome.devtools.json") {
    return res.status(204).end();
  }
  next();
});

// *** Global locals
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// app.use(setPermissions);

// *** Routes
app.get("/", (req, res) => {
  res.redirect("/app");
});

app.use("/app", appRouter);

// *** CSRF error handler
app.use(csrfErrorHandler);

// *** 404 handler
app.use((req, res, next) => {
  // const err = new Error("Not Found");
  const err = new Error();
  err.status = 404;
  next(err);
});

// *** Central error handler
app.use(require("./middleware/errorMiddleware"));

module.exports = app;
