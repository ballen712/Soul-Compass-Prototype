const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Keep native + web compilation inside the workspace memory limit.
// This affects build concurrency, not application behavior or networking.
config.maxWorkers = 1;

module.exports = config;
