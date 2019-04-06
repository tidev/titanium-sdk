#!/bin/bash

#
# Script for building the TitaniumKit docs. Work in progress due to an open TODO (see below).
#

# Make sure jazzy is installed
JZ=$(jazzy --version)

if [ ! $? -eq 0 ];
then
	echo "The required docs-generator \"Jazzy\" not installed"
	echo "Download by running [sudo] gem install jazzy"
	exit 1
fi

echo "Generating TitaniumKit docs ..."

# FIXME: We use a hacked together custom umbrella-header for this

jazzy \
  --objc \
  --clean \
  --author Appcelerator \
  --author_url https://appcelerator.com \
  --github_url https://github.com/appcelerator/titanium_mobile \
  --github-file-prefix https://github.com/appcelerator/titanium_mobile/tree/next \
  --module-version 8.1.0 \
  --sdk iphonesimulator \
  --umbrella-header TitaniumKit/TitaniumKitDocs.h \
  --framework-root . \
  --module TitaniumKit

if [ ! $? -eq 0 ];
then
  echo "An error occurred while generated the docs. Please see the errors above!"
  exit 1
else
  echo "TitaniumKit docs generated successfully!"
  exit 0
fi
