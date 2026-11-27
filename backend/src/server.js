import app from "./app.js";
import { closeDatabase, connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

await connectDatabase();

const onListening = () => {
  console.log(`Backend server is running on port ${env.port}.`);
};

const server = env.isDesktop
  ? app.listen(env.port, "127.0.0.1", onListening)
  : app.listen(env.port, onListening);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    server.close(() => {
      closeDatabase().finally(() => process.exit(0));
    });
  });
}
