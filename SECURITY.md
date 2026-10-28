# Security Policy

## Reporting a vulnerability

**Please do not open a public issue, discussion or pull request for a security problem.**
A public report tells everyone about the vulnerability, including people who would use it,
before there is a fix available.

Email **[security@tidev.io](mailto:security@tidev.io)** instead.

Helpful things to include, as far as you have them:

- What the vulnerability lets an attacker do, and roughly how bad you think that is.
- The affected Titanium SDK version, and the platform — Android, iOS, or both.
- Steps to reproduce it, or a small sample project.
- Any workaround you have found.

A rough description is still worth sending. Don't sit on a report because you can't produce
a full write-up.

## What happens next

We will confirm we received your report, work out which versions are affected, and let you
know once a fix is on its way. We'll keep you in the loop while that happens, and credit
you when the fix ships unless you would rather we didn't.

Fixes go into the current release. Whether one is backported to an older release branch
depends on how severe it is and what's still being maintained; we'll tell you what we
decide.

## Scope

This policy covers the Titanium SDK in this repository. Other TiDev projects — the CLI,
Alloy, and the modules under [tidev](https://github.com/tidev/) — are covered by the same
email address; say which project you mean.

A vulnerability in an app *built* with Titanium is usually a problem in that app rather
than in the SDK. If you aren't sure which you're looking at, send it anyway and we'll help
you work it out.
