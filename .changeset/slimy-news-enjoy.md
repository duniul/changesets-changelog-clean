---
'changesets-changelog-clean': minor
---

Add `throwOnGithubError` option, which provides a way to ignore errors from being thrown when failing to fetch commit information from Github. Disabling can be useful if you want to generate a changelog for a change that hasn't been merged yet.
