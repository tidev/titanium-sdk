#!/usr/bin/env python
#
# A simple command line validator for TDoc2 YAML/Markdown based documentation
#

import os, sys, re
apiDocDir = os.path.abspath(os.path.dirname(__file__))

# We package the python markdown module already in the sdk source tree,
# namely in /support/module/support/markdown.  So go ahead and  use it
# rather than rely on it being easy_installed.
moduleSupportDir = os.path.abspath(os.path.join(apiDocDir, '..', 'support', 'module', 'support'))
if os.path.exists(moduleSupportDir):
	sys.path.append(moduleSupportDir)

import codecs, optparse
import markdown

try:
	import yaml
except:
	print >> sys.stderr, "You don't have pyyaml!\n"
	print >> sys.stderr, "You can install it with:\n"
	print >> sys.stderr, ">  sudo easy_install pyyaml\n"
	print >> sys.stderr, ""
	sys.exit(1)


VALID_PLATFORMS = ["android", "iphone", "ipad"]
types = {}
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

	def getTracker(self, childName):
		for child in self.children:
			if child.name == childName:
				return child
		return None

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
	for p in platforms:
		if p not in VALID_PLATFORMS:
			tracker.trackError('platform specifier "%s" is not valid. Valid platforms are: %s.' % (p, VALID_PLATFORMS))

def validateSince(tracker, since):
	if type(since) not in [str, dict]:
		tracker.trackError('"since" should either be a version inside a string, or a dictionary of platform to version: %s, %s' % (since, type(since)))

def validateDeprecated(tracker, deprecated):
	if type(deprecated) != dict or 'since' not in deprecated:
			tracker.trackError('"deprecated" should be a dictionary with "since" and optional "removed" versions: %s' % deprecated)

def validateOsVer(tracker, osver):
	if type(osver) != dict:
		tracker.trackError('"osver" should be a dictionary of platforms to version dictionaries') 
	for key, value in osver.iteritems():
		if type(value) != dict:
			tracker.trackError('"osver" for platform "%s" should be a dictionary with platforms mapping to dictionaries of "mix" (String), "max" (String), and/or "versions" (List)' % (key, value))

def validateIsBool(tracker, name, value):
	if not isinstance(value, bool):
		tracker.trackError('"%s" should either be true or false: %s, %s' % (name, value, type(value)))

def validateIsOneOf(tracker, name, value, validValues):
	if value not in validValues:
		tracker.trackError('"%s" should be one of %s, but was %s' % (name, ", ".join(validValues), value))

def validateMarkdown(tracker, mdData, name):
	try:
		html = markdown.markdown(mdData)
	except Exception, e:
		tracker.trackError('Error parsing markdown block "%s": %s' % (name, e))

def findType(tracker, typeName, name):
	if typeName in ['Boolean', 'Number', 'String', 'Date', 'Object', 'Callback']: return

	containerRegex = r'(Dictionary|Callback|Array)\<([^\>]+)\>'
	match = re.match(containerRegex, typeName)
	if match:
		if not typeName.endswith('>>'):
			elementType = match.group(2)
			findType(tracker, elementType, name)
			return
		else:
			# We've got something like Array<Dictionary<Titanium.Map.Annotation>>
			pos = typeName.index('<')
			findType(tracker, typeName[pos+1:-1], name)
			return

	found = False
	for tdocPath, tdocTypes in types.iteritems():
		for t in tdocTypes:
			if 'name' in t and t['name'] == typeName:
				found = True
				break
	if not found:
		tracker.trackError('"%s" type "%s" could not be found' % (name, typeName))


def validateCommon(tracker, map):
	if 'platforms' in map:
		validatePlatforms(tracker, map['platforms'])

	if 'since' in map:
		validateSince(tracker, map['since'])

	if 'deprecated' in map:
		validateDeprecated(tracker, map['deprecated'])

	if 'osver' in map:
		validateOsVer(tracker, map['osver'])

	if 'createable' in map:
		validateIsBool(tracker, 'createable', map['createable'])

	if 'permission' in map:
		validateIsOneOf(tracker, 'permission', map['permission'],
			('read-only', 'write-only', 'read-write'))

	if 'availability' in map:
		validateIsOneOf(tracker, 'availability', map['availability'],
			('always', 'creation', 'not-creation'))

	if 'accessors' in map:
		validateIsBool(tracker, 'accessors', map['accessors'])

	if 'optional' in map:
		validateIsBool(tracker, 'optional', map['optional'])

def validateMethod(typeTracker, method):
	tracker = ErrorTracker(method['name'], typeTracker)
	validateRequired(tracker, method, ['name'])
	validateCommon(tracker, method)

	if 'returns' in method:
		if type(method['returns']) != dict:
			tracker.trackError('"returns" must be an Object: %s' % method['returns'])
			return
		if 'type' not in method['returns']:
			tracker.trackError('Required property "type" missing in "returns": %s' % method["returns"])


	if 'parameters' in method:
		if type(method['parameters']) != list:
			tracker.trackError('"parameters" must be a list')
		for param in method['parameters']:
			pTracker = ErrorTracker(param['name'], tracker)
			validateRequired(pTracker, param, ['name', 'description', 'type'])

	if 'examples' in method:
		validateExamples(tracker, method['examples'])

