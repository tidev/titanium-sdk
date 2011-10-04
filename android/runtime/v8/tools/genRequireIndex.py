#! /usr/bin/env python

# Generates an index file used by require
# to test if a file exists in the assets folder.
# Usage: genRequireIndex.py <rootDirectory> <outputFile>
#   rootDirectory = path to the directory being indexed
#                   (Should be path to the app's assets folder)
#   outputFile = path where the JSON index file should be written.

import json
from os.path import join, relpath
from os import walk
import sys

rootDirectory = sys.argv[1]
outputFilename = sys.argv[2]

index = {}

for dirpath, dirnames, filenames in walk(rootDirectory):
	for name in filenames:
		index[join(relpath(dirpath, rootDirectory), name)] = 1

json.dump(index, open(outputFilename, "w"))

