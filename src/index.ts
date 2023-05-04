import { getInfo as getGithubInfo } from '@changesets/get-github-info';
import { ChangelogFunctions } from '@changesets/types';

type ChangelogItemFormatOptions = {
  capitalize?: boolean;
};

export type ChangelogOptions = ChangelogItemFormatOptions & {
  repo: string;
  inlineLinks?: boolean;
};

function parseOptions(rawOptions: Record<string, any> | null): ChangelogOptions {
  const { repo, inlineLinks, capitalize } = rawOptions || {};

  if (!repo) {
    throw new Error(
      'Please provide a Github repo to the changelog config. Example: \n"changelog": ["changesets-changelog-clean", { "repo": "user/repo" }]'
    );
  }

  return {
    repo,
    capitalize: capitalize !== false,
    inlineLinks,
  };
}

function monospaceLink(markdownLink: string): string {
  return markdownLink.replace(/^\[([^\]]+?)\]\(/g, '[`$1`](');
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
    const { repo, inlineLinks, ...formatOptinos } = parseOptions(options);
    const { commit, summary } = changeset;

    const formattedSummary = formatSummary(summary, formatOptinos);

    if (!commit) {
      return formattedSummary;
    }

    const { links } = await getGithubInfo({ repo, commit });

    if (inlineLinks) {
      const linksString = [monospaceLink(links.pull || ''), monospaceLink(links.commit || ''), links.user || ''].filter(Boolean).join(' ');
      const [firstSummaryLine, ...remainingSummary] = formattedSummary.split('\n');
      return `- ${firstSummaryLine} _${linksString}_${remainingSummary.length ? `\n\n${remainingSummary.join('\n').trim()}` : ''}`;
    } else {
      const parts = [];

      if (links.pull) {
        parts.push(`PR: ${monospaceLink(links.pull)}`);
      }

      if (links.commit) {
        parts.push(`Commit: ${monospaceLink(links.commit)}`);
      }

      if (links.user) {
        parts.push(`Author: ${links.user}`);
      }

      return `- ${formattedSummary}  \n<sup>${parts.join(' | ')}</sup>`;
    }
  },

  getDependencyReleaseLine: async (changesets, updatedDeps, options) => {
    const { repo } = parseOptions(options);

    const commitLinks = changesets
      .map(({ commit }) => (commit ? `[\`${commit.slice(0, 7)}\`](https://github.com/${repo}/commit/${commit})` : ''))
      .filter(Boolean);

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
