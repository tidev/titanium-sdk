#!/usr/bin/env python
#
# Appcelerator Titanium Mobile
# Copyright (c) 2009 Appcelerator, Inc. All Right Reserved.
#
# This code is proprietary to Appcelerator and should not
# be redistributed without expression written permission of
# Appcelerator.
#
# Resource to Objective-C Page Compiler
# Handles JS, CSS and HTML files only
#
import os, sys, base64, subprocess, random, time, re, shutil
import jspacker 
from csspacker import CSSPacker

HEADER = """/**
 * Appcelerator Titanium Mobile
 * This is generated code. Do not modify. Your changes will be lost.
 * Generated code is Copyright (c) 2009 by Appcelerator, Inc.
 * All Rights Reserved.
 */
#import <Foundation/Foundation.h>
"""

INTERFACE_HEADER= """
@protocol TitaniumAppAssetResolver
- (NSData*) resolveAppAsset:(NSURL*)url;
- (oneway void)release;
- (id)retain;
@end

@interface ApplicationRouting : NSObject<TitaniumAppAssetResolver> {
}
- (NSData*) resolveAppAsset:(NSURL*)url;
"""

IMPL_HEADER= """#import "ApplicationRouting.h"

extern NSData * decode64(NSData * data);
extern NSData * dataWithHexString(NSString * hexString);
extern NSData * AES128DecryptWithKey(NSData * data, NSString * key);

@implementation ApplicationRouting

-(oneway void)release
{
	[super release];
}

-(id)retain
{
	return [super retain];
}

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
		# these modules are always required 
		self.modules = ['App','API','Network','Platform','Analytics']

	def extract_modules(self,out):
		for line in out.split(';'):
			f = re.findall(r'Titanium\.(\w+)',line)
			if len(f) > 0:
				for sym in f:
					# skip Titanium.version, Titanium.userAgent and Titanium.name since these
					# properties are not modules
					if sym == 'version' or sym == 'userAgent' or sym == 'name':
						continue
					try:
						self.modules.index(sym)
					except:	
						self.modules.append(sym)
		
	def make_function_from_file(self,path,file):
	
		fp = os.path.splitext(path)
		basename = fp[0].replace(' ','_').replace('/','_').replace('-','_').replace('.','_').replace('+','_')
		ext = fp[1][1:]

		url = 'app://%s/%s' % (self.appid,path)

		filetype = ''
		contents = ''
	
		if ext=='html':
			filetype = 'page'
		elif ext=='css':
			filetype = 'style'
		elif ext=='js':
			filetype = 'script'	
	
		methodname = "%sNamed%s%s" % (filetype,basename[0:1].upper(),basename[1:])
		method_define = "- (NSData*) %s;" % methodname
	
		seed = random.randint(1,9)
		key = "%s%d%s" % (self.appid,seed,methodname)
	
		file_contents = open(os.path.expanduser(file)).read()
		_file_contents = file_contents

		# minimize javascript, css files
		if ext == 'js':
			file_contents = jspacker.jsmin(file_contents)
		elif ext == 'css':
			packer = CSSPacker(file_contents)
			file_contents = packer.pack()
		
		# determine which modules this file is using
		self.extract_modules(file_contents)

		if self.debug and ext == 'js':
			file_contents = """
try
{
%s
}
catch(__ex__)
{
  if (typeof __ex__ == 'string')
  {
     var msg = __ex__
     __ex__ = {line:3,sourceURL:'%s',message:msg};
  }
  var _sur = __ex__.sourceURL;
  if (_sur)
  {
    _sur = _sur.substring(%d);
  }
  Titanium.API.reportUnhandledException(__ex__.line-3,_sur,__ex__.message);
}
""" % (_file_contents,url,len('app://%s/'%self.appid))

		if self.encrypt:		
			out = subprocess.Popen([self.encryptor,file,key], stderr=subprocess.PIPE, stdout=subprocess.PIPE).communicate()[0]
			data = str(out).strip()
			method = """
	#pragma mark %s
	// %s
	%s
	{
	   NSString *k1 = @"%s";
	   int seed = %d;
	   NSString *k2 = @"%s";
	   NSData *d = AES128DecryptWithKey(dataWithHexString(@"%s"), [NSString stringWithFormat:@"%%@%%d%%@",k1,seed,k2]);
	   if ([d length] == 0) return nil;
	   return decode64(d);
	}
			""" % (url,file,method_define,self.appid,seed,methodname,data)
		else:
			sys.stdout.flush()
			data = str(file_contents).encode("hex")
			method = """
	#pragma mark %s
	// %s
	%s
	{
		NSData *d = dataWithHexString(@"%s");
	   	if ([d length] == 0) return nil;
		return d;
	}
			""" % (url,file,method_define,data)
			
		return {'name':methodname,'method':method,'define':method_define,'url':url,'path':path}

	def compile(self):
		
		intf = open(os.path.join(self.classes_dir,'ApplicationRouting.h'),'w+')
		impf = open(os.path.join(self.classes_dir,'ApplicationRouting.m'),'w+')

		intf.write(HEADER)
		intf.write(INTERFACE_HEADER)

		impf.write(HEADER)
		impf.write(IMPL_HEADER)

		impf.write("- (NSData*) resolveAppAsset:(NSURL*)url;\n{\n")
		impf.write("   NSString *urlStr = [url absoluteString];\n\n")

		impf_buffer = ''
		c = 0
		
		# transform resources
		def strip_slash(s):
			if s[0:1]=='/': return s[1:]
			return s
		def recursive_cp(dir,dest):
			for root, dirs, files in os.walk(dir):
				relative = strip_slash(root.replace(dir,''))
				relative_dest = os.path.join(dest,relative)
				if not os.path.exists(relative_dest):
					os.makedirs(relative_dest)
				for f in files:
					fullpath = os.path.join(root,f)
					relativedest = os.path.join(dest,relative,f)
					shutil.copy(fullpath,relativedest)
				
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
					intf.write(metadata['define'])
					intf.write('\n')
					impf_buffer+=metadata['method']
			
					eq = '[NSString stringWithFormat:@"app%%s//%%@/%%@",":",@"%s",@"%s"]' % (self.appid,metadata['path'])
					if c > 0:
						impf.write('   else if ([urlStr isEqualToString:%s]){\n     return [self %s];\n   }\n' % (eq,metadata['name']))
					else:
						impf.write('   if ([urlStr isEqualToString:%s]){\n     return [self %s];\n   }\n' % (eq,metadata['name']))

					c = c+1

				
		impf.write('   else {\n     return nil;\n   }\n')
		impf.write('}\n')
		impf.write(impf_buffer)

		intf.write(FOOTER)
		impf.write(FOOTER)

		intf.close()
		impf.close()

