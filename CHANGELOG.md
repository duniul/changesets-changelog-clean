# changesets-changelog-clean

## 1.4.0

### Minor Changes

- Add support for Github Enterprise commits via `GITHUB_SERVER_URL`. _[`e4777e1`](https://github.com/duniul/changesets-changelog-clean/commit/e4777e130d15de04bb58881ac19e6e0c5a39647d) [@duniul](https://github.com/duniul)_

### Patch Changes

- Add bullet and fix indentation for changesets without a commit. _[`2654763`](https://github.com/duniul/changesets-changelog-clean/commit/2654763160d04acbd94865309558936fff5ea479) [@duniul](https://github.com/duniul)_
- Type `capitalize` and `throwOnGithubError` as optional. _[`5211161`](https://github.com/duniul/changesets-changelog-clean/commit/52111615d47159a77c406d9854af10f054ac3089) [@duniul](https://github.com/duniul)_
- Update `changesets` sub-dependencies. _[`da616f5`](https://github.com/duniul/changesets-changelog-clean/commit/da616f55b3cf2c926441feb2fde288f587c71b03) [@duniul](https://github.com/duniul)_

## 1.3.0

### Minor Changes

- Export both CJS and ESM builds. _[`#4`](https://github.com/duniul/changesets-changelog-clean/pull/4) [`f55b9af`](https://github.com/duniul/changesets-changelog-clean/commit/f55b9af2df0753e0660c3a61018c353b4fb3a610) [@duniul](https://github.com/duniul)_

### Patch Changes

- Ensure commits get shortened to seven characters in displayed markdown. _[`#5`](https://github.com/duniul/changesets-changelog-clean/pull/5) [`305a4c7`](https://github.com/duniul/changesets-changelog-clean/commit/305a4c76fc5a6faf9ad10d2f03fc16d2af4d89a6) [@duniul](https://github.com/duniul)_

## 1.2.1

### Patch Changes

- Skip updated dependencies summary if there are no updates. _[`1f2201e`](https://github.com/duniul/changesets-changelog-clean/commit/1f2201e6b357069a92831a7596b6da2f478586be) [@duniul](https://github.com/duniul)_

## 1.2.0

### Minor Changes

- Add `throwOnGithubError` option, which provides a way to ignore errors from being thrown when failing to fetch commit information from Github. Disabling can be useful if you want to generate a changelog for a change that hasn't been merged yet. _[`0b662ca`](https://github.com/duniul/changesets-changelog-clean/commit/0b662ca953eb4bf807465f828719bf45ee7c1b59) [@duniul](https://github.com/duniul)_

### Patch Changes

- Properly indent lines for multi-line changesets. _[`c5157bd`](https://github.com/duniul/changesets-changelog-clean/commit/c5157bd32a9f48f65da4a8f55b63afc14e493aa4) [@duniul](https://github.com/duniul)_

## 1.1.0

### Minor Changes

- Use one-line summaries. _[`5583bf2`](https://github.com/duniul/changesets-changelog-clean/commit/5583bf2fcd12e3d4747b1a51fd1d7823debe1a9f)
  [@duniul](https://github.com/duniul)_

### Patch Changes

- Remove `preinstall` script that only allowed installation via pnpm.
  _[`41c5509`](https://github.com/duniul/changesets-changelog-clean/commit/41c55092722ab1c6d08ffccbe70a1836c8bbcb50)
  [@duniul](https://github.com/duniul)_
