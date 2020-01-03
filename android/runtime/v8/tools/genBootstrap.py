#!/usr/bin/env python
#
# Appcelerator Titanium Mobile
# Copyright (c) 2011-2013 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# Generates javascript bootstrapping code for Titanium Mobile
#

import os, re, sys

thisDir = os.path.abspath(os.path.dirname(__file__))
androidDir = os.path.abspath(os.path.join(thisDir, "..", "..", ".."))

# We package simplejson in our directory.
commonSupportDir = os.path.abspath(os.path.join(thisDir))
sys.path.append(commonSupportDir)

try:
	import json
except:
	import simplejson as json

import optparse

thisDir = os.path.abspath(os.path.dirname(__file__))
genDir = os.path.join(os.path.dirname(thisDir), "generated")

if not os.path.exists(genDir):
	os.makedirs(genDir)

import bootstrap

def loadBindings():

	def mergeModules(source, dest):
		for k in source.keys():
			if k not in dest:
				dest[k] = source[k]
			else:
				origEntry = dest[k]
				newEntry = source[k]

				if "apiName" in newEntry and "apiName" not in origEntry:
					origEntry["apiName"] = newEntry["apiName"]

				for listName in ("childModules", "createProxies"):
					if listName in newEntry and listName not in origEntry:
						origEntry[listName] = newEntry[listName]
					elif listName in newEntry:
						origIds = [c["id"] for c in origEntry[listName]]
						newMembers = [c for c in newEntry[listName] if c["id"] not in origIds]
						if newMembers:
							origEntry[listName].extend(newMembers)

	bindingPath = os.path.abspath(os.path.join(androidDir, "..", "dist", "android", "titanium.bindings.json"))
	moduleName = os.path.basename(bindingPath).replace(".json", "")
	binding = json.load(open(bindingPath))
	bindings = { "proxies": {}, "modules": {} }
	bindings["proxies"].update(binding["proxies"])
	mergeModules(binding["modules"], bindings["modules"])

	return bindings

def main():
	parser = optparse.OptionParser()
	parser.add_option("-r", "--runtime", dest="runtime", default=None)
	parser.add_option("-o", "--output", dest="output", default=None)

	(options, args) = parser.parse_args()

	if not options.runtime:
		print >>sys.stderr, "Error: --runtime is required"
		sys.exit(1)

	runtime = options.runtime
	bindings = loadBindings()

	b = bootstrap.Bootstrap(bindings, moduleId="titanium", moduleName="Titanium")

	jsTemplate = open(os.path.join(thisDir, "bootstrap.js")).read()
	gperfTemplate = open(os.path.join(thisDir, "bootstrap.gperf")).read()

	outDir = genDir
	if options.output != None:
		outDir = options.output

	b.generateJS(jsTemplate, gperfTemplate, outDir)

if __name__ == "__main__":
	main()
