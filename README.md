# Outerbase Studio Desktop

[Outerbase Studio Desktop](https://github.com/outerbase/studio-desktop) is a lightweight Electron wrapper for the [Outerbase Studio](https://github.com/outerbase/studio) web version. It enables support for drivers that aren't feasible in a browser environment, such as MySQL and PostgreSQL.

## Building (macOS)

[Electron build instructions](https://www.electronjs.org/docs/latest/development/build-instructions-macos)

### Prerequisites

- `macOS` >= 11.6.0
- `Xcode` >= 13
- `Python` >= 3.7
- [`node.js`](https://nodejs.org)


### Notarization

You'll need to provide the following environment variables for the [electron notary tool](https://github.com/electron/notarize) to notarize the app:

- `APPLE_ID` : The login username of your [Apple Developer](https://developer.apple.com/) account.
 
- `APPLE_APP_SPECIFIC_PASSWORD` : An [app-specific password](https://support.apple.com/en-us/102654) for your Apple ID (not your Apple ID password). Remember not to hard-code the app-specific password into your packaging scripts.

- `APPLE_TEAM_ID` : The [Team ID](https://developer.apple.com/help/account/manage-your-team/locate-your-team-id/) for the Developer Team you want to notarize under. Your Apple ID may be a member of multiple teams.

Otherwise you will get the following error thrown from `scripts/notarize.cjs`: `No authentication properties provided`

[Read more: Resolving common notarization issues](https://developer.apple.com/documentation/security/resolving-common-notarization-issues#3087721)

### Steps

```bash
# If you don't have node.js installed yet
brew install node
```

```bash
# Install dependencies
npm install
```

```bash
# Required env variables for notarization
export APPLE_ID=...
export APPLE_TEAM_ID=...
export APPLE_APP_SPECIFIC_PASSWORD=...

# Run the build script (it should default to build:mac)
npm run build
```
