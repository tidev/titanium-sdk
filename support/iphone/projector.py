#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# XCode Project Creator
#

import os, sys, re, shutil, codecs
from shutil import copyfile
from os.path import join, splitext, split, exists
from datetime import date

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))

from tools import *
	
fileTargets = ['.c','.cpp','.h','.m','.mm','.pbxproj']
ignoreFiles = ['.gitignore', '.cvsignore','bridge.txt','libTitanium.a']
ignoreDirs = ['.git','.svn', 'CVS']
symbolicMap = ['Titanium','Appcelerator']
exclusions = ['TiCore']

class Projector(object):
	
	def make_self(self,s):
		r = re.compile('[0-9a-zA-Z_]')
		buf = ''
		for i in s:
			if i=='-':
				buf+='_'
				continue
			if r.match(i)!=None:
				buf+=i
		# if name starts with number, we simply append a k to it
		if re.match('^[0-9]+',buf):
			buf = 'k%s' % buf
		return buf
		
	def __init__(self,name,sdk_version,sdk_root,project_root,appid):
		self.sdk_version = sdk_version
		self.sdk_root = os.path.abspath(sdk_root)
		self.project_root = os.path.abspath(project_root)
		self.project_id = appid
		self.name = name
		self.namespace = self.make_self(name)
		self.namespace_upper = self.namespace.upper()+'_'

	def form_target_filename(self,fn):
		return fn
				
	def process_file(self,source,target,cb=None):
	
		for exclude in exclusions:
			if source.find(exclude)>0:
				return False
				
		# first deal with the filename
		target_filename = self.form_target_filename(target)
		
		print "[DEBUG] processing %s => %s" % (source,target_filename)

		content = codecs.open(source,'r','utf-8','replace').read()
	
		# fixup special case
		content = content.replace('TitaniumViewController','%s$ViewController'%self.namespace)
		content = content.replace('TitaniumModule','%s$Module'%self.namespace)
	
		for symbol in symbolicMap:
			content = content.replace(symbol,self.namespace)
	
		# fixup titanium vars
		content = content.replace('titanium','_%s'%self.namespace.lower())
	
		# fixup double module replacement
		content = content.replace('%s%sModule' %(self.namespace,self.namespace),'%sModule'%self.namespace)
		content = content.replace('%s%s$Module' %(self.namespace,self.namespace),'%s$Module'%self.namespace)
	
		# fixup namespaces
		content = content.replace('org.appcelerator','org.%s'%self.namespace.lower())
		content = content.replace('com.appcelerator','com.%s'%self.namespace.lower())
	
		# fixup Copyright
		content = content.replace('* %s %s Mobile'%(self.namespace,self.namespace),'* Appcelerator Titanium Mobile')
		content = content.replace('* Copyright (c) 2009-2010 by %s, Inc.'%(self.namespace),'* Copyright (c) 2009-%s by Appcelerator, Inc.' % date.today().strftime('%Y'))
			
		content = content.replace("""* Please see the LICENSE included with this distribution for details.
 */""",	"""* Please see the LICENSE included with this distribution for details.
 * 
 * WARNING: This is generated code. Modify at your own risk and without support.
 */""")
		
		if cb!=None:
			content = cb(content)

		target_file = codecs.open(target_filename,'w','utf-8','replace')
		target_file.write(content)
		target_file.close()
	
		# then deal with the contents
		return True
		
	def copy_module_resources(self, source, target):
		if not os.path.exists(os.path.expanduser(target)):
			os.mkdir(os.path.expanduser(target))
		for root, dirs, files in os.walk(source, True, None, True):
			for name in ignoreDirs:
				if name in dirs:
					dirs.remove(name)	# don't visit ignored directories
			for file_ in files:
				if file_ in ignoreFiles:
					continue
				from_ = join(root, file_)
				to_ = os.path.expanduser(from_.replace(source, target, 1))
				to_directory = os.path.expanduser(split(to_)[0])
				if not exists(to_directory):
					os.makedirs(to_directory)
				processed = False
				if splitext(file_)[-1] in fileTargets:
					processed = self.process_file(from_,to_)	
				if not processed:	
				 	if os.path.exists(to_):
				 		os.remove(to_)
				 	print "[DEBUG] copying: %s => %s" % (from_,to_)
				 	copyfile(from_, to_)
	
	def process_xcode(self,content):
		content = content.replace('../Classes','Classes')
		content = content.replace('../Resources','Resources')
		content = content.replace('../headers/%sCore'%self.namespace,'headers/TiCore')
		content = content.replace('../headers','headers')
		content = content.replace('../lib','lib')
		
		content = content.replace('Titanium.plist','Info.plist')
		content = content.replace('Titanium',self.namespace)
		
		content = content.replace('%s-KitchenSink' % self.namespace, self.name)

		content = content.replace('path = %s.app;' % self.namespace, 'path = "%s.app";'%self.name)
		content = content.replace('PRODUCT_NAME = %s'%self.namespace,'PRODUCT_NAME = "%s"'%self.name)
		content = content.replace('PRODUCT_NAME = %s-iPad'%self.namespace,'PRODUCT_NAME = "%s"'%self.name)
		content = content.replace('PRODUCT_NAME = "%s-iPad"'%self.namespace,'PRODUCT_NAME = "%s"'%self.name)
		content = content.replace('PRODUCT_NAME = %s-universal'%self.namespace,'PRODUCT_NAME = "%s"'%self.name)
		content = content.replace('PRODUCT_NAME = "%s-universal"'%self.namespace,'PRODUCT_NAME = "%s"'%self.name)		
		content = content.replace('Resources-iPad','Resources')
		content = content.replace('%s.app'%self.namespace,'%s.app'%self.name)
		content = content.replace('path = %s_Prefix.pch;'%self.namespace,'path = "%s_Prefix.pch";'%self.name)
		content = content.replace('%s_Prefix.pch'%self.namespace,'%s_Prefix.pch'%self.name)
		content = content.replace('GCC_PREFIX_HEADER = %s_Prefix.pch;'%self.name,'GCC_PREFIX_HEADER = "%s_Prefix.pch";'%self.name)
		
		builder_py = os.path.abspath(os.path.join(self.sdk_root,"builder.py"))
		pre_compile_script = "\\\"%s\\\" xcode\\nexit $?" % (builder_py)
		
		content = fix_xcode_script(content,"Pre-Compile",pre_compile_script)
		content = fix_xcode_script(content,"Post-Compile","echo 'post-compile'")
		return content
	
	def create(self,in_dir,out_dir):

		if not os.path.exists(out_dir):
			os.makedirs(out_dir)
	
		for dir_ in ['Classes','lib','Resources','headers']:		
			from_ = os.path.join(in_dir,dir_)
			to_ = os.path.join(out_dir,dir_)
			if not os.path.exists(to_): os.makedirs(to_)
			self.copy_module_resources(from_,to_)
		
		copyfile(os.path.join(in_dir,'iphone','Titanium_Prefix.pch'),os.path.join(out_dir,'%s_Prefix.pch'%self.name))
		copyfile(os.path.join(in_dir,'iphone','Titanium.plist'),os.path.join(out_dir,'Info.plist'))
		
		xcode_dir = os.path.join(out_dir,'%s.xcodeproj'%self.name)	
		if not os.path.exists(xcode_dir):
			os.makedirs(xcode_dir)
		xcode_proj = os.path.join(xcode_dir,'project.pbxproj')
		src_xcode_proj = os.path.join(in_dir,'iphone','Titanium.xcodeproj','project.pbxproj')
		# we do special processing here
		c = open(src_xcode_proj).read()
		c = self.process_xcode(c)
		f = codecs.open(os.path.join(out_dir,'%s.xcodeproj'%self.name,'project.pbxproj'),'w',encoding='utf-8')
		f.write(c)
		f.close()
		
		xcconfig = os.path.join(out_dir,"project.xcconfig")
		xcconfig = open(xcconfig,'w')
		xcconfig.write("TI_VERSION=%s\n" % self.sdk_version)
		xcconfig.write("TI_SDK_DIR=%s\n" % self.sdk_root.replace(self.sdk_version,'$(TI_VERSION)'))
		xcconfig.write("TI_APPID=%s\n" % self.project_id)
		xcconfig.write("OTHER_LDFLAGS[sdk=iphoneos*]=$(inherited) -weak_framework iAd\n")
		xcconfig.write("OTHER_LDFLAGS[sdk=iphonesimulator*]=$(inherited) -weak_framework iAd\n")
		xcconfig.write("#include \"module\"\n")
		xcconfig.close()

		xcconfig = os.path.join(out_dir,"module.xcconfig")
		xcconfig = open(xcconfig,'w')
		xcconfig.write("// this is a generated file - DO NOT EDIT\n\n")
		xcconfig.close()
		
		
		
def usage(args):
	print "%s <name> <in> <out>" % (os.path.basename(args[0]))
	sys.exit(-1)

def dequote(s):
	if s[0:1] == '"':
		return s[1:-1]
	return s
					
def main(args):

	if len(args) < 4:
		usage(args)
	
	name = dequote(args[1])
	version = dequote(args[2])
	sdk_root = os.path.expanduser(dequote(args[3]))
	project_root = os.path.expanduser(dequote(args[4]))

	p = Projector(name,version,sdk_root,project_root,"com.appcelerator.test")
	p.create(sdk_root,project_root)
	
	sys.exit(0)

if __name__ == "__main__":
	#main(sys.argv)
	main([sys.argv[0],"KitchenSink-iPad","1.3.0","/Library/Application Support/Titanium/mobilesdk/osx/1.3.0/iphone","/Users/jhaynie/tmp/one_three"])



