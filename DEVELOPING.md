## How to release a new version

1. Merge the PR with the new features or bug fixes into the `main` branch.
2. Observe that the CI build passes successfully on the `main` branch after the merge.
2. Update the version number in `package.json` according to semantic versioning (e.g., patch, minor, major).
3. Run `npm run release`. This will:
    - Create a new git tag with the version number.
    - Push the tag to the remote repository.
    - CI will then publish the package to npm.
