import { buildIosArtifact, buildManifest, loadReleaseConfig, parseArgs } from './release-utils.mjs';

const { version } = parseArgs();
const config = loadReleaseConfig();
const manifest = buildManifest(version);
const artifacts = buildIosArtifact(version, manifest, config);

console.log(`Generated iOS artifacts in ${artifacts.artifactsRoot}`);
