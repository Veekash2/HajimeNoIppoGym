const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

// Stub @opentelemetry/api — supabase-js v2.100+ optionally imports it
// but Metro can't handle dynamic optional imports, so we resolve to a no-op.
const stubPath = path.resolve(__dirname, 'stubs/opentelemetry-api.js');

const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@opentelemetry/api') {
    return { filePath: stubPath, type: 'sourceFile' };
  }
  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
