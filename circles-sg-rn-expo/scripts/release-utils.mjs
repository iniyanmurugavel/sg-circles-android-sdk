import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const commonRepoRoot = path.resolve(scriptDir, '..');

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function removeDir(dirPath) {
  fs.rmSync(dirPath, { force: true, recursive: true });
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export function writeText(filePath, contents) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents);
}

export function copyRecursive(fromPath, toPath) {
  ensureDir(path.dirname(toPath));
  fs.cpSync(fromPath, toPath, { force: true, recursive: true });
}

export function parseArgs(argv = process.argv.slice(2)) {
  let version = '1.0.0';
  let notes = 'Circles Roaming brownfield refresh';

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--version' && argv[index + 1]) {
      version = argv[index + 1];
      index += 1;
      continue;
    }

    if (current === '--notes' && argv[index + 1]) {
      notes = argv[index + 1];
      index += 1;
    }
  }

  return { notes, version };
}

export function loadReleaseConfig() {
  return readJson(path.join(commonRepoRoot, 'release-config.json'));
}

export function loadFeatureConfig() {
  return readJson(path.join(commonRepoRoot, 'src', 'feature-config.json'));
}

export function buildManifest(version) {
  const featureConfig = loadFeatureConfig();

  return {
    ...featureConfig,
    generatedAt: new Date().toISOString(),
    sdkVersion: version,
    sourceRepo: 'circles-roaming-expo-brownfield',
  };
}

function plistFor(manifest, bundleIdentifier) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>${bundleIdentifier}</string>
  <key>CFBundleName</key>
  <string>${manifest.featureName}</string>
  <key>BrownfieldSDKVersion</key>
  <string>${manifest.sdkVersion}</string>
  <key>BrownfieldEntryRoute</key>
  <string>${manifest.entryRoute}</string>
</dict>
</plist>
`;
}

export function buildIosArtifact(version, manifest, config) {
  const artifactsRoot = path.join(commonRepoRoot, 'artifacts', 'ios', version);
  const frameworkRoot = path.join(
    artifactsRoot,
    `${config.ios.binaryName}.xcframework`
  );
  const hermesRoot = path.join(artifactsRoot, 'hermesvm.xcframework');

  removeDir(artifactsRoot);
  ensureDir(frameworkRoot);
  ensureDir(hermesRoot);

  writeText(
    path.join(frameworkRoot, 'Info.plist'),
    plistFor(manifest, config.ios.bundleIdentifier)
  );
  writeJson(path.join(frameworkRoot, 'feature-manifest.json'), manifest);
  writeText(
    path.join(hermesRoot, 'README.txt'),
    `Simulated Hermes runtime for SDK ${version}\n`
  );

  return { artifactsRoot, frameworkRoot, hermesRoot };
}

export function buildAndroidArtifact(version, manifest, config) {
  const artifactsRoot = path.join(commonRepoRoot, 'artifacts', 'android', version);
  const stagingRoot = path.join(artifactsRoot, 'staging');
  const aarPath = path.join(
    artifactsRoot,
    `${config.android.artifactId}-${version}.aar`
  );

  removeDir(artifactsRoot);
  ensureDir(path.join(stagingRoot, 'assets'));

  writeText(
    path.join(stagingRoot, 'AndroidManifest.xml'),
    `<manifest package="${config.android.package}" />\n`
  );
  writeJson(path.join(stagingRoot, 'assets', 'feature-manifest.json'), manifest);
  writeText(
    path.join(stagingRoot, 'R.txt'),
    `int string sdk_version 0x1 ${version}\n`
  );

  try {
    execFileSync('zip', ['-qry', aarPath, '.'], { cwd: stagingRoot });
  } catch (error) {
    writeText(
      aarPath,
      `Simulated AAR fallback for ${config.android.artifactId} ${version}\n`
    );
  }

  return { aarPath, artifactsRoot };
}

function renderIosPackageSwift(version, config) {
  return `// swift-tools-version: 5.10
import PackageDescription

let sdkVersion = "${version}"

let package = Package(
    name: "${config.ios.packageName}",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "${config.ios.packageName}",
            targets: ["${config.ios.packageName}"]
        )
    ],
    targets: [
        .binaryTarget(
            name: "${config.ios.binaryName}",
            path: "Binaries/\\(sdkVersion)/${config.ios.binaryName}.xcframework"
        ),
        .binaryTarget(
            name: "HermesRuntime",
            path: "Binaries/\\(sdkVersion)/hermesvm.xcframework"
        ),
        .target(
            name: "${config.ios.packageName}",
            dependencies: ["${config.ios.binaryName}", "HermesRuntime"],
            path: "Sources/${config.ios.packageName}"
        )
    ]
)
`;
}

function renderGeneratedVersionSwift(version, config) {
  return `public enum ${config.ios.packageName}Version {
    public static let current = "${version}"
}
`;
}

function renderIosConsumerPackage(version, config) {
  return `// Host app only changes the version here.
// This file is a demo snippet, not a runnable app package.
import PackageDescription