def validateProperty(typeTracker, property):
	tracker = ErrorTracker(property['name'], typeTracker)

	validateRequired(tracker, property, ['name', 'description', 'type'])
	validateCommon(tracker, property)

	if 'examples' in property:
		validateExamples(tracker, property['examples'])
	
	constantRegex = r'[A-Z]+[A-Z_]*'
	match = re.match(constantRegex, property['name'])
	if match:
		if not 'permission' in property:
			tracker.trackError('Required property for constant "permission" not found')
		else:
			if not property['permission'] == 'read-only':
				tracker.trackError('Constant should have "read-only" permission.')

def validateEvent(typeTracker, event):
	tracker = ErrorTracker(event['name'], typeTracker)
	validateRequired(tracker, event, ['name', 'description'])
	validateCommon(tracker, event)

def validateExamples(tracker, examples):
	if not isinstance(examples, list):
		tracker.trackError('"examples" must be a list: %s' % examples)
		return
	for example in examples:
		if not isinstance(example, dict) or 'title' not in example or 'example' not in example:
			tracker.trackError('each example must be a dict with "title" and "example" members: %s' % example)
			continue
		validateMarkdown(tracker, example['example'], 'example')

def validateType(typeDoc):
	typeName = typeDoc['name']
	errorTrackers[typeName] = ErrorTracker(typeName)
	tracker = errorTrackers[typeName]

	validateRequired(tracker, typeDoc, ['name', 'description'])
	validateCommon(tracker, typeDoc)

	if 'notes' in typeDoc:
		validateMarkdown(tracker, typeDoc['notes'], 'notes')

	if 'examples' in typeDoc:
		validateExamples(tracker, typeDoc['examples'])

	if 'methods' in typeDoc:
		for method in typeDoc['methods']:
			validateMethod(tracker, method)

	if 'properties' in typeDoc:
		for property in typeDoc['properties']:
			validateProperty(tracker, property)

	if 'events' in typeDoc:
		for event in typeDoc['events']:
			validateEvent(tracker, event)


def validateTDoc(tdocPath):
	tdocTypes = [type for type in yaml.load_all(codecs.open(tdocPath, 'r', 'utf8').read())]
	if options.parseonly:
		return

	for type in tdocTypes:
		validateType(type)

	global types
	types[tdocPath] = tdocTypes

def validateRef(tracker, ref, name):
	if type(ref) not in [str, list]:
		tracker.trackError('"%s" reference "%s" must be either a String or List' % (name, ref))

	if type(ref) is str:
		findType(tracker, ref, name)
	elif type(ref) is list:
		for t in ref:
			findType(tracker, t, name)

def validateMethodRefs(typeTracker, method):
	tracker = typeTracker.getTracker(method['name'])
	if 'returns' in method:
		if type(method['returns']) == str:
			validateRef(tracker, method['returns'], 'returns')
		elif type(method['returns']) == dict:
			returnObj = method['returns']
			rTracker = ErrorTracker(returnObj, tracker)
			if 'type' in returnObj:
				validateRef(rTracker, returnObj['type'], 'type')
	if 'parameters' in method:
		for param in method['parameters']:
			pTracker = tracker.getTracker(param['name'])
			if 'type' in param:
				validateRef(pTracker, param['type'], 'type')

def validateRefs():
	for tdocPath, tdocTypes in types.iteritems():
		for typeDoc in tdocTypes:
			tracker = errorTrackers[typeDoc['name']]
			if 'extends' in typeDoc:
				validateRef(tracker, typeDoc['extends'], 'extends')
			if 'methods' in typeDoc:
				for method in typeDoc['methods']:
					validateMethodRefs(tracker, method)
			if 'properties' in typeDoc:
				for property in typeDoc['properties']:
					pTracker = tracker.getTracker(property['name'])
					if 'type' in property:
						validateRef(pTracker, property['type'], 'type')


def validateDir(dir):
	for root, dirs, files in os.walk(dir):
		for file in files:
			if file.endswith(".yml") and file != "template.yml":
				absolutePath = os.path.join(root, file)
				try:
					validateTDoc(absolutePath)
				except Exception, e:
					printError("Error parsing %s: %s:" % (os.path.join(root,file), str(e)))
	validateRefs()

def printStatus(dir=None):
	keys = types.keys()
	keys.sort()
	for key in keys:
		tdocPath = key
		tdocTypes = types[key]
		if dir: tdocPath = tdocPath[len(dir)+1:]
		print '%s:' % tdocPath
		for type in tdocTypes:
			errorTrackers[type["name"]].printStatus()

def main(args):
	parser = optparse.OptionParser()
	parser.add_option('-v', '--verbose', dest='verbose',
		action='store_true', default=False, help='enable verbose validation output')
	parser.add_option('-d', '--dir', dest='dir',
		default=None, help='directory to recursively validate *.yml TDoc2 files')
	parser.add_option('-f', '--file', dest='file',
		default=None, help='specific TDoc2 file to validate (overrides -d/--dir)')
	parser.add_option('-p', '--parseonly', dest='parseonly',
		action='store_true', default=False, help='only check yaml parse-ability')
	global options
	(options, args) = parser.parse_args(args)

	dir=None
	if options.file is not None:
		print "Validating %s:" % options.file
		validateTDoc(options.file)
	else:
		dir = options.dir or apiDocDir
		validateDir(dir)
	printStatus(dir)

if __name__ == "__main__":
	main(sys.argv)
