#!/usr/bin/env python
#
# Titanium API Coverage Merger
#
# Initial Author: Jeff Haynie, 06/03/09
#
import os, sys, types

this_dir = os.path.dirname(os.path.abspath(__file__))
common_support_dir = os.path.abspath(os.path.join(this_dir, "..", "support", "common"))
sys.path.append(common_support_dir)
import simplejson as json


def dequote(s):
    if s[0:1] == '"':
	return s[1:-1]
    return s

def is_leaf(obj,defvalue=False):
	if type(obj) == types.DictType and (obj.has_key('property') or obj.has_key('method')):
		return obj.has_key('description')
	return defvalue

def flatten_values(prefix,obj):
	r = []
#	print "prefix=%s" % prefix
	if type(obj)!=types.DictType: return r
	for k in obj:
#		print k
		entry = obj[k]
		newkey = "%s%s" % (prefix,k)
#		print "   newkey=%s,key=%s" % (newkey,k)
#		print json.dumps(entry, sort_keys=True, indent=4)
		if is_leaf(entry):
			r.append([newkey,entry])
		else:
			a = flatten_values(("%s." % newkey),entry)
			for i in a:
				r.append(i)
	return r
			
def flatten(obj):
	n = flatten_values('',obj)
	nh = {}
	for i in n:
		nh[i[0]]=i[1]
	return nh
	
def normalize(obj):
	flat = {}		
	for key in obj.keys():
		value = obj[key]
		if is_leaf(value,True):
			flat[key]=value
		else:
			for subkey in value:
#				print subkey
				try:
					i = subkey.index('.')
				except:
					flat[subkey]=value
					continue
				newkey = subkey[0:i]
				newprop = subkey[i+1:]
				if not flat.has_key(key):
					flat[key]={}
				if not flat[key].has_key(newkey):
					flat[key][newkey]={}
				flat[key][newkey][newprop]=value[subkey]
	return flat

def add_recursive(key,obj,newobj):
#	print key
	lasttoken = None
	tokens = key.split('.')
	c = 0
	count = len(tokens)
	if count==1:
		newobj[key]=obj
	else:
		for token in tokens:
			if not newobj.has_key(token):
				newobj[token]={}
			newobj = newobj[token]
			lasttoken = token
			c+=1
			if (c == count-1): break
		newobj[tokens[count-1]]=obj
		
def denormalize(obj):
	newobj = {}
	for key in obj:
		add_recursive(key,obj[key],newobj)
	return newobj
					
def main(mobile, a, b=None):

	a_normalized = normalize(a)
	b_normalized = None
	merged = {}
	b_flat = None
	
	if b:
		b_normalized = normalize(b)

	a_flat = flatten(a_normalized)
	
	if b:
		b_flat = flatten(b_normalized)

	for key in a_flat:
		#platforms = {'iphone':['2.2.1','3.0','3.1']}
		merged[key]=a_flat[key]
		#if b and b_flat.has_key(key):
		#	platforms['android']=['1.5']
		#if mobile: merged[key]['platforms']=platforms
	
	if b:
		for key in b_flat:
			if not merged.has_key(key):
				merged[key]=b_flat[key]
				#if mobile: merged[key]['platforms'] = {'android':['1.5']}		
	
	newmerged = denormalize(merged)
	
	print json.dumps(newmerged, sort_keys=True, indent=4)
	
if __name__ == '__main__':
	if len(sys.argv) < 2:
		print "Usage: %s <a> <b>" % os.path.basename(sys.argv[0])
		sys.exit(1)
		
	mobile = len(sys.argv)==3	
	a = None
	b = None
	
	a = json.load(open(os.path.expanduser(dequote(sys.argv[1])),'r'))
	if mobile:
		b = json.load(open(os.path.expanduser(dequote(sys.argv[2])),'r'))
	
	main(mobile,a,b)
	sys.exit(0)

