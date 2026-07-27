/**
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

// Re-export shim. The implementation has been split into:
//   - runner.js    build/run orchestration (test, getSigningConfig, project constants)
//   - reporter.js  log-stream parsing, dedupe, JUnit XML, console output
//   - snapshots.js  image pulling + diffing (SnapshotManager)
// build/lib/test/index.js imports { test, outputResults } from './test.js';
// this shim preserves that public surface so index.js and builder.js work
// unchanged.
export { test, getSigningConfig } from './runner.js';
export { handleBuild, outputResults } from './reporter.js';
