import { afterEach, describe, expect, test } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateStaticBuild } from '../scripts/static-build-integrity';

const timestamp = 'build-123';
const temporaryDirectories: string[] = [];

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'soul-compass-static-build-'));
  temporaryDirectories.push(root);
  const output = path.join(root, 'static-build');
  const iconPath = path.join(output, timestamp, 'assets', 'assets', 'images', 'icon.png');
  fs.mkdirSync(path.dirname(iconPath), { recursive: true });
  fs.writeFileSync(iconPath, 'fixture-icon');
  for (const platform of ['ios', 'android']) {
    const bundleDirectory = path.join(output, timestamp, '_expo', 'static', 'js', platform);
    fs.mkdirSync(bundleDirectory, { recursive: true });
    fs.writeFileSync(path.join(bundleDirectory, 'bundle.js'), `// ${platform} bundle`);

    const manifest = {
      launchAsset: {
        url: `https://example.test/${timestamp}/_expo/static/js/${platform}/bundle.js`,
      },
      assets: [],
      extra: {
        expoClient: {
          iconUrl: `https://example.test/${timestamp}/assets/assets/images/icon.png`,
        },
      },
    };
    fs.mkdirSync(path.join(output, platform), { recursive: true });
    fs.writeFileSync(path.join(output, platform, 'manifest.json'), JSON.stringify(manifest));
  }
  return output;
}

function validate(output: string) {
  return validateStaticBuild({
    staticBuildDir: output,
    timestamp,
    expectedApiOrigin: undefined,
  });
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe('native static-build integrity', () => {
  test('accepts nonempty iOS and Android bundles with complete asset references', () => {
    const output = createFixture();
    const imagePath = path.join(output, timestamp, '_expo', 'static', 'js', 'assets', 'crystal.png');
    fs.mkdirSync(path.dirname(imagePath), { recursive: true });
    fs.writeFileSync(imagePath, 'fixture-image');

    for (const platform of ['ios', 'android']) {
      const manifestPath = path.join(output, platform, 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.assets.push({
        url: `https://example.test/${timestamp}/_expo/static/js/assets/crystal.png`,
      });
      fs.writeFileSync(manifestPath, JSON.stringify(manifest));

      const bundlePath = path.join(output, timestamp, '_expo', 'static', 'js', platform, 'bundle.js');
      fs.writeFileSync(
        bundlePath,
        `const asset={httpServerLocation:"https://example.test/${timestamp}/_expo/static/js/assets",hash:"abc",name:"crystal",type:"png"};`,
      );
    }

    expect(validate(output)).toBe(true);
  });

  test('accepts deployment base paths before generated build URLs', () => {
    const output = createFixture();
    for (const platform of ['ios', 'android']) {
      const manifestPath = path.join(output, platform, 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.launchAsset.url = manifest.launchAsset.url.replace(
        'https://example.test/',
        'https://example.test/native-app/',
      );
      fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    }
    expect(validate(output)).toBe(true);
  });

  test('rejects a native bundle without its configured production API origin', () => {
    const output = createFixture();
    expect(() =>
      validateStaticBuild({
        staticBuildDir: output,
        timestamp,
        expectedApiOrigin: 'https://example.test',
      }),
    ).toThrow(/does not contain the configured production API origin/);

    for (const platform of ['ios', 'android']) {
      const bundlePath = path.join(output, timestamp, '_expo', 'static', 'js', platform, 'bundle.js');
      fs.writeFileSync(bundlePath, `const apiOrigin="https://example.test";`);
    }
    expect(
      validateStaticBuild({
        staticBuildDir: output,
        timestamp,
        expectedApiOrigin: 'https://example.test',
      }),
    ).toBe(true);
  });

  test('rejects an empty or missing platform bundle', () => {
    const emptyOutput = createFixture();
    fs.writeFileSync(
      path.join(emptyOutput, timestamp, '_expo', 'static', 'js', 'ios', 'bundle.js'),
      '',
    );
    expect(() => validate(emptyOutput)).toThrow(/nonempty file/);

    const missingOutput = createFixture();
    fs.rmSync(path.join(missingOutput, timestamp, '_expo', 'static', 'js', 'android', 'bundle.js'));
    expect(() => validate(missingOutput)).toThrow(/does not resolve to a generated file/);
  });

  test('rejects a manifest icon that does not resolve to a generated file', () => {
    const output = createFixture();
    const manifestPath = path.join(output, 'ios', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.extra.expoClient.iconUrl =
      `https://example.test/${timestamp}/assets/assets/images/missing.png`;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    expect(() => validate(output)).toThrow(/Expo Go icon does not resolve to a generated file/);
  });

  test('rejects missing, traversal, and escaped asset references', () => {
    const missingOutput = createFixture();
    const iosManifestPath = path.join(missingOutput, 'ios', 'manifest.json');
    const iosManifest = JSON.parse(fs.readFileSync(iosManifestPath, 'utf8'));
    iosManifest.assets.push({
      url: `https://example.test/${timestamp}/_expo/static/js/assets/missing.png`,
    });
    fs.writeFileSync(iosManifestPath, JSON.stringify(iosManifest));
    expect(() => validate(missingOutput)).toThrow(/does not resolve to a generated file/);

    const traversalOutput = createFixture();
    const androidManifestPath = path.join(traversalOutput, 'android', 'manifest.json');
    const androidManifest = JSON.parse(fs.readFileSync(androidManifestPath, 'utf8'));
    androidManifest.assets.push({
      url: `https://example.test/${timestamp}/_expo/static/js/%2e%2e/%2e%2e/outside.png`,
    });
    fs.writeFileSync(androidManifestPath, JSON.stringify(androidManifest));
    expect(() => validate(traversalOutput)).toThrow(/unsafe path segment/);
  });

  test('rejects unsafe bundle asset paths and unexpected source maps', () => {
    const unsafeOutput = createFixture();
    fs.writeFileSync(
      path.join(unsafeOutput, timestamp, '_expo', 'static', 'js', 'ios', 'bundle.js'),
      `const asset={httpServerLocation:"https://example.test/${timestamp}/_expo/static/js/%2e%2e",hash:"abc",name:"bad",type:"png"};`,
    );
    expect(() => validate(unsafeOutput)).toThrow(/unsafe path segment/);

    const mapOutput = createFixture();
    fs.writeFileSync(path.join(mapOutput, timestamp, '_expo', 'static', 'js', 'ios', 'bundle.js.map'), '{}');
    expect(() => validate(mapOutput)).toThrow(/unexpected source map/);

    const mapReferenceOutput = createFixture();
    fs.writeFileSync(
      path.join(mapReferenceOutput, timestamp, '_expo', 'static', 'js', 'android', 'bundle.js'),
      '//# sourceMappingURL=bundle.js.map',
    );
    expect(() => validate(mapReferenceOutput)).toThrow(/source map reference/);
  });
});
