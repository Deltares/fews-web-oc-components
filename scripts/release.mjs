import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPaths = [
  'package.json',
  'packages/components/package.json',
  'packages/composables/package.json',
  'packages/micro-frontends/package.json',
];
const lockPath = 'package-lock.json';
const lockPackagePaths = [
  '',
  'packages/components',
  'packages/composables',
  'packages/micro-frontends',
];
const dependencyFields = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.join(root, filePath), 'utf8'));
}

function writeJson(filePath, value) {
  const absolutePath = path.join(root, filePath);
  const original = fs.readFileSync(absolutePath, 'utf8');
  const newline = original.includes('\r\n') ? '\r\n' : '\n';
  const hasTrailingNewline = original.endsWith('\n');
  const serialized = JSON.stringify(value, null, 2).replaceAll('\n', newline);
  fs.writeFileSync(absolutePath, hasTrailingNewline ? `${serialized}${newline}` : serialized);
}

function isValidVersion(version) {
  if (typeof version !== 'string') {
    return false;
  }

  const buildParts = version.split('+');
  if (buildParts.length > 2 || (buildParts.length === 2 && !isValidIdentifiers(buildParts[1], false))) {
    return false;
  }

  const versionAndPrerelease = buildParts[0];
  const prereleaseIndex = versionAndPrerelease.indexOf('-');
  const coreVersion = prereleaseIndex === -1 ? versionAndPrerelease : versionAndPrerelease.slice(0, prereleaseIndex);
  const coreParts = coreVersion.split('.');
  if (coreParts.length !== 3 || coreParts.some((part) => !/^(0|[1-9]\d*)$/.test(part))) {
    return false;
  }

  return prereleaseIndex === -1 || isValidIdentifiers(versionAndPrerelease.slice(prereleaseIndex + 1), true);
}

function isValidIdentifiers(value, prerelease) {
  return value.split('.').every((identifier) => {
    if (!/^[0-9A-Za-z-]+$/.test(identifier)) {
      return false;
    }
    return !prerelease || !/^\d+$/.test(identifier) || identifier === '0' || !identifier.startsWith('0');
  });
}

function setLocalDependencyVersions(manifest, workspaceNames, version) {
  for (const dependencyField of dependencyFields) {
    for (const dependencyName of Object.keys(manifest[dependencyField] ?? {})) {
      if (workspaceNames.has(dependencyName)) {
        manifest[dependencyField][dependencyName] = version;
      }
    }
  }
}

function setVersion(version) {
  if (!isValidVersion(version)) {
    throw new Error(`Invalid semantic version: ${version}`);
  }

  const manifests = manifestPaths.map((filePath) => [filePath, readJson(filePath)]);
  const workspaceNames = new Set(manifests.slice(1).map(([, manifest]) => manifest.name));
  for (const [filePath, manifest] of manifests) {
    manifest.version = version;
    setLocalDependencyVersions(manifest, workspaceNames, version);
    writeJson(filePath, manifest);
  }

  const lock = readJson(lockPath);
  lock.version = version;
  for (const packagePath of lockPackagePaths) {
    const entry = lock.packages[packagePath];
    if (!entry) {
      throw new Error(`Missing workspace entry in package-lock.json: ${packagePath || '<root>'}`);
    }
    entry.version = version;
    setLocalDependencyVersions(entry, workspaceNames, version);
  }
  writeJson(lockPath, lock);
}

function describeManifestVersions(manifests) {
  return manifests.map(([filePath, manifest]) => `${filePath}=${manifest.version}`).join(', ');
}

function checkLocalDependencies(filePath, manifest, workspaceNames, version) {
  for (const dependencyField of dependencyFields) {
    for (const [dependencyName, dependencyVersion] of Object.entries(manifest[dependencyField] ?? {})) {
      if (workspaceNames.has(dependencyName) && dependencyVersion !== version) {
        throw new Error(`${filePath} references ${dependencyName}@${dependencyVersion}, expected ${version}`);
      }
    }
  }
}

function checkVersion(expectedTag) {
  const manifests = manifestPaths.map((filePath) => [filePath, readJson(filePath)]);
  const versions = new Set(manifests.map(([, manifest]) => manifest.version));
  if (versions.size !== 1) {
    throw new Error(`Workspace versions do not match: ${describeManifestVersions(manifests)}`);
  }

  const version = manifests[0][1].version;
  if (!isValidVersion(version)) {
    throw new Error(`Invalid semantic version in package manifests: ${version}`);
  }
  if (expectedTag && expectedTag !== `v${version}`) {
    throw new Error(`Release tag ${expectedTag} does not match expected tag v${version}`);
  }

  const lock = readJson(lockPath);
  const lockVersions = [lock.version, ...lockPackagePaths.map((packagePath) => lock.packages[packagePath]?.version)];
  if (lockVersions.some((lockVersion) => lockVersion !== version)) {
    throw new Error(`package-lock.json versions do not all match ${version}`);
  }

  const workspaceNames = new Set(manifests.slice(1).map(([, manifest]) => manifest.name));
  const filesToCheck = [
    ...manifests,
    ...lockPackagePaths.map((packagePath) => [`package-lock.json:${packagePath || '<root>'}`, lock.packages[packagePath]]),
  ];
  for (const [filePath, manifest] of filesToCheck) {
    checkLocalDependencies(filePath, manifest, workspaceNames, version);
  }

  console.log(expectedTag
    ? `Release versions are consistent: ${version} (${expectedTag})`
    : `Release versions are consistent: ${version}`);
}

const [command, argument] = process.argv.slice(2);
try {
  if (command === 'set' && argument) {
    setVersion(argument);
    checkVersion();
  } else if (command === 'check' && process.argv.length <= 4) {
    checkVersion(argument);
  } else {
    throw new Error('Usage: node scripts/release.mjs set <version> | check [v<version>]');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}