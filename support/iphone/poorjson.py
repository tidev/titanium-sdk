#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Jeff's poor man python JSON encoder
#
import os,types

class PoorJSON(object):
	def array(self,v):
		list = []
		for x in v:
			list.append(self.get(x))
		return '[%s]' % (','.join(list))

	def string(self,v):
		return '"%s"' % v
		
	def unicode(self,v):
		return u'"%s"' % v

	def bool(self,v):
		if v == True:
			return 'true'
		return 'false'

	def number(self,v):
		return str(v)

	def null(self,v):
		return 'null'
		
	def hash(self,prop):
		a = []
		for key in prop:
			value = prop[key]
			a.append('"%s": %s' % (key,self.get(value)))
		return "{%s}" % ','.join(a)	

	def get(self,prop):
		
		t = type(prop)
		
		if t == types.BooleanType:
			return self.bool(prop)
		elif t == types.NoneType:
			return self.null(prop)
		elif t == types.UnicodeType:
			return self.unicode(prop)
		elif t == types.StringType:
			return self.string(prop)
		elif t == types.IntType:
			return self.number(prop)
		elif t == types.LongType:
			return self.number(prop)
		elif t == types.FloatType:
			return self.number(prop)
		elif t == types.ListType:
			return self.array(prop)
		else:
			return self.hash(prop)
					
	def dump(self,prop):
		return self.get(prop)

#print PoorJSON().dump({u'Très 漢字':[1,2]}).encode("utf-8")
# print PoorJSON().dump([1,2])
# print PoorJSON().dump({'a':True})
