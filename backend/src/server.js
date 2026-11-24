import app from "./app.js";
import { closeDatabase, connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

await connectDatabase();

const server = app.listen(env.port, () => {
  console.info(`Billing API listening on port ${env.port}.`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    server.close(() => {
      closeDatabase().finally(() => process.exit(0));
    });
  });
}
