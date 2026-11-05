# Mobile monitoring (GlitchTip)

Monitoring is opt-in. Set `EXPO_PUBLIC_GLITCHTIP_DSN` to the **public project DSN**
when building a native release with `TARGET_ENV=test`, `review` or `prod`. An empty
DSN, local environment, `__DEV__`, Jest, Storybook (env or bundled config), or
Expo Go disables initialization and root wrapping. No transport is created in
those modes. Runtime settings are read from Expo `extra.monitoring`; only the DSN
and Storybook boolean are exposed, never upload credentials.

Unhandled JS exceptions/rejections and native crashes are enabled. Explicit
`logAppEvent` errors are captured once per Error object; info/debug/warn stay
console-only. Console logs are not converted to telemetry. Root React Navigation
transactions are sampled at **1%**; only the five static tab names and timing are
retained. In-screen imperative flows are not separately instrumented. There are
no sessions, replay, profiles, screenshots, view hierarchy, log ingestion,
automatic HTTP tracing, or outbound trace headers.

## Privacy boundary

JS events use a fail-closed allowlist. Request headers, query strings, bodies,
users, breadcrumbs, arbitrary contexts/tags/extra, GraphQL variables, chat content,
error messages, stack source/locals, transaction spans, and attachments are
dropped. Error types, static logger codes, sanitized stack coordinates, build
metadata and debug IDs remain. Do not add account IDs, tokens, variables or chat
text to Sentry scope APIs. Native Release integration provides actual package,
version and build metadata; manifest version/build is a fallback. Environment is
`TARGET_ENV`, separate from release identity.

**Native caveat:** JS `beforeSend` does not process native crash reports. Native
defaults have PII, sessions, screenshots, view hierarchy, threads, breadcrumbs and
request capture disabled through SDK options, but native crash metadata (device/OS,
crash reason, native frames) still comes from the native SDK. Do not put sensitive
values in native exception messages. Validate native envelopes and configure
GlitchTip server-side scrubbing/retention before enabling production. A stricter
native allowlist would require separately reviewed native SDK callbacks; this
change does not claim JS sanitization applies to native crashes.

## Checked-in native projects: required follow-up

This Expo 54 app commits both native projects. Adding the dependency and Expo
plugin **does not modify those existing projects or install pods**. No large native
project files were hand-edited for this integration. Before enabling monitoring:

1. In a clean, disposable branch/worktree, configure the public DSN, `TARGET_ENV`
   and build-only `SENTRY_ORG`/`SENTRY_PROJECT`, then run Expo prebuild (without
   `--clean` initially). Review the generated iOS/Android changes, especially
   autolinking, Sentry build phases/Gradle hooks and existing Maps/permissions.
   Never run destructive prebuild against uncommitted native customizations.
2. Install iOS pods and rebuild native binaries, or use the existing EAS build
   profiles after reviewing the generated changes. An OTA/Metro refresh alone is
   insufficient. Expo Go cannot validate native crashes. Keep manifest and native
   version/build numbers synchronized.
3. Use a disposable release build with synthetic, non-personal errors to validate
   JS rejection, logger and native crash reporting, privacy and symbolication.
   A native crash is delivered on the following launch. Do not test against live
   users. Nothing in this change deploys or sends a test event.

## Source maps / native symbols

Metro uses the installed Sentry Expo configuration for debug IDs and preserves
the existing Expo SVG transformer and outer Storybook wrapper. The serializer
also requires app-resolvable `metro`; the matching Expo
54 Metro 0.83.3 version is declared directly in dev dependencies, rather than
relying on a transitive dependency nested inside Expo. When a DSN is
present the Expo Sentry plugin targets the DSN's **origin**, not sentry.io.
Reverse-proxy subpath hosting needs an explicitly reviewed plugin URL adjustment.

Upload configuration is **build-only**: `SENTRY_ORG`, `SENTRY_PROJECT` and a secret
`SENTRY_AUTH_TOKEN` in the build runner. Never prefix the token with `EXPO_PUBLIC_`,
put it in Expo config, commit it, or ship it in the app. The example environment
disables automatic uploads (`SENTRY_DISABLE_AUTO_UPLOAD=true`) for safe local
builds. To enable uploads, remove/set that flag false only in the reviewed build
pipeline; ensure its CLI server URL points at GlitchTip as well.

GlitchTip's Sentry API compatibility does not guarantee every current sentry-cli
artifact/debug-ID/native-symbol endpoint is supported by the deployed version.
Verify JS/Hermes source maps and iOS dSYMs/Android native symbols on that instance;
retain matching maps and symbols for **each** release/build. Uploading them to
sentry.io will not help GlitchTip. If debug-ID uploads are unsupported, use the
instance-supported legacy release/dist artifact workflow with matching bundle
names/URL prefixes and verify the sanitized bundle filenames resolve correctly.
Without supported uploads, events still work but stacks may remain minified or
unsymbolicated. Expo export/OTA bundles need their own matching upload workflow;
the native plugin alone does not configure OTA artifact publishing.