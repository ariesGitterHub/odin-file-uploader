function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    console.log("ADMIN check = ", req.user.role);

    return res.status(403).send("Forbidden");
  }
  next();
}

// function adminLogCheck(req, res, next) {
//   if (req.user.role === "ADMIN") {
//     console.log("ADMIN check = YES!!! ", req.user.role);
//   }
//   next();
// }

// module.exports = { requireAdmin, adminLogCheck };
module.exports = { requireAdmin };

// function requireAdmin(req, res, next) {
//   console.log(">>> REQUIRE ADMIN HIT <<<");
//   console.log("user:", req.user);
//   console.log("role:", req.user?.role);

//   if (req.user?.role !== "ADMIN") {
//     console.log(">>> DENIED <<<");
//     return res.status(403).send("Forbidden");
//   }

//   console.log(">>> ADMIN ALLOWED <<<");
//   next();
// }

// module.exports = { requireAdmin };