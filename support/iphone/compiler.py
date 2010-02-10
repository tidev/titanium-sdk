#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Appcelerator Titanium Mobile
#
# Resource to Objective-C Page Compiler
# Handles JS, CSS and HTML files only
#
import os, sys, base64, subprocess, random, time, re, shutil
import jspacker 
from csspacker import CSSPacker

ignoreFiles = ['.gitignore', '.cvsignore', '.DS_Store'];
ignoreDirs = ['.git','.svn','_svn', 'CVS'];

HEADER = """/**
 * Appcelerator Titanium Mobile
 * This is generated code. Do not modify. Your changes *will* be lost.
 * Generated code is Copyright (c) 2009-2010 by Appcelerator, Inc.
 * All Rights Reserved.
 */
#import <Foundation/Foundation.h>
"""

INTERFACE_HEADER= """
@interface ApplicationRouting : NSObject {
}
+ (NSData*) resolveAppAsset:(NSString*)path;
"""

IMPL_HEADER= """#import "ApplicationRouting.h"

extern NSData * decode64 (NSData * thedata); 
extern NSData * dataWithHexString (NSString * hexString);
extern NSData * decodeDataWithKey (NSData * thedata, NSString * key);

@implementation ApplicationRouting

"""

FOOTER ="""
@end
"""

random.seed(time.time())

class Compiler(object):
	
	def __init__(self,appid,project_dir,encrypt,debug):
		self.encrypt = encrypt
		self.debug = debug
		self.template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
		self.encryptor = os.path.abspath(os.path.join(self.template_dir,"../","encryptor"))
		if not os.path.exists(self.encryptor):
			self.encryptor = os.path.abspath(os.path.join(self.template_dir,"../osx","encryptor"))
		if not os.path.exists(self.encryptor):
			raise Exception("couldn't find needed file: %s" % self.encryptor)	
		self.appid = appid
		self.project_dir = os.path.abspath(os.path.expanduser(project_dir))
		self.resources_dir = os.path.join(project_dir,'Resources')
		self.classes_dir = os.path.join(self.project_dir,'build','iphone','Classes')
		self.temp_build_dir = os.path.join(self.project_dir,'build','iphone','tmp')
		
	def make_function_from_file(self,path,file):
	
		fp = os.path.splitext(path)
		basename = fp[0].replace(' ','_').replace('/','_').replace('-','_').replace('.','_').replace('+','_')
		ext = fp[1][1:]

		filetype = ''
		contents = ''
	
		if ext=='html':
			filetype = 'page'
		elif ext=='css':
			filetype = 'style'
		elif ext=='js':
			filetype = 'script'	
	
		file_contents = open(os.path.expanduser(file)).read()

		# minimize javascript, css files
		if ext == 'js':
			file_contents = jspacker.jsmin(file_contents)
		elif ext == 'css':
			packer = CSSPacker(file_contents)
			file_contents = packer.pack()
		
		data = str(file_contents).encode("hex")
		method = "dataWithHexString(@\"%s\")" % data
		return {'method':method,'path':path}

	def compile(self):
		
		intf = open(os.path.join(self.classes_dir,'ApplicationRouting.h'),'w+')
		impf = open(os.path.join(self.classes_dir,'ApplicationRouting.m'),'w+')

		intf.write(HEADER)
		intf.write(INTERFACE_HEADER)

		impf.write(HEADER)
		impf.write(IMPL_HEADER)

		impf.write("+ (NSData*) resolveAppAsset:(NSString*)path;\n{\n")
		impf.write("     static NSMutableDictionary *map;\n")
		impf.write("     if (map==nil)\n")
		impf.write("     {\n")
		impf.write("         map = [[NSMutableDictionary alloc] init];\n")

		impf_buffer = ''
		c = 0
		
		# transform resources
		def strip_slash(s):
			if s[0:1]=='/': return s[1:]
			return s
		
		def recursive_cp(source, target):
			print "[DEBUG] copy resources from %s to %s" % (source,target)
			if not os.path.exists(os.path.expanduser(target)):
				os.mkdir(os.path.expanduser(target))
			for root, dirs, files in os.walk(source):
				for name in ignoreDirs:
					if name in dirs:
						dirs.remove(name)	# don't visit ignored directories			  
				for file in files:
					if file in ignoreFiles:
						continue
					from_ = os.path.join(root, file)			  
					to_ = os.path.expanduser(from_.replace(source, target, 1))
					to_directory = os.path.expanduser(os.path.split(to_)[0])
					if not os.path.exists(to_directory):
						os.makedirs(to_directory)
					# only copy if different filesize or doesn't exist
					if not os.path.exists(to_) or os.path.getsize(from_)!=os.path.getsize(to_):
						print "[DEBUG] copying: %s to %s" % (from_,to_)
						shutil.copyfile(from_, to_)	
	
		if os.path.exists(self.temp_build_dir):
			shutil.rmtree(self.temp_build_dir)
		os.makedirs(self.temp_build_dir)
		recursive_cp(self.resources_dir,self.temp_build_dir)
		if os.path.exists(os.path.join(self.temp_build_dir,'android')):
			shutil.rmtree(os.path.join(self.temp_build_dir,'android'))
		if os.path.exists(os.path.join(self.temp_build_dir,'iphone')):
			recursive_cp(os.path.join(self.resources_dir,'iphone'),self.temp_build_dir)		
			shutil.rmtree(os.path.join(self.temp_build_dir,'iphone'))

		for root, dirs, files in os.walk(self.temp_build_dir):
			if len(files) > 0:
				prefix = root[len(self.temp_build_dir):]
				for f in files:
					fp = os.path.splitext(f)
					if len(fp)!=2: continue
					if not fp[1] in ['.html','.js','.css']: continue
					path = prefix + os.sep + f
					path = path[1:]
					fullpath = os.path.join(self.temp_build_dir,path)
					metadata = self.make_function_from_file(path,fullpath)
					method = metadata['method']
					eq = path.replace('.','_')
					impf.write('         [map setObject:%s forKey:@"%s"];\n' % (method,eq))
					c = c+1

				
		impf.write("     }\n")
		impf.write("     return [map objectForKey:path];\n")
		impf.write('}\n')
		impf.write(impf_buffer)

		intf.write(FOOTER)
		impf.write(FOOTER)

		intf.close()
		impf.close()

