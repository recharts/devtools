## How to release a new version

1. Merge the PR with the new features or bug fixes into the `main` branch.
2. Observe that the CI build passes successfully on the `main` branch after the merge.
3. `npm version patch` (or `minor`/`major` depending on the type of changes) to update the version number in `package.json`.
4. `git push --follow-tags` to push the commit and the new tag to the remote repository.
5. The CI/CD pipeline will automatically trigger a release process, which includes building the package, running tests, and publishing the new version to npm.
6. Verify that the new version is published on npm by checking the package page or running `npm view @recharts/devtools version`.
