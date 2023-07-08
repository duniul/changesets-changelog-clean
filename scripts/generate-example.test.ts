/**
 * Run this file with vitest to generate the example changelog as a snapshot.
 */

import { getInfo } from '@changesets/get-github-info';
import { ComprehensiveRelease } from '@changesets/types';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { MockedFunction, expect, it, vi } from 'vitest';
import changelogFunctions, { ChangelogOptions } from '../src/index';

vi.mock('@changesets/get-github-info');

const getGhInfoMock = getInfo as MockedFunction<typeof getInfo>;

const { getReleaseLine, getDependencyReleaseLine } = changelogFunctions;

type VersionType = 'major' | 'minor' | 'patch';

type ExampleChangeset = {
  type: VersionType;
  summary: string;
  commit: string;
  pull: number;
  user: string;
};

type UpdatedDependency = Omit<ComprehensiveRelease, 'changesets'>;

type Release = {
  changesets: ExampleChangeset[];
  updatedDeps: UpdatedDependency[];
};

type VersionedRelease = Release & {
  version: string;
  maxVersionType: VersionType;
};

function bumpSemver(version: string, versionType: VersionType) {
  const [major, minor, patch] = version.split('.').map(Number);
  switch (versionType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
  }
}

let exampleCount = 0;
const exampleUsers = ['JustAnExample', 'exampleguy', 'anothaone', 'somegal'];
function ch(type: VersionType, summary: string) {
  const commit = createHash('sha1')
    .update('commit' + exampleCount)
    .digest('hex');

  const user = exampleUsers[exampleCount % exampleUsers.length];

  exampleCount++;

  return { type, summary, commit, pull: exampleCount + 100, user };
}

const depVersions: Record<string, string> = {};
function dep(name: string, type: VersionType) {
  const oldVersion = depVersions[name] || '1.0.0';
  const newVersion = bumpSemver(oldVersion, type);
  depVersions[name] = newVersion;
  return { name, type, newVersion, oldVersion };
}

const exampleReleaseItems: Release[] = [
  {
    changesets: [
      ch('patch', 'Add support for TypeScript v5'),
      ch('patch', 'Fix incorrect typing for `map` function'),
      ch('patch', 'Improve performance of `filter` function'),
      ch('patch', 'Fix `find` function returning wrong item'),
      ch('minor', 'Add new `merge` function for merging objects'),
    ],
    updatedDeps: [],
  },
  {
    changesets: [
      ch('patch', 'Fix bug with `omit` function returning incorrect keys'),
      ch('minor', 'Add support for partial application of `compose` function'),
      ch('patch', 'Improve typings for `reduce` function'),
    ],
    updatedDeps: [dep('@example/core', 'minor')],
  },
  {
    changesets: [ch('patch', 'Fix incorrect typings for `pick` function')],
    updatedDeps: [dep('@example/core', 'minor'), dep('@example/extras', 'patch')],
  },
  {
    changesets: [
      ch('patch', 'Fix bug with `uniq` function not removing duplicates'),
      ch('minor', 'Add new `memoize` function for caching function results'),
      ch('patch', 'Improve performance of `flatMap` function'),
    ],
    updatedDeps: [],
  },
  {
    changesets: [ch('minor', 'Add new `zip` function for zipping arrays')],
    updatedDeps: [],
  },
  {
    changesets: [],
    updatedDeps: [dep('@example/core', 'minor'), dep('@example/extras', 'patch'), dep('@example/date', 'patch')],
  },
  {
    changesets: [
      ch('major', '**BREAKING CHANGE**: Remove all deprecated functions'),
      ch('major', '**BREAKING CHANGE**: Drop support for Node 12'),
      ch('minor', 'Add new `pipe` function for composing functions'),
      ch('patch', 'Fix bug with `chunk` function returning incorrect chunks'),
      ch('patch', 'Fix bug with `flatten` function not flattening deeply nested arrays'),
      ch('patch', 'Improve typings for `groupBy` function'),
    ],
    updatedDeps: [dep('@example/core', 'minor')],
  },
  {
    changesets: [ch('minor', 'Add new `keyBy` function for creating object maps')],
    updatedDeps: [],
  },
  {
    changesets: [
      ch('patch', 'Fix incorrect typings for `shuffle` function'),
      ch('patch', 'Fix bug with `range` function returning incorrect range'),
    ],
    updatedDeps: [dep('@example/core', 'minor'), dep('@example/extras', 'patch')],
  },
];

function getMaxVersionType(changesets: ExampleChangeset[]) {
  const typeValue = { major: 3, minor: 2, patch: 1 } as const;
  return changesets.reduce((maxType: VersionType, { type }) => (typeValue[type] < typeValue[maxType] ? maxType : type), 'patch');
}

function splitByVersionType(changesets: ExampleChangeset[]) {
  const versions: Record<VersionType, ExampleChangeset[]> = {
    major: [],
    minor: [],
    patch: [],
  };

  changesets.forEach(changeset => {
    versions[changeset.type].push(changeset);
  });

  return versions;
}

async function summaryToMarkdown(changeset: ExampleChangeset, options: ChangelogOptions): Promise<ExampleChangeset> {
  const { summary, type, user, pull, commit } = changeset;
  getGhInfoMock.mockResolvedValueOnce({
    user,
    pull,
    links: {
      commit: `[${commit.slice(0, 7)}](this-is-just-an-example)`,
      pull: `[#${pull}](this-is-just-an-example)`,
      user: `[@${user}](this-is-just-an-example)`,
    },
  });

  const mdSummary = await getReleaseLine({ summary, commit } as any, type, options);
  return { ...changeset, summary: mdSummary };
}

async function releaseToMarkdown(release: VersionedRelease, options: ChangelogOptions) {
  const { version, changesets, updatedDeps } = release;
  const mdChangesets = (await Promise.all(changesets.map(c => summaryToMarkdown(c, options)))).reverse();
  const mdDeps = updatedDeps.length ? await getDependencyReleaseLine(changesets as any, updatedDeps as any, options) : '';
  const { major, minor, patch } = splitByVersionType(mdChangesets);

  const majorLines = major.length ? `### Major Changes\n\n${major.map(({ summary }) => summary).join('\n')}` : '';
  const minorLines = minor.length ? `### Minor Changes\n\n${minor.map(({ summary }) => summary).join('\n')}` : '';
  const patchLines =
    patch.length || updatedDeps.length
      ? `### Patch Changes\n\n${patch.map(({ summary }) => summary).join('\n')}${mdDeps ? '\n' + mdDeps : ''}`
      : '';

  return `## ${version}\n\n` + [majorLines, minorLines, patchLines].filter(Boolean).join('\n\n');
}

function versionReleases(rawReleases: Release[]) {
  let prevVersion = '';
  const releasesWithVersionType = rawReleases.map(release => {
    const { changesets } = release;
    const maxVersionType = getMaxVersionType(changesets);
    const version = !prevVersion ? '1.0.0' : bumpSemver(prevVersion, maxVersionType);
    prevVersion = version;

    return { ...release, maxVersionType, version };
  });

  return releasesWithVersionType;
}

async function generate(options: ChangelogOptions) {
  const releases = versionReleases(exampleReleaseItems);
  const markdownGroups = (await Promise.all(releases.map(release => releaseToMarkdown(release, options)))).reverse();
  return markdownGroups.join('\n\n');
}

it('generates the example changelog', async () => {
  await fs.promises.writeFile('./examples/example-changelog.md', await generate({ repo: 'example/repo' }));
  expect(true).toBe(true);
});
