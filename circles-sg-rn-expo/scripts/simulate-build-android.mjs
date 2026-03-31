import {
  buildAndroidArtifact,
  buildManifest,
  loadReleaseConfig,
  parseArgs,
} from './release-utils.mjs';

const { version } = parseArgs();
const config = loadReleaseConfig();
const manifest = buildManifest(version);
const artifacts = buildAndroidArtifact(version, manifest, config);

console.log(`Generated Android artifact at ${artifacts.aarPath}`);
