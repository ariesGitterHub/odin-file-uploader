if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const app = require("./app");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`👂 Listening on port ${PORT}`);
});

// Graceful shutdown (important for Render restarts)
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => process.exit(0));
});

server.on("error", (err) => {
  console.error("Server error:", err);
});
