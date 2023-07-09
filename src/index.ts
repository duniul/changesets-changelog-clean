import { getInfo as getGithubInfo } from '@changesets/get-github-info';
import { ChangelogFunctions } from '@changesets/types';

type ChangelogItemFormatOptions = {
  capitalize: boolean;
};

type GithubLinks = Awaited<ReturnType<typeof getGithubInfo>>['links'];

export type ChangelogOptions = ChangelogItemFormatOptions & {
  repo: string;
  throwOnGithubError: boolean;
};

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
  return markdownLink.replace(/^\[([^\]]+?)\]\(/g, '[`$1`](');
}

function ghCommitMarkdownLink(repo: string, commit: string): string {
  return `[${commit.slice(0, 7)}](https://github.com/${repo}/commit/${commit})`;
}

function formatSummary(summary: string, options: ChangelogItemFormatOptions) {
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

    if (!commit) {
      return formattedSummary;
    }

    let links: Partial<GithubLinks> = {};

    try {
      const ghInfo = await getGithubInfo({ repo, commit });
      links = ghInfo.links;
    } catch (error) {
      if (throwOnGithubError) {
        throw error;
      } else {
        console.error('Failed to get Github info for commit', commit, error);
        links = { commit: ghCommitMarkdownLink(repo, commit) };
      }
    }

    const linksString = [monospaceLink(links.pull || ''), monospaceLink(links.commit || ''), links.user || ''].filter(Boolean).join(' ');
    const [firstSummaryLine, ...remainingSummary] = formattedSummary.split('\n');
    return `- ${firstSummaryLine} _${linksString}_${remainingSummary.length ? `\n\n${remainingSummary.join('\n').trim()}` : ''}`;
  },

  getDependencyReleaseLine: async (changesets, updatedDeps, options) => {
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

export default changelogFunctions;
