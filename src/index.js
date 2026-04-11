require('dotenv').config();
const app = require('./app');
const { connectRedis } = require('./config/redis');
const { connectDB } = require('./config/database');

const PORT = process.env.PORT || 3000;

async function start() {
  await connectRedis();
  await connectDB();

  app.listen(PORT, () => {
    console.log(`RLaaS running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
