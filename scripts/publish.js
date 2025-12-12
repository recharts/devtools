/*
 * Reads the most recent version from package.json, then creates a git tag
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read package.json to get the version
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

if (!version) {
    console.error('Version not found in package.json');
    process.exit(1);
}

// Create a git tag
try {
    execSync(`git tag v${version}`);
    execSync(`git push origin v${version}`);
    console.log(`Successfully created and pushed tag v${version}`);
} catch (error) {
    console.error('Error creating or pushing git tag:', error.message);
    process.exit(1);
}