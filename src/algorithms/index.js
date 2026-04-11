const { tokenBucket } = require('./tokenBucket');

const ALGORITHMS = {
  token_bucket: tokenBucket,
};

async function runAlgorithm({ algorithm = 'token_bucket', key, limit, windowSeconds }) {
  const fn = ALGORITHMS[algorithm];
  if (!fn) throw new Error(`Unknown algorithm: ${algorithm}`);
  return fn({ key, limit, windowSeconds });
}

module.exports = { runAlgorithm };
