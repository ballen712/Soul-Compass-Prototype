const fs = require('fs');
const path = require('path');

const PLATFORMS = ['ios', 'android'];
const ASSET_PATTERN =
  /httpServerLocation:"([^"]+)"[^}]*hash:"([^"]+)"[^}]*name:"([^"]+)"[^}]*type:"([^"]+)"/g;

function fail(message) {
  throw new Error(`Static build integrity check failed: ${message}`);
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function resolveReference(staticBuildDir, timestamp, reference, description) {
  const rawUrlMatch = reference.match(/^https?:\/\/[^/?#]*(\/[^?#]*)?$/i);
  if (!rawUrlMatch) {
    fail(`${description} is not a valid URL: ${reference}`);
  }

  let url;
  try {
    url = new URL(reference);
  } catch {
    fail(`${description} is not a valid URL: ${reference}`);
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    fail(`${description} uses an unsupported URL scheme: ${url.protocol}`);
  }
  if (url.search || url.hash) {
    fail(`${description} must not include a query string or fragment`);
  }

  const rawPathname = rawUrlMatch[1] || '/';
  const encodedSegments = rawPathname.split('/');
  if (encodedSegments[0] !== '') {
    fail(`${description} must use an absolute URL path`);
  }

  const segments = encodedSegments.slice(1).map((segment) => {
    let decoded;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      fail(`${description} contains malformed URL encoding`);
    }

    if (
      !decoded ||
      decoded === '.' ||
      decoded === '..' ||
      decoded.includes('/') ||
      decoded.includes('\\') ||
      /[\0-\x1f\x7f]/.test(decoded)
    ) {
      fail(`${description} contains an unsafe path segment`);
    }
    return decoded;
  });

  const timestampIndex = segments.indexOf(timestamp);
  if (timestampIndex < 0 || segments.indexOf(timestamp, timestampIndex + 1) !== -1) {
    fail(`${description} does not point into build ${timestamp}`);
  }

  // A deployment BASE_PATH may precede the build timestamp in the public URL.
  const outputSegments = segments.slice(timestampIndex);
  const resolved = path.resolve(staticBuildDir, ...outputSegments);
  if (!isInside(staticBuildDir, resolved)) {
    fail(`${description} resolves outside the generated output`);
  }

  let realOutput;
  let realFile;
  try {
    realOutput = fs.realpathSync(staticBuildDir);
    realFile = fs.realpathSync(resolved);
  } catch {
    fail(`${description} does not resolve to a generated file: ${url.pathname}`);
  }
  if (!isInside(realOutput, realFile)) {
    fail(`${description} resolves outside the generated output`);
  }

  let stat;
  try {
    stat = fs.statSync(realFile);
  } catch {
    fail(`${description} does not exist: ${url.pathname}`);
  }
  if (!stat.isFile() || stat.size === 0) {
    fail(`${description} is not a nonempty file: ${url.pathname}`);
  }

  return resolved;
}

function assertNoSourceMaps(staticBuildDir) {
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        fail(`generated output contains a symbolic link: ${path.relative(staticBuildDir, entryPath)}`);
      }
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (entry.isFile() && /\.map$/i.test(entry.name)) {
        fail(`unexpected source map: ${path.relative(staticBuildDir, entryPath)}`);
      }
    }
  };

  visit(staticBuildDir);
}

function validatePlatform(staticBuildDir, timestamp, platform) {
  const manifestPath = path.join(staticBuildDir, platform, 'manifest.json');
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    fail(`cannot read ${platform} manifest: ${error.message}`);
  }

  if (!manifest || !manifest.launchAsset || typeof manifest.launchAsset.url !== 'string' || !manifest.launchAsset.url.trim()) {
    fail(`${platform} manifest has no launch asset URL`);
  }

  const launchAssetPath = resolveReference(
    staticBuildDir,
    timestamp,
    manifest.launchAsset.url,
    `${platform} launch bundle`,
  );
  const expectedBundle = path.resolve(
    staticBuildDir,
    timestamp,
    '_expo',
    'static',
    'js',
    platform,
    'bundle.js',
  );
  if (launchAssetPath !== expectedBundle) {
    fail(`${platform} launch asset does not reference its generated bundle`);
  }

  const bundle = fs.readFileSync(launchAssetPath, 'utf8');
  if (/sourceMappingURL\s*=/i.test(bundle)) {
    fail(`${platform} bundle contains a source map reference`);
  }

  if (manifest.assets !== undefined && !Array.isArray(manifest.assets)) {
    fail(`${platform} manifest assets must be an array`);
  }
  for (const [index, asset] of (manifest.assets || []).entries()) {
    if (!asset || typeof asset.url !== 'string' || !asset.url.trim()) {
      fail(`${platform} manifest asset ${index} has no URL`);
    }
    resolveReference(
      staticBuildDir,
      timestamp,
      asset.url,
      `${platform} manifest asset ${index}`,
    );
  }

  for (const match of bundle.matchAll(ASSET_PATTERN)) {
    const [, location, , name, type] = match;
    const filename = `${name}.${type}`;
    if (
      !name ||
      !type ||
      name === '.' ||
      name === '..' ||
      /[\\/]/.test(name) ||
      /[\\/]/.test(type) ||
      /[\0-\x1f\x7f]/.test(filename)
    ) {
      fail(`${platform} bundle contains an unsafe asset filename`);
    }

    let assetUrl;
    try {
      assetUrl = `${location.replace(/\/+$/, '')}/${encodeURIComponent(filename)}`;
    } catch {
      fail(`${platform} bundle contains an invalid asset location: ${location}`);
    }
    resolveReference(
      staticBuildDir,
      timestamp,
      assetUrl,
      `${platform} bundled asset ${filename}`,
    );
  }
}

function validateStaticBuild({ staticBuildDir, timestamp }) {
  if (!staticBuildDir || !timestamp) {
    throw new TypeError('staticBuildDir and timestamp are required');
  }
  const outputDir = path.resolve(staticBuildDir);
  if (!fs.existsSync(outputDir) || !fs.statSync(outputDir).isDirectory()) {
    fail(`generated output directory does not exist: ${outputDir}`);
  }

  assertNoSourceMaps(outputDir);
  for (const platform of PLATFORMS) {
    validatePlatform(outputDir, timestamp, platform);
  }
  return true;
}

module.exports = { validateStaticBuild };
