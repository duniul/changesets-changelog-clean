//
// The assembly logic below mirrors how `@changesets/apply-release-plan` builds a
// changelog entry, so the snapshot reflects what `changeset version` would actually
// produce when using this generator:
//   - each changeset's release line is grouped by its bump type
//   - the dependency release line is appended to the patch group
//   - empty lines are filtered out before a section is rendered
//   - the finished file is tidied up
//

import { createHash } from 'node:crypto';
import { getInfo } from '@changesets/get-github-info';
import type { MockedFunction } from 'vitest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ChangelogOptions } from '../src/index';
import changelogFunctions from '../src/index';

vi.setConfig({ testTimeout: 5000 });

vi.mock(import('@changesets/get-github-info'));

const getGhInfoMock = getInfo as MockedFunction<typeof getInfo>;

const { getReleaseLine, getDependencyReleaseLine } = changelogFunctions;

type VersionType = 'major' | 'minor' | 'patch';
type GithubInfo = Awaited<ReturnType<typeof getInfo>>;

type ExampleChangeset = {
  type: VersionType;
  summary: string;
  commit: string;
};

type DepUpdate = {
  name: string;
  type: VersionType;
  oldVersion: string;
  newVersion: string;
  commit: string;
};

type Release = {
  changesets: ExampleChangeset[];
  deps: DepUpdate[];
};

type VersionedRelease = Release & {
  version: string;
};

// Mocked Github info keyed by commit, so the mock doesn't depend on call order.
const githubInfoByCommit = new Map<string, GithubInfo>();

function exampleCommit(prefix: string, count: number): string {
  return createHash('sha1')
    .update(prefix + count)
    .digest('hex');
}

function bumpSemver(version: string, versionType: VersionType): string {
  const [major, minor, patch] = version.split('.').map(Number);
  switch (versionType) {
    case 'major': {
      return `${(major || 0) + 1}.0.0`;
    }
    case 'minor': {
      return `${major}.${(minor || 0) + 1}.0`;
    }
    case 'patch': {
      return `${major}.${minor}.${(patch || 0) + 1}`;
    }
    default: {
      throw new Error(`Invalid version type: ${versionType}`);
    }
  }
}

// oxlint-disable-next-line vitest/require-hook
let changesetCount = 0;
const exampleUsers = ['JustAnExample', 'exampleguy', 'anothaone', 'somegal'];
function ch(type: VersionType, summary: string): ExampleChangeset {
  const commit = exampleCommit('commit', changesetCount);
  const user = exampleUsers[changesetCount % exampleUsers.length];
  const pull = changesetCount + 101;

  changesetCount++;

  if (!user) {
    throw new Error('User is undefined');
  }

  githubInfoByCommit.set(commit, {
    user,
    pull,
    links: {
      commit: `[${commit.slice(0, 7)}](this-is-just-an-example)`,
      pull: `[#${pull}](this-is-just-an-example)`,
      user: `[@${user}](this-is-just-an-example)`,
    },
  });

  return { type, summary, commit };
}

// oxlint-disable-next-line vitest/require-hook
let depCount = 0;
const depVersions: Record<string, string> = {};
function dep(name: string, type: VersionType): DepUpdate {
  const oldVersion = depVersions[name] || '1.0.0';
  const newVersion = bumpSemver(oldVersion, type);
  const commit = exampleCommit('dep', depCount);

  depVersions[name] = newVersion;
  depCount++;

  return { name, type, oldVersion, newVersion, commit };
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
    deps: [],
  },
  {
    changesets: [
      ch('patch', 'Fix bug with `omit` function returning incorrect keys'),
      ch('minor', 'Add support for partial application of `compose` function'),
      ch('patch', 'Improve typings for `reduce` function'),
    ],
    deps: [dep('@example/core', 'minor')],
  },
  {
    changesets: [ch('patch', 'Fix incorrect typings for `pick` function')],
    deps: [dep('@example/core', 'minor'), dep('@example/extras', 'patch')],
  },
  {
    changesets: [
      ch('patch', 'Fix bug with `uniq` function not removing duplicates'),
      ch('minor', 'Add new `memoize` function for caching function results'),
      ch('patch', 'Improve performance of `flatMap` function'),
    ],
    deps: [],
  },
  {
    changesets: [ch('minor', 'Add new `zip` function for zipping arrays')],
    deps: [],
  },
  {
    changesets: [],
    deps: [dep('@example/core', 'minor'), dep('@example/extras', 'patch'), dep('@example/date', 'patch')],
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
    deps: [dep('@example/core', 'minor')],
  },
  {
    changesets: [ch('minor', 'Add new `keyBy` function for creating object maps')],
    deps: [],
  },
  {
    changesets: [
      ch('patch', 'Fix incorrect typings for `shuffle` function'),
      ch('patch', 'Fix bug with `range` function returning incorrect range'),
    ],
    deps: [dep('@example/core', 'minor'), dep('@example/extras', 'patch')],
  },
];

