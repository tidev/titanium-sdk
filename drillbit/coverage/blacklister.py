#!/usr/bin/env python
#
# Takes a coverage matrix, and from it, generates a "blacklist"
# of stuff that is (probably) private to the iOS internals. This
# check is essentially:
#   if 'yes' iOS AND 'na' Android AND 'no' TDoc then blacklist
#
# Note that this means we will need to manually de-blacklist any
# iOS-only APIs which simply do not have documentation. To make this
# easier, a suite of blacklist files are created, one for each API point,
# and they are pretty-printed.
#
# It is expected that these files will be manually maintained once
# initially generated, but if they get badly out of sync, the blacklister
# may need to be run again.

import optparse
import os
from coverage import CoverageData

try:
	import json
except ImportError, e:
	import simplejson as json

class Blacklister(object):
	def __init__(self, input_dir):
		self.coverage = None
		self.blacklist = {}
		
		datapath = os.path.join(input_dir, 'matrixData.json')
		try:
			matrix = open(datapath)
			self.coverage = json.load(matrix)
			matrix.close()
		except IOError as (errno, errstr):
			print "Error opening %s: %s (%s)" % (datapath, errstr, errno)
			return
	
	def blacklistAPIs(self, apiset):
		for (api, coverage) in apiset.items():
			self.blacklist[api] = {"functions":[], "properties":[]}
		
			for (type, blacklist) in self.blacklist[api].items():
				for (name, data) in coverage[type].items():
					has_tdoc = CoverageData.CATEGORY_TDOC in data
					has_binding = CoverageData.CATEGORY_BINDING in data
					if not has_tdoc or not has_binding:
						print "Skipping %s... no tdoc/binding" % name
						continue
					has_ios = CoverageData.PLATFORM_IOS in data[CoverageData.CATEGORY_BINDING]
					if not has_ios:
						print "Skipping %s... no iOS info" % name
						continue
						
					tdoc_info = data[CoverageData.CATEGORY_TDOC][CoverageData.PLATFORM_IOS]
					android_info = data[CoverageData.CATEGORY_BINDING][CoverageData.PLATFORM_ANDROID]
					ios_info = data[CoverageData.CATEGORY_BINDING][CoverageData.PLATFORM_IOS]
					
					if tdoc_info == CoverageData.STATUS_NO and android_info == CoverageData.STATUS_NA and ios_info == CoverageData.STATUS_YES:
						blacklist.append(name)
	
	def genBlacklist(self):
		if self.coverage is not None:
			self.blacklistAPIs(self.coverage['modules'])
			self.blacklistAPIs(self.coverage['proxies'])
		
	def writeBlacklist(self, output_dir):
		if os.path.isdir(output_dir):
			for api in self.blacklist.keys():
				path = os.path.join(output_dir, '%s.json' % api)
				output = open(path,'w')
				json.dump(self.blacklist[api], output, indent=1)
		else:
			print "Cannot write output to %s; not a directory" % output_dir

# TODO: Add the ability to generate a blacklist from deltas, so that
# it's easy to maintain good coverage lists.
def main():
	parser = optparse.OptionParser()
	parser.add_option('-d', '--dir', dest="dir", default=None,
		help="Directory containing coverage output")
	parser.add_option('-o', '--output', dest="out", default=None,
		help="Output directory for blacklist")
	(options, args) = parser.parse_args()
	
	if options.dir is None or options.out is None:
		parser.print_help()
		exit(1)
	
	blacklist = Blacklister(options.dir)
	blacklist.genBlacklist()
	blacklist.writeBlacklist(options.out)

if __name__ == "__main__":
	main()