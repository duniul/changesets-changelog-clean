import { getInfo } from '@changesets/get-github-info';
import { NewChangesetWithCommit, VersionType } from '@changesets/types';
import { MockedFunction, describe, expect, it, vi } from 'vitest';
import changelogFunctions from '.';

vi.mock('@changesets/get-github-info');

const getGithubInfoMock = getInfo as MockedFunction<typeof getInfo>;

const { getReleaseLine, getDependencyReleaseLine } = changelogFunctions;

const getReleaseLineAndMockGithub = (
  mockData: { repo: string; user: string; pull: number; commit: string },
  changesetPart?: Partial<NewChangesetWithCommit>,
  versionType: VersionType = 'patch'
) => {
  const { repo, commit, user, pull } = mockData;
  const changeset = {
    id: 'test-changeset',
    commit,
    summary: 'Added foo bar.',
    releases: [{ name: 'pkg-a', type: 'patch' as const }],
    ...changesetPart,
  };

  getGithubInfoMock.mockResolvedValueOnce({
    user,
    pull,
    links: {
      commit: `[${commit}](https://test.test/commits/${commit})`,
      pull: `[#${pull}](https://test.test/pulls/${pull})`,
      user: `[${user}](https://test.test/users/${user})`,
    },
  });

  return getReleaseLine(changeset, versionType, { repo });
};

describe(getReleaseLine.name, () => {
  it('returns a changeset line with relevant links', async () => {
    const result = await getReleaseLineAndMockGithub({
      repo: 'test/test',
      pull: 1500,
      commit: 'c1f7a8dea1fbddde9382ead635716a8d2253a41b',
      user: 'tester',
    });

    expect(result).toMatchInlineSnapshot('"- Added foo bar. _[`#1500`](https://test.test/pulls/1500) [`c1f7a8d`](https://github.com/test/test/commit/c1f7a8dea1fbddde9382ead635716a8d2253a41b) [tester](https://test.test/users/tester)_"');
  });
});

describe(getDependencyReleaseLine.name, () => {
  it('returns a changeset line with relevant links', async () => {
    const result = await getDependencyReleaseLine(
      [
        {
          id: 'test-changeset-1',
          commit: 'bde8a2cea1fbddde9382ead635716a8d2253a41b',
          summary: 'Added foo bar.',
          releases: [{ name: 'pkg-a', type: 'patch' as const }],
        },
        {
          id: 'test-changeset-2',
          commit: 'ab36ce7ea1fbddde9382ead635716a8d2253a41b',
          summary: 'Changed another thing.',
          releases: [
            { name: 'pkg-a', type: 'patch' as const },
            { name: 'pkg-b', type: 'minor' as const },
          ],
        },
      ],
      [
        {
          name: 'pkg-a',
          newVersion: '1.0.1',
        },
        {
          name: 'pkg-b',
          newVersion: '1.1.0',
        },
      ] as any[],
      { repo: 'test/test' }
    );

    expect(result).toMatchInlineSnapshot(`
      "
      <details><summary>Updated 2 dependencies</summary>

      <small>

      [\`bde8a2c\`](https://github.com/test/test/commit/bde8a2cea1fbddde9382ead635716a8d2253a41b) [\`ab36ce7\`](https://github.com/test/test/commit/ab36ce7ea1fbddde9382ead635716a8d2253a41b)

      </small>

      - \`pkg-a@1.0.1\`
      - \`pkg-b@1.1.0\`

      </details>
      "
    `);
  });
});
