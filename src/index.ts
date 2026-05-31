import process from 'node:process';
import { getInfo as getGithubInfo } from '@changesets/get-github-info';
import type { ChangelogFunctions } from '@changesets/types';

type ChangelogItemFormatOptions = {
  capitalize: boolean;
};

type GithubLinks = Awaited<ReturnType<typeof getGithubInfo>>['links'];

export type ChangelogOptions = ChangelogItemFormatOptions & {
  repo: string;
  throwOnGithubError: boolean;
};

// oxlint-disable-next-line typescript/no-explicit-any
function parseOptions(rawOptions: Record<string, any> | null): ChangelogOptions {
  const { repo, capitalize, throwOnGithubError } = rawOptions || {};

  if (!repo) {
    throw new Error(
      'Please provide a Github repo to the changelog config. Example: \n"changelog": ["changesets-changelog-clean", { "repo": "user/repo" }]'
    );
  }

  return {
    repo,
    capitalize: capitalize !== false,
    throwOnGithubError: throwOnGithubError !== false,
  };
}

function monospaceLink(markdownLink: string): string {
  // oxlint-disable-next-line unicorn/prefer-string-replace-all
  return markdownLink.replace(/^\[([^\]]+?)\]\(/g, '[`$1`](');
}

function ghCommitMarkdownLink(repo: string, commit: string): string {
  // oxlint-disable-next-line node/no-process-env
  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
  return `[${commit.slice(0, 7)}](${serverUrl}/${repo}/commit/${commit})`;
}

function formatSummary(summary: string, options: ChangelogItemFormatOptions): string {
  const { capitalize } = options;

  let formatted = summary.trim();

  if (capitalize) {
    formatted = (formatted[0] || '').toUpperCase() + formatted.slice(1);
  }

  return formatted;
}

const changelogFunctions: ChangelogFunctions = {
  getReleaseLine: async (changeset, _versionType, options) => {
    const { repo, throwOnGithubError, ...formatOptions } = parseOptions(options);
    const { commit, summary } = changeset;

    const formattedSummary = formatSummary(summary, formatOptions);
    const [firstSummaryLine, ...rest] = formattedSummary.split('\n');
    const formattedExtraLines = rest.map(line => '\t' + line).join('\n');
    const extraLinesSuffix = formattedExtraLines ? `\n\n${formattedExtraLines.trimEnd()}` : '';

    if (!commit) {
      return `- ${firstSummaryLine}${extraLinesSuffix}`;
    }

    const commitLink = ghCommitMarkdownLink(repo, commit);
    let links: Partial<GithubLinks> = { commit: commitLink };

    try {
      const ghInfo = await getGithubInfo({ repo, commit });
      links = { ...ghInfo.links, commit: commitLink };
    } catch (error) {
      if (throwOnGithubError) {
        throw error;
      }

      // oxlint-disable-next-line no-console
      console.error('Failed to get Github info for commit', commit, error);
    }

    const linksString = [monospaceLink(links.pull || ''), monospaceLink(links.commit || ''), links.user || ''].filter(Boolean).join(' ');

    return `- ${firstSummaryLine} _${linksString}_${extraLinesSuffix}`;
  },

  // oxlint-disable-next-line require-await
  getDependencyReleaseLine: async (changesets, updatedDeps, options) => {
    if (!updatedDeps.length) {
      return '';
    }

    const { repo } = parseOptions(options);

    const commitLinks = changesets.map(({ commit }) => (commit ? monospaceLink(ghCommitMarkdownLink(repo, commit)) : '')).filter(Boolean);

    const depsPlural = updatedDeps.length === 1 ? 'dependency' : 'dependencies';
    const content =
      `\n<details><summary>Updated ${updatedDeps.length} ${depsPlural}</summary>\n` +
      '\n<small>\n\n' +
      commitLinks.join(' ') +
      '\n\n</small>\n\n' +
      updatedDeps.map(({ name, newVersion }) => `- \`${name}@${newVersion}\``).join('\n') +
      '\n\n</details>\n';

    return content;
  },
};

// oxlint-disable-next-line import/no-default-export
export default changelogFunctions;