function getMaxVersionType(changesets: ExampleChangeset[]): VersionType {
  const typeValue = { major: 3, minor: 2, patch: 1 } as const;
  return changesets.reduce((maxType: VersionType, { type }) => (typeValue[type] < typeValue[maxType] ? maxType : type), 'patch');
}

function versionReleases(rawReleases: Release[]): VersionedRelease[] {
  let prevVersion = '';

  return rawReleases.map(release => {
    const maxVersionType = getMaxVersionType(release.changesets);
    const version = prevVersion ? bumpSemver(prevVersion, maxVersionType) : '1.0.0';
    prevVersion = version;

    return { ...release, version };
  });
}

// Mirrors `generateChangesForVersionTypeMarkdown` in `@changesets/apply-release-plan`.
async function versionTypeSection(type: VersionType, lines: Promise<string>[]): Promise<string | undefined> {
  const resolvedLines = await Promise.all(lines);
  const releaseLines = resolvedLines.filter(Boolean);

  if (!releaseLines.length) {
    return undefined;
  }

  const heading = type.charAt(0).toUpperCase() + type.slice(1);
  return `### ${heading} Changes\n\n${releaseLines.join('\n')}\n`;
}

// Mirrors `getChangelogEntry` in `@changesets/apply-release-plan`.
async function releaseToEntry(release: VersionedRelease, options: ChangelogOptions): Promise<string> {
  const { version, changesets, deps } = release;

  const changelogLines: Record<VersionType, Promise<string>[]> = { major: [], minor: [], patch: [] };

  for (const changeset of changesets) {
    // oxlint-disable-next-line typescript/no-explicit-any
    changelogLines[changeset.type].push(getReleaseLine(changeset as any, changeset.type, options));
  }

  // oxlint-disable-next-line typescript/no-explicit-any
  changelogLines.patch.push(getDependencyReleaseLine(deps as any, deps as any, options));

  const sections = await Promise.all([
    versionTypeSection('major', changelogLines.major),
    versionTypeSection('minor', changelogLines.minor),
    versionTypeSection('patch', changelogLines.patch),
  ]);

  return [`## ${version}`, ...sections].filter(Boolean).join('\n');
}

function tidyChangelog(markdown: string): string {
  return (
    markdown
      // Ensure a blank line directly after a heading (e.g. between `## x` and `### y`).
      .replaceAll(/^(#{1,6} .*)\n(?!\n)/gm, '$1\n\n')
      // Collapse runs of blank lines into a single blank line.
      .replaceAll(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  );
}

async function generate(options: ChangelogOptions): Promise<string> {
  const releases = versionReleases(exampleReleaseItems);
  const entries = await Promise.all(releases.map(release => releaseToEntry(release, options)));

  // New versions are prepended, so the most recent release ends up at the top.
  const changelog = `# changesets-changelog-clean\n\n${entries.toReversed().join('\n\n')}`;

  return tidyChangelog(changelog);
}

describe('generates existing', () => {
  beforeAll(() => {
    getGhInfoMock.mockImplementation(({ commit }) => {
      const info = githubInfoByCommit.get(commit);

      if (!info) {
        throw new Error(`No mocked Github info for commit ${commit}`);
      }

      return Promise.resolve(info);
    });
  });

  it('generates the existing changelog', async () => {
    expect.hasAssertions();

    const result = await generate({
      repo: 'test/test',
      capitalize: false,
      throwOnGithubError: false,
    });

    await expect(result).toMatchFileSnapshot('./__snapshots__/changelog.test.ts.github.snap.md');
  });
});
