# Mobile Web Dependency Analyzer

This tool scans the entire Titanium Mobile Web source code to find all define()
calls and identify their dependencies. These dependencies are then written to
dependencies.json in which the Mobile Web build command will read in this file
and use it to assemble the build.

This tool must be ran after any new APIs are created, updated, or removed.

## Installation

Before running, you need to fetch the npm dependencies:

	npm install

## Usage

	node dependencyAnalyzer