let package = Package(
    name: "NativeHostApp",
    platforms: [.iOS(.v15)],
    dependencies: [
        .package(url: "${config.ios.packageUrl}", exact: "${version}")
    ],
    targets: [
        .target(
            name: "NativeHostApp",
            dependencies: [
                .product(name: "${config.ios.packageName}", package: "${config.ios.packageIdentity}")
            ]
        )
    ]
)
`;
}

function renderIosReleaseNotes(version, manifest, notes) {
  return `# iOS SDK ${version}

- Notes: ${notes}
- Feature: ${manifest.featureName}
- Entry route: ${manifest.entryRoute}
- Screen title: ${manifest.screenTitle}
- CTA: ${manifest.primaryButtonLabel}
`;
}

function renderAndroidPom(version, manifest, config) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>${config.android.group}</groupId>
  <artifactId>${config.android.artifactId}</artifactId>
  <version>${version}</version>
  <packaging>aar</packaging>
  <name>${manifest.featureName}</name>
  <description>Simulated Circles Expo brownfield Android release</description>
</project>
`;
}

function renderMavenMetadata(versions, config) {
  const latest = versions[versions.length - 1];
  const versionsXml = versions
    .map((version) => `    <version>${version}</version>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<metadata>
  <groupId>${config.android.group}</groupId>
  <artifactId>${config.android.artifactId}</artifactId>
  <versioning>
    <latest>${latest}</latest>
    <release>${latest}</release>
    <versions>
${versionsXml}
    </versions>
  </versioning>
</metadata>
`;
}

function renderAndroidConsumerBuild(version, config) {
  return `plugins {
    id("com.android.application")
    kotlin("android")
}

repositories {
    google()
    mavenCentral()
    maven(url = uri("../maven-repo"))
}

dependencies {
    // Host app only changes the version here.
    implementation("${config.android.group}:${config.android.artifactId}:${version}")
}
`;
}

function renderAndroidHostUpdateDoc(version, config) {
  return `# Host app update

The native Android app only updates the dependency version:

\`\`\`kotlin
dependencies {
    implementation("${config.android.group}:${config.android.artifactId}:${version}")
}
\`\`\`
`;
}

function renderAndroidReleaseNotes(version, manifest, notes) {
  return `# Android SDK ${version}

- Notes: ${notes}
- Feature: ${manifest.featureName}
- Entry route: ${manifest.entryRoute}
- Screen title: ${manifest.screenTitle}
- CTA: ${manifest.primaryButtonLabel}
`;
}

export function updateIosSdkRepo(version, manifest, notes, config, artifacts) {
  const iosRepoRoot = path.resolve(commonRepoRoot, config.iosSdkRepo);
  const versionRoot = path.join(iosRepoRoot, 'Binaries', version);

  removeDir(versionRoot);
  ensureDir(versionRoot);
  copyRecursive(
    artifacts.frameworkRoot,
    path.join(versionRoot, `${config.ios.binaryName}.xcframework`)
  );
  copyRecursive(artifacts.hermesRoot, path.join(versionRoot, 'hermesvm.xcframework'));

  writeText(path.join(iosRepoRoot, 'VERSION'), `${version}\n`);
  writeText(path.join(iosRepoRoot, 'Package.swift'), renderIosPackageSwift(version, config));
  writeText(
    path.join(
      iosRepoRoot,
      'Sources',
      config.ios.packageName,
      'GeneratedVersion.swift'
    ),
    renderGeneratedVersionSwift(version, config)
  );
  writeText(
    path.join(iosRepoRoot, 'ConsumerExample', 'Package.swift'),
    renderIosConsumerPackage(version, config)
  );
  writeText(
    path.join(iosRepoRoot, 'Releases', `${version}.md`),
    renderIosReleaseNotes(version, manifest, notes)
  );
}

export function updateAndroidSdkRepo(version, manifest, notes, config, artifacts) {
  const androidRepoRoot = path.resolve(commonRepoRoot, config.androidSdkRepo);
  const artifactBase = path.join(
    androidRepoRoot,
    'maven-repo',
    ...config.android.group.split('.'),
    config.android.artifactId
  );
  const versionRoot = path.join(artifactBase, version);

  removeDir(versionRoot);
  ensureDir(versionRoot);
  copyRecursive(
    artifacts.aarPath,
    path.join(versionRoot, `${config.android.artifactId}-${version}.aar`)
  );
  writeText(
    path.join(versionRoot, `${config.android.artifactId}-${version}.pom`),
    renderAndroidPom(version, manifest, config)
  );

  const versions = fs
    .readdirSync(artifactBase, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

  writeText(path.join(androidRepoRoot, 'VERSION'), `${version}\n`);
  writeText(
    path.join(artifactBase, 'maven-metadata.xml'),
    renderMavenMetadata(versions, config)
  );
  writeText(
    path.join(androidRepoRoot, 'ConsumerExample', 'build.gradle.kts'),
    renderAndroidConsumerBuild(version, config)
  );
  writeText(
    path.join(androidRepoRoot, 'docs', 'host-app-update.md'),
    renderAndroidHostUpdateDoc(version, config)
  );
  writeText(
    path.join(androidRepoRoot, 'docs', 'releases', `${version}.md`),
    renderAndroidReleaseNotes(version, manifest, notes)
  );
}
