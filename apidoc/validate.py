#!/usr/bin/env python
#
# A simple command line validator for TDoc2 YAML/Markdown based documentation
#

import os, sys
import codecs, optparse
import yaml, markdown

apiDocDir = os.path.abspath(os.path.dirname(__file__))
errorTrackers = {}
options = None

def printCheck(str, indent=1):
	print u'%s\u2713 \033[92m%s\033[0m' % ('\t' * indent, str)

def printError(str, indent=1):
	print >>sys.stderr, u'%s\u0078 \033[91m%s\033[0m' % ('\t' * indent, str)

class ErrorTracker(object):
	def __init__(self, name, parent=None):
		self.name = name
		self.errors = []
		self.children = []
		self.parent = parent
		if self.parent != None:
			self.parent.children.append(self)

	def trackError(self, description):
		self.errors.append(description)

	def hasErrors(self):
		if len(self.errors) > 0:
			return True
		for child in self.children:
			if child.hasErrors():
				return True
		return False

	def printStatus(self, indent=1):
		if self.hasErrors():
			printError(self.name, indent)
		elif options.verbose or indent == 1:
			printCheck(self.name, indent)

		for error in self.errors:
			printError(error, indent + 1)
		for child in self.children:
			child.printStatus(indent + 1)

def validateRequired(tracker, map, required):
	for r in required:
		if r not in map:
			tracker.trackError('Required property "%s" not found' % r)

def validatePlatforms(tracker, platforms):
	if type(platforms) != list:
		tracker.trackError('"platforms" specified, but isn\'t a list: %s' % platforms)

def validateSince(tracker, since):
	if type(since) not in [str, dict]:
		tracker.trackError('"since" should either be a version inside a string, or a dictionary of platform to version: %s' % since)

def validateDeprecated(tracker, deprecated):
	if type(deprecated) != dict or 'since' not in deprecated:
			tracker.trackError('"deprecated" should be a dictionary with "since" and optional "removed" versions: %s' % deprecated)

def validateOsVer(tracker, osver):
	if type(osver) != dict:
		tracker.trackError('"osver" should be a dictionary of platforms to version dictionaries') 
	for key, value in osver.iteritems():
		if type(value) != dict:
			tracker.trackError('"osver" for platform "%s" should be a dictionary with platforms mapping to dictionaries of "mix" (String), "max" (String), and/or "versions" (List)' % (key, value))

def validateMarkdown(tracker, mdData, name):
	try:
		html = markdown.markdown(mdData)
	except Exception, e:
		tracker.trackError('Error parsing markdown block "%s": %s' % (name, e))

def validateCommon(tracker, map):
	if 'platforms' in map:
		validatePlatforms(tracker, map['platforms'])

	if 'since' in map:
		validateSince(tracker, map['since'])

	if 'deprecated' in map:
		validateDeprecated(tracker, map['deprecated'])

	if 'osver' in map:
		validateOsVer(tracker, map['osver'])

def validateMethod(typeTracker, method):
	tracker = ErrorTracker(method['name'], typeTracker)

	validateRequired(tracker, method, ['name'])
	validateCommon(tracker, method)

	if 'parameters' in method:
		if type(method['parameters']) != list:
			tracker.trackError('"parameters" must be a list')
		for param in method['parameters']:
			pTracker = ErrorTracker(param['name'], tracker)
			validateRequired(pTracker, param, ['name', 'description', 'type'])

	if 'examples' in method:
		validateMarkdown(tracker, method['examples'], 'examples')

def validateProperty(typeTracker, property):
	tracker = ErrorTracker(property['name'], typeTracker)

	validateRequired(tracker, property, ['name', 'description', 'type'])
	validateCommon(tracker, property)

	if 'examples' in property:
		validateMarkdown(tracker, property['examples'], 'examples')

def validateEvent(typeTracker, event):
	tracker = ErrorTracker(event['name'], typeTracker)
	validateRequired(tracker, event, ['name', 'description'])

def validateType(typeDoc):
	typeName = typeDoc['name']
	errorTrackers[typeName] = ErrorTracker(typeName)
	tracker = errorTrackers[typeName]

	validateRequired(tracker, typeDoc, ['name', 'description'])
	validateCommon(tracker, typeDoc)

	if 'notes' in typeDoc:
		validateMarkdown(tracker, typeDoc['notes'], 'notes')

	if 'examples' in typeDoc:
		validateMarkdown(tracker, typeDoc['examples'], 'examples')

	if 'methods' in typeDoc:
		for method in typeDoc['methods']:
			validateMethod(tracker, method)

	if 'properties' in typeDoc:
		for property in typeDoc['properties']:
			validateProperty(tracker, property)

	if 'events' in typeDoc:
		for event in typeDoc['events']:
			validateEvent(tracker, event)

	tracker.printStatus()

def validateTDoc(tdocPath):
	for type in yaml.load_all(codecs.open(tdocPath, 'r', 'utf8').read()):
		validateType(type)

def validateDir(dir):
	for root, dirs, files in os.walk(dir):
		for file in files:
			if file.endswith(".yml"):
				absolutePath = os.path.join(root, file)
				relativePath = absolutePath[len(dir)+1:]
				print "Validating %s:" % relativePath
				try:
					validateTDoc(absolutePath)
				except Exception, e:
					printError("Error parsing, %s:" % str(e))

def main(args):
	parser = optparse.OptionParser()
	parser.add_option('-v', '--verbose', dest='verbose',
		action='store_true', default=False, help='enable verbose validation output')
	parser.add_option('-d', '--dir', dest='dir',
		default=None, help='directory to recursively validate *.yml TDoc2 files')
	parser.add_option('-f', '--file', dest='file',
		default=None, help='specific TDoc2 file to validate (overrides -d/--dir)')
	global options
	(options, args) = parser.parse_args(args)

	if options.file is not None:
		print "Validating %s:" % options.file
		validateTDoc(options.file)
	else:
		dir = options.dir or apiDocDir
		validateDir(dir)

if __name__ == "__main__":
	main(sys.argv)
