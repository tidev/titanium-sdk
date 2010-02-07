#!/usr/bin/env python
#
# script that knows how to compute objective-c
# dependencies by analyzing the imports of 
# implementation and header files of the source
# tree and computing a JSON map of all the dependencies
# per file 
#

import os, sys, uuid, subprocess, shutil, re, json
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
	
def extract_imports(file,filename):
	file_contents = open(file).read()
	f = re.findall(r'#import (.*)',file_contents)
	imports = []
	if len(f) > 0:
		for name in f:
			append_to = import_path(name,filename)
			imports.append("%s%s" % (append_to,dequote(name.strip())))
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
					if depends.has_key(relative_path):
						depends[relative_path] = merge_arrays(depends[relative_path],imports)
					else:
						depends[relative_path] = imports

					

def resolve_source_imports(dir):
	flat={}
	root_dir = os.path.expanduser(dir)
	parse_files(root_dir)

	for entry in depends:
		collapsed = {}
		for imports in depends[entry]:
			if depends.has_key(imports):
				found = depends[imports]
				for k in depends[imports]:
					collapsed[k]=True
			else:
				collapsed[imports]=True
		flat[entry]=collapsed				
					
	return json.dumps(flat,sort_keys=True, indent=4)

if __name__ == '__main__':
	print resolve_source_imports("~/work/titanium_mobile/iphone/Classes")
	
	