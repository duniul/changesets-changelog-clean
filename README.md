# changesets-changelog-clean

[![npm](https://img.shields.io/npm/v/sort-jsonc.svg)](https://www.npmjs.com/package/changesets-changelog-clean)

A clean changelog entry generator with Github support for [changesets](https://github.com/changesets/changesets). 📝

_Drop-in replacement for `@changests/changelog-github`._

## Usage

```js
// .changeset/config.json

{
  "changelog": ["changesets-changelog-clean", { "repo": "repo-scope/repo-name" }]
  // ...rest of the config
}
```

## Installation

```sh
npm install changesets-changelog-clean
# or
pnpm add changesets-changelog-clean
# or
yarn add changesets-changelog-clean
```

## Examples

To see examples of generated changelogs, have a look at:

- [examples/example-changelog.md](./examples/example-changelog.md): A changelog generated with the default options.
- [examples/example-changelog-inline.md](./examples/example-changelog-inline.md): A changelog generated with `inline: true`.

## Options

The options should be passed as the second argument in the array passed to the `changelog` key in the `changeset` config.

```js
  "changelog": ["changesets-changelog-clean", { /* options */ }]
```

- `repo`: The Github repo (including scope, like user or org) to link and look up PRs in (like `repo-scope/repo-name`).  
  Required.
- `inline`: Whether to generate the changelog inline, or with a link to the PR. See [this file](./examples/example-changelog-inline.md) for
  an example of the output.  
  Default: `false`.
- `capitalize`: Whether to capitalize the first letter of the summary.  
  Default: `true`.

## Motivation

The default `@changests/changelog-github` generator is great, but it can be a bit hard to read.

- It puts the PR and author name in front of the summary, so the summaries don't start on the same column.
- It adds extra text, like the _Thanks X_, cluttering up the changelog.

I wanted a changelog generator that included the same type of links and information, but in a cleaner format.
