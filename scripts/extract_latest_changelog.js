const fs = require('fs');
const path = require('path');

/**
 * Extracts the latest version section from CHANGELOG.md
 * for use in GitHub release notes.
 * Used by CI/CD workflows.
 * Usage: node scripts/extract_latest_changelog.js
 */

const changelogPath = path.join(__dirname, '../CHANGELOG.md');
const packagePath = path.join(__dirname, '../package.json');

const changelogContent = fs.readFileSync(changelogPath, 'utf8');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const packageVersion = packageJson.version;

// Check if there's an Unreleased section
const unreleasedRegex = /^## \[Unreleased\]/gm;
const unreleasedMatch = unreleasedRegex.exec(changelogContent);

// Split by version headers (## [x.x.x] or ## [Unreleased])
const versionRegex = /^## \[(?:Unreleased|\d+\.\d+\.\d+)\]/gm;
const matches = [...changelogContent.matchAll(versionRegex)];

if (matches.length === 0) {
    console.error('No version found in CHANGELOG.md');
    process.exit(1);
}

// Determine which section to use
let sectionToExtract;
let versionNumber;

if (unreleasedMatch && matches[0].index === unreleasedMatch.index) {
    // Use Unreleased section and package.json version
    sectionToExtract = 0;
    versionNumber = packageVersion;
} else {
    // Use the first released version
    sectionToExtract = 0;
    const versionMatch = matches[0][0].match(/\[(\d+\.\d+\.\d+)\]/);
    versionNumber = versionMatch ? versionMatch[1] : packageVersion;
}

const sectionIndex = matches[sectionToExtract].index;
const nextSectionIndex = matches[sectionToExtract + 1] ? matches[sectionToExtract + 1].index : changelogContent.length;

// Extract content between current and next section headers
let sectionContent = changelogContent.substring(sectionIndex, nextSectionIndex).trim();

// Remove the section header line (## [x.x.x] - date or ## [Unreleased])
sectionContent = sectionContent.split('\n').slice(1).join('\n').trim();

// If it's an Unreleased section, remove the "Planned for" line
if (unreleasedMatch && matches[0].index === unreleasedMatch.index) {
    const lines = sectionContent.split('\n');
    // Remove lines until we hit the first feature/improvement section
    const contentStart = lines.findIndex(line => line.startsWith('####'));
    if (contentStart > 0) {
        sectionContent = lines.slice(contentStart).join('\n');
    }
}

// Format for GitHub release
const releaseNotes = `## What's New in v${versionNumber}

${sectionContent}

### 📦 Installation

\`\`\`bash
npm install airport-data-js@${versionNumber}
\`\`\`

See [CHANGELOG.md](https://github.com/aashishvanand/airport-data-js/blob/main/CHANGELOG.md) for full version history.
`;

// Output the formatted release notes
console.log(releaseNotes);

