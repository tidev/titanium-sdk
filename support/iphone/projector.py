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
		self.namespace = self.make_self(name)
		self.namespace_upper = self.namespace.upper()+'_'

	def form_target_filename(self,fn):
		target = fn
		target = target.replace('TitaniumModule','%s$Module'%self.namespace)
		target = target.replace('TitaniumViewController','%s$ViewController'%self.namespace)
		for symbol in symbolicMap:
			target = target.replace(symbol,self.namespace)
		target = target.replace('%sme'%self.namespace,'Time')
		return target
				
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
		for root, dirs, files in os.walk(source):
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
				 	if os.path.exists(to_): os.remove(to_)
					print "[DEBUG] copying: %s => %s" % (from_,to_)
				 	copyfile(from_, to_)

	def remove_xcode_products(self,content):
		# remove all products except for the main iphone/ipad app
		content = content.replace('24CB0C9A111A96EE00A813AD /* lib%s.a */,\n' % self.namespace,'')
		content = content.replace('24CA904111116C490084E2DE /* %s.app */,\n' % self.namespace,'')
		content = content.replace('2461CF0E1151D856007A4CC9 /* %s-iPad.app */,\n' % self.namespace,'')
		return content
		
	def fix_xcode_script(self,content,script_name,script_contents):
		# fix up xcode compile scripts in build phase
		start = 0
		while start >= 0:
			start = content.find("name = \"%s\";" % script_name, start)	
			if start > 0:
				begin = content.find("shellScript = ",start)
				if begin > 0:
					end = content.find("};",begin+1)
					if end > 0:
						before = content[0:begin+15]
						after = content[end:]
						script = "%s\";\n                " % script_contents
						content = before + script + after
						start = begin
		return content
	
	def fix_xcode_resources(self,content):
		content = content.replace('24CA8D1C111169A00084E2DE /* %s-Terrordom-Info.plist */,\n'%self.namespace,'')
		return content
				
	def fix_xcode_targets(self,content):
		a = content.find('targets = ')
		b = content.find(');',a+9)
		before = content[0:a]
		after = content[b+2:]
		middle = 'targets = (\n                                1D6058900D05DD3D006BFB54 /* %s */,\n                                2461CE231151D856007A4CC9 /* %s-iPad */,\n                        );' % (self.namespace,self.namespace)
		return before + middle + after
		
	def process_xcode(self,content):
		content = content.replace('../Classes','Classes')
		content = content.replace('../Resources','Resources')
		content = content.replace('../headers/%sCore'%self.namespace,'headers/TiCore')
		content = content.replace('../headers','headers')
		content = content.replace('../lib','lib')
		content = content.replace('-KitchenSink','')
		content = content.replace('Titanium-iPad','%s-iPad'%self.namespace)
		content = content.replace('%s.plist'%self.namespace,'Info.plist')
		content = self.remove_xcode_products(content)
		content = self.fix_xcode_targets(content)
		content = self.fix_xcode_resources(content)
		
		builder_py = os.path.abspath(os.path.join(self.sdk_root,"builder.py"))
		pre_compile_script = "\\\"%s\\\" xcode \\\"%s\\\"\\nexit $?" % (builder_py,self.project_root)
		
		content = self.fix_xcode_script(content,"Pre-Compile",pre_compile_script)
		content = self.fix_xcode_script(content,"Post-Compile","echo 'post-compile'")
		return content
	
	def create(self,in_dir,out_dir):
		if not os.path.exists(out_dir):
			os.makedirs(out_dir)
	
		for dir_ in ['Classes','lib','Resources','headers']:		
			from_ = os.path.join(in_dir,dir_)
			to_ = os.path.join(out_dir,dir_)
			self.copy_module_resources(from_,to_)
		
		copyfile(os.path.join(in_dir,'iphone','Titanium_Prefix.pch'),os.path.join(out_dir,'%s_Prefix.pch'%self.namespace))
		copyfile(os.path.join(in_dir,'iphone','Titanium.plist'),os.path.join(out_dir,'%s.plist'%self.namespace))
		
		xcode_dir = os.path.join(out_dir,'%s.xcodeproj'%self.namespace)	
		if not os.path.exists(xcode_dir):
			os.makedirs(xcode_dir)
		xcode_proj = os.path.join(xcode_dir,'project.pbxproj')
		src_xcode_proj = os.path.join(in_dir,'iphone','Titanium.xcodeproj','project.pbxproj')
		self.process_file(src_xcode_proj,xcode_proj,self.process_xcode)
		
		xib = os.path.join(out_dir,'MainWindow.xib')
		xib_file = open(xib,'w')
		xib_content = open(os.path.join(in_dir,'iphone','MainWindow.xib')).read()
		xib_content = xib_content.replace('Titanium',self.namespace)
		xib_content = xib_content.replace('../Classes','Classes')
		xib_file.write(xib_content)
		xib_file.close()
		
		xcconfig = os.path.join(out_dir,"project.xcconfig")
		xcconfig = open(xcconfig,'w')
		xcconfig.write("TI_VERSION=%s\n" % self.sdk_version)
		xcconfig.write("TI_SDK_DIR=%s\n" % self.sdk_root.replace(self.sdk_version,'$(TI_VERSION)'))
		xcconfig.write("TI_PROJECT_DIR=%s\n" % self.project_root)
		xcconfig.write("TI_APPID=%s\n" % self.project_id)
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
	main([sys.argv[0],"Foo Bar","1.3.0","/Users/jhaynie/work/titanium_mobile/iphone","/Users/jhaynie/tmp/one_three"])



