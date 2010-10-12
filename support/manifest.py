#!/usr/bin/env python
# parse a titanium project or module manifest file

from StringIO import StringIO

class Manifest(object):
	def __init__(self, data):
		if isinstance(data, (file, StringIO)):
			f = data
		else:
			f = open(data, 'r')
		
		self.manifest = {}
		for line in f.readlines():
			line = line.strip()
			if line[0:1]=='#': continue
			if line.find(':') < 0: continue
			key,value = line.split(':')
			self.manifest[key.strip()] = value.strip()
	
	def get_property(self, property):
		if property in self.manifest:
			return self.manifest[property]
		return None
		
	def has_property(self, property):
		return property in self.manifest
	
	def __getattr__(self, name):
		return self.get_property(name)
	