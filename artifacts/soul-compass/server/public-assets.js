const fs = require('node:fs');
const path = require('node:path');

/** Immutable allowlist built from public build output, never from request paths.
 * Symlinks and hidden files are not public assets. */
function indexPublicAssets(root) {
  const files = new Map();
  if (!fs.existsSync(root)) return files;
  const canonicalRoot = fs.realpathSync(root);
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;
      const candidate = path.join(directory, entry.name);
      const canonical = fs.realpathSync(candidate);
      if (!canonical.startsWith(canonicalRoot + path.sep)) continue;
      if (entry.isDirectory()) visit(canonical);
      else if (entry.isFile() && !canonical.endsWith('.map')) {
        files.set('/' + path.relative(canonicalRoot, canonical).split(path.sep).join('/'), canonical);
      }
    }
  };
  visit(canonicalRoot);
  return files;
}

module.exports = { indexPublicAssets };
