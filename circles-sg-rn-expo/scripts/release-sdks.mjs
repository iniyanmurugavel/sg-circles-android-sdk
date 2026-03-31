import {
  buildAndroidArtifact,
  buildIosArtifact,
  buildManifest,
  loadReleaseConfig,
  parseArgs,
  updateAndroidSdkRepo,
  updateIosSdkRepo,
} from './release-utils.mjs';

const { notes, version } = parseArgs();
const config = loadReleaseConfig();
const manifest = buildManifest(version);
const iosArtifacts = buildIosArtifact(version, manifest, config);
const androidArtifacts = buildAndroidArtifact(version, manifest, config);

updateIosSdkRepo(version, manifest, notes, config, iosArtifacts);
updateAndroidSdkRepo(version, manifest, notes, config, androidArtifacts);

console.log(`Released SDK version ${version}`);
console.log(`- iOS repo updated: ${config.iosSdkRepo}`);
console.log(`- Android repo updated: ${config.androidSdkRepo}`);
