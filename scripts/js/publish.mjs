#!/usr/bin/env zx
import 'zx/globals';
import { cliArguments, workingDirectory } from '../utils.mjs';

const [level, folder, tag = 'latest'] = cliArguments();
if (!level) {
  throw new Error('A version level — e.g. "path" — must be provided.');
}

// Go to the client directory and install the dependencies.
cd(path.join(workingDirectory, folder));
await $`pnpm install`;

// Update the version.
const versionArgs = [
  '--no-git-tag-version',
  ...(level.startsWith('pre') ? [`--preid ${tag}`] : []),
];
let { stdout } = await $`pnpm version ${level} ${versionArgs}`;
const newVersion = stdout.slice(1).trim();

// Expose the new version to CI if needed.
if (process.env.CI) {
  await $`echo "new_version=${newVersion}" >> $GITHUB_OUTPUT`;
}

// Publish the package.
// This will also build the package before publishing (see prepublishOnly script).
await $`pnpm publish --no-git-checks --tag ${tag}`;

// Commit the new version.
await $`git commit -am "Publish ${folder} JS client v${newVersion}"`;

// Tag the new version.
await $`git tag -a ${folder}-js@v${newVersion} -m "${folder} JS client v${newVersion}"`;
