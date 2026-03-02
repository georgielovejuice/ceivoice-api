import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          🎤 CeiVoice API Backend - Server Started          ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Server running on:  http://localhost:${PORT}
║  Environment:        ${process.env.NODE_ENV || "development"}
║  Auth Mode:          ${process.env.AUTH_MODE || "PRODUCTION"}
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});

export default server;