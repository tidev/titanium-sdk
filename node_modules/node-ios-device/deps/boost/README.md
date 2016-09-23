# Boost

This folder contains the bare essentials of the Boost library needed to build
node-ios-device. It's based on Boost 1.61.0.

Boost is licensed under the Boost Software License version 1.0.

http://www.boost.org/

# prune.js

Because Boost is huge and we only need a few things, use the `prune.js` tool to
delete all unused files and keep the repo size down. Warning: this tool is
ridiculously inefficient, but it gets the job done.
