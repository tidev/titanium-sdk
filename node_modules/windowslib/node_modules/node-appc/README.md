## Appcelerator Node Utilities

> This is a common library used by Appcelerator Node.js-based software products such as the
[Titanium CLI](http://github.com/appcelerator/titanium).

[![Build Status](https://travis-ci.org/appcelerator/node-appc.png)](https://travis-ci.org/appcelerator/node-appc)

## Prerequisites

node-appc requires [Node.js 0.8.x](http://nodejs.org/dist/) or newer.

## Installation

    [sudo] npm install node-appc -g

### Running Unit Tests

To run the unit tests, simply run:

    node forge test

### Running Code Coverage

To generate the code coverage, you first must install
[node-jscoverage](https://github.com/visionmedia/node-jscoverage). The easist
way to do this is run:

    git clone git@github.com:visionmedia/node-jscoverage.git
    cd node-jscoverage
    ./configure
    make
    sudo make install

Then run:

	node forge test-cov

It will generate a file called _coverage.html_ in the node-appc directory.

## Contributing

Titanium is an open source project. Titanium wouldn't be where it is now without
contributions by the community. Please consider forking this repo to improve,
enhance or fix issues. If you feel like the community will benefit from your
fork, please open a pull request.

To protect the interests of the Titanium contributors, Appcelerator, customers
and end users we require contributors to sign a Contributors License Agreement
(CLA) before we pull the changes into the main repository. Our CLA is simple and
straightforward - it requires that the contributions you make to any
Appcelerator open source project are properly licensed and that you have the
legal authority to make those changes. This helps us significantly reduce future
legal risk for everyone involved. It is easy, helps everyone, takes only a few
minutes, and only needs to be completed once.

[You can digitally sign the CLA](http://bit.ly/app_cla) online. Please indicate
your e-mail address in your first pull request so that we can make sure that
will locate your CLA. Once you've submitted it, you no longer need to send one
for subsequent submissions.

## License

This project is open source and provided under the Apache Public License
(version 2). Please make sure you see the `LICENSE` file included in this
distribution for more details on the license.  Also, please take notice of the
privacy notice at the end of the file.

#### (C) Copyright 2012-2013, [Appcelerator](http://www.appcelerator.com/) Inc. All Rights Reserved.
