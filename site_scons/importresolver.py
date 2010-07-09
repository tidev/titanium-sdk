#!/usr/bin/env python
#
# script that knows how to compute objective-c
# dependencies by analyzing the imports of 
# implementation and header files of the source
# tree and computing a JSON map of all the dependencies
# per file 
#

import simplejson as json
import os, sys, uuid, subprocess, shutil, re 
from os.path import join, splitext, split, exists


ignoreFiles = ['.gitignore', '.cvsignore','.DS_Store'];
ignoreDirs = ['.git','.svn', 'CVS'];

depends = {}

def dequote(s):
	if s[0:1] == '"':
		return s[1:-1]
	return s
	
def import_path(path,filename):
	if path[0:1]=="<": return ''
	idx = filename.find('/')
	if idx == -1: return ''
	return "%s/" % filename[0:idx]
	
def strip_path(fn):
	idx = fn.find('/')
	if idx!=-1:
		fn=fn[idx+1:]
	return fn
	
def extract_imports(file,filename):
	file_contents = open(file).read()
	f = re.findall(r'#import (.*)',file_contents)
	imports = []
	if len(f) > 0:
		for name in f:
			append_to = import_path(name,filename)
			fn = strip_path(dequote(name.strip()))
			imports.append(fn)
	return imports

def merge_arrays(a,b):
	for e in b:
		if e in a: continue
		a.append(e)
	return a		
	
def parse_files(the_dir):
	for root, dirs, files in os.walk(the_dir):
		for name in ignoreDirs:
			if name in dirs:
				dirs.remove(name)	
			for file in files:
				# if splitext(file)[-1] in ('.html', '.js', '.css', '.a', '.m', '.c', '.cpp', '.h', '.mm'):
				# 	continue
				if file in ignoreFiles:
					continue
				full_path = join(root, file)
				relative_path = full_path.replace(the_dir+'/','')
				if splitext(file)[-1] in ('.h','.m','.c','.mm','.cpp'):
					file_name = splitext(relative_path)[0]
					imports = extract_imports(full_path,file_name)
					relative_path = strip_path(relative_path)
					if depends.has_key(relative_path):
						depends[relative_path] = merge_arrays(depends[relative_path],imports)
					else:
						depends[relative_path] = imports

					

def resolve_source_imports(dir):
	flat={}
	root_dir = os.path.expanduser(dir)
	parse_files(root_dir)
	return json.dumps(depends,sort_keys=True,indent=4)

if __name__ == '__main__':
	out = resolve_source_imports("~/work/titanium_mobile/iphone/Classes")
	f = open("/Library/Application Support/Titanium/mobilesdk/osx/0.9.0/iphone/imports.json","w")
	f.write(out)
	f.close()
	
	
	
