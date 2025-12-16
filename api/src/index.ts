import { createServer } from "./server.js";
import { CONFIG } from "./config.js";

const app = createServer();

app.listen(CONFIG.PORT, () => {
  console.log(`🚀 Fractal API running on port ${CONFIG.PORT}`);
});
