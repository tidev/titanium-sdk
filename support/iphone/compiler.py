#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Project Compiler
#

import os, sys, re, shutil, time, base64, run, sgmllib, codecs

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sys.path.append(os.path.join(template_dir,'../'))

from tiapp import *
import jspacker 
from csspacker import CSSPacker

ignoreFiles = ['.gitignore', '.cvsignore', '.DS_Store'];
ignoreDirs = ['.git','.svn','_svn','CVS','android','iphone'];

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

MODULE_IMPL_HEADER = """#import "ApplicationMods.h"

@implementation ApplicationMods

+ (NSArray*) compiledMods
{
	NSMutableArray *modules = [NSMutableArray array];
"""

class HTMLParser(sgmllib.SGMLParser):

    def parse(self, s):
        self.feed(s)
        self.close()

    def __init__(self, verbose=0):
        sgmllib.SGMLParser.__init__(self, verbose)
        self.scripts = []

    def start_script(self, attributes):
        for name, value in attributes:
            if name == "src":
                self.scripts.append(value)

    def get_scripts(self):
        return self.scripts

def read_module_properties(dir):
	file = os.path.join(dir,'manifest')
	dict = {}
	if os.path.exists(file):
		contents = open(file).read()
		for line in contents.splitlines(True):
			if line[0:1]=='#': continue
			idx = line.find(':')
			if idx==-1: continue
			k=line[0:idx]
			v=line[idx+1:].strip()
			dict[k]=v
	return dict

#
# TODO/FIXME
#
# - encryptor
#
	
class Compiler(object):
	
	def __init__(self,project_dir,appid,name,deploytype,xcode,devicefamily,iphone_version,silent=False):
		self.project_dir = project_dir
		self.project_name = name
		self.appid = appid
		self.iphone_dir = os.path.join(project_dir,'build','iphone')
		self.classes_dir = os.path.join(self.iphone_dir,'Classes')
		self.modules = []
		self.modules_metadata = []
		
		# for now, these are required
		self.defines = ['USE_TI_ANALYTICS','USE_TI_NETWORK','USE_TI_PLATFORM','USE_TI_UI']

		tiapp_xml = os.path.join(project_dir,'tiapp.xml')
		ti = TiAppXML(tiapp_xml)
		sdk_version = os.path.basename(os.path.abspath(os.path.join(template_dir,'../')))
		
		if xcode:
			app_name = os.environ['FULL_PRODUCT_NAME']
			app_dir = os.path.join(os.environ['TARGET_BUILD_DIR'],os.environ['CONTENTS_FOLDER_PATH'])
		else:
			target = 'Debug'
			if deploytype == 'install':
				target = 'Release'
			app_name = name+'.app'
			app_folder_name = '%s-iphoneos' % target
			app_dir = os.path.abspath(os.path.join(self.iphone_dir,'build',app_folder_name,app_name))
		
		main_template_file = os.path.join(template_dir,'main.m')
		main_template = codecs.open(main_template_file, encoding='utf-8').read()
		main_template = main_template.replace('__PROJECT_NAME__',name)
		main_template = main_template.replace('__PROJECT_ID__',appid)
		main_template = main_template.replace('__DEPLOYTYPE__',deploytype)
		main_template = main_template.replace('__APP_ID__',appid)
		main_template = main_template.replace('__APP_ANALYTICS__',ti.properties['analytics'])
		main_template = main_template.replace('__APP_PUBLISHER__',ti.properties['publisher'])
		main_template = main_template.replace('__APP_URL__',ti.properties['url'])
		main_template = main_template.replace('__APP_NAME__',ti.properties['name'])
		main_template = main_template.replace('__APP_VERSION__',ti.properties['version'])
		main_template = main_template.replace('__APP_DESCRIPTION__',ti.properties['description'])
		main_template = main_template.replace('__APP_COPYRIGHT__',ti.properties['copyright'])
		main_template = main_template.replace('__APP_GUID__',ti.properties['guid'])
		if deploytype=='development':
			main_template = main_template.replace('__APP_RESOURCE_DIR__',os.path.abspath(os.path.join(project_dir,'Resources')))
		else:
			main_template = main_template.replace('__APP_RESOURCE_DIR__','')

		if not silent:
			print "[INFO] Titanium SDK version: %s" % sdk_version
			print "[INFO] iPhone Device family: %s" % devicefamily
			print "[INFO] iPhone SDK version: %s" % iphone_version
		
		main_template_out = os.path.join(self.iphone_dir,'main.m')	
		main_file = codecs.open(main_template_out,'w+',encoding='utf-8')
		main_file_contents = main_file.read()
		if main_file_contents!=main_template:
			main_file.write(main_template)
			main_file.close()
		
		if deploytype == 'production':
			version = ti.properties['version']
			# we want to make sure in debug mode the version always changes
			version = "%s.%d" % (version,time.time())
			ti.properties['version']=version

		resources_dir = os.path.join(project_dir,'Resources')
		iphone_resources_dir = os.path.join(resources_dir,'iphone')

		# copy in any resources in our module like icons
		project_module_dir = os.path.join(project_dir,'modules','iphone')
		if os.path.exists(project_module_dir):
			self.copy_resources([project_module_dir],app_dir,False)
		
		# we have to copy these even in simulator given the path difference
		if os.path.exists(app_dir):
			self.copy_resources([iphone_resources_dir],app_dir,False)

		# generate the includes for all compiled modules
		xcconfig_c = "// this is a generated file - DO NOT EDIT\n\n"
		module_root = os.path.abspath(os.path.join(template_dir,"..","..","..","..","modules","iphone"))
		has_modules = False
		
		if os.path.exists(module_root):
			modules = ti.properties['modules']
			if len(modules) > 0:
				mods = open(os.path.join(self.classes_dir,'ApplicationMods.m'),'w+')
				mods.write(MODULE_IMPL_HEADER)
				for module in modules:
					tp_name = module['name'].lower()
					tp_version = module['version']
					tp_dir = os.path.join(module_root,tp_name,tp_version)
					if os.path.exists(tp_dir):
						tp_props = read_module_properties(tp_dir)
					else:
						# must be a local module, just fudge
						tp_props = {'name':tp_name,'moduleid':tp_name}
					tp_module_name = tp_props['name']
					tp_module_id = tp_props['moduleid']
					tp_guid = ''
					tp_licensekey = ''
					if tp_props.has_key('guid'):
						tp_guid = tp_props['guid']
					if tp_props.has_key('licensekey'):
						tp_licensekey = tp_props['licensekey']
					self.modules_metadata.append({'guid':tp_guid,'name':tp_module_name,'id':tp_module_id,'dir':tp_dir,'version':tp_version,'licensekey':tp_licensekey})
					xcfile = os.path.join(module_root,tp_name,tp_version,"module.xcconfig")
					if os.path.exists(xcfile):
						xcconfig_c+="#include \"%s\"\n" % xcfile
					xcfile = os.path.join(self.project_dir,'modules','iphone',"%s.xcconfig" % tp_name)
					if os.path.exists(xcfile):
						xcconfig_c+="#include \"%s\"\n" % xcfile
					mods.write("	[modules addObject:[NSDictionary dictionaryWithObjectsAndKeys:@\"%s\",@\"name\",@\"%s\",@\"moduleid\",@\"%s\",@\"version\",@\"%s\",@\"guid\",@\"%s\",@\"licensekey\",nil]];\n" % (tp_module_name,tp_module_id,tp_version,tp_guid,tp_licensekey));
				mods.write("	return modules;\n")	
				mods.write("}\n")
				mods.write(FOOTER)		
				mods.close()
				has_modules = True
				xcconfig = os.path.join(self.iphone_dir,"module.xcconfig")
				make_xcc = True
				if os.path.exists(xcconfig):
					existing_xcc = open(xcconfig).read()
					# only copy if different so we don't trigger re-compile in xcode
					make_xcc = existing_xcc!=xcconfig_c
				if make_xcc:		
					xcconfig = open(xcconfig,'w')
					xcconfig.write(xcconfig_c)
					xcconfig.close()
			

		if deploytype=='simulator':
			shutil.copy(os.path.join(template_dir,'Classes','defines.h'),os.path.join(self.classes_dir,'defines.h'))
		
		if deploytype!='development' or has_modules:

			if os.path.exists(app_dir):
				self.copy_resources([resources_dir],app_dir)
				
			if deploytype!='development':	
				defines_file = os.path.join(self.classes_dir,'defines.h')
				defines_header = open(defines_file,'w+')
				defines_content = "// Warning: this is generated file. Do not modify!\n\n"
				defines_content+= "#define TI_VERSION %s\n"%sdk_version
				for sym in self.defines:
					defines_content+="#define %s 1\n"%sym
				if defines_content!=defines_header.read():
					defines_header.write(defines_content)
					defines_header.close()	

			# deploy any module image files 
			for module in self.modules:
				img_dir = os.path.join(template_dir,'modules',module.lower(),'images')
				print "[DEBUG] module image = %s" % img_dir
				if not os.path.exists(img_dir): continue
				dest_img_dir = os.path.join(app_dir,'modules',module.lower(),'images')
				if not os.path.exists(dest_img_dir):
					os.makedirs(dest_img_dir)
				self.copy_resources([img_dir],dest_img_dir,False)
			
			
			if deploytype!='development' and os.path.exists(app_dir):
				# optimize PNGs - since we don't include them in the Resources of the xcodeproj
				# the ones we copy in won't get optimized so we need to run it manually
				# we can skip this on the simulator but should do it on device
				dev_path = "/Developer"
				# we need to ask xcode where the root path is
				path = run.run(["/usr/bin/xcode-select","-print-path"],True,False)
				if path:
					dev_path = path.strip()
				run.run(["%s/Platforms/iPhoneOS.platform/Developer/usr/bin/iphoneos-optimize"%dev_path,app_dir],False)
				
				# remove empty directories
				os.chdir(app_dir)
				os.system("find . -type d -empty -delete")
			
		else:
			print "[INFO] Skipping JS compile, running from simulator"
	
	
	def add_symbol(self,api):
		print "[DEBUG] detected symbol: %s" % api
		curtoken = ''
		tokens = api.split(".")
		try:
			self.modules.index(tokens[0])
		except:
			self.modules.append(tokens[0])
		for token in tokens:
			curtoken+=token+"."
			symbol = 'USE_TI_%s' % (curtoken.replace('.create','').replace('.','').replace('-','_').upper())
			try:
				self.defines.index(symbol)
			except:
				self.defines.append(symbol)
			
	def extract_tokens(self,sym,line):
		# sloppy joe parsing coooode
		# could be prettier and faster but it works and rather reliable
		c = 0
		tokens = []
		search = sym + "."
		size = len(search)
		while True:
			i = line.find(search,c)
			if i < 0:
				break
			found = False
			buf = ''
			x = 0
			for n in line[i+size:]:
				# look for a terminal - this could probably be easier
				if n in ['(',')','{','}','=',',',' ',':','!','[',']','+','*','/','~','^','%','\n','\t','\r']:
					found = True
					break
				buf+=n
				x+=1
			tokens.append(buf)
			if found:
				c = i + x + 1
				continue
			break
		return tokens	
	
	def compile_js(self,file_contents):
		for line in file_contents.split(';'):
			for symbol in ('Titanium','Ti'):
				for sym in self.extract_tokens(symbol,line):
					self.add_symbol(sym)
	
	def process_html_files(self,data,source_root):
		compile = []
		if data.has_key('.js'):
			for entry in data['.html']:
				html_file = entry['from'] 
				file_contents = open(os.path.expanduser(html_file)).read()
				parser = HTMLParser()
				parser.parse(file_contents)
				# extract all our scripts that are dependencies and we 
				# don't compile these
				scripts = parser.get_scripts()
				if len(scripts) > 0:
					js_files = data['.js']
					for script in scripts:
						# if a remote script, ignore
						if script.startswith('http:') or script.startswith('https:'):
							continue
						if script.startswith('app://'):
							script = script[6:]
						# build a file relative to the html file
						fullpath = os.path.abspath(os.path.join(os.path.dirname(html_file),script))
						# remove this script from being compiled
						for f in js_files:
							if f['from']==fullpath: 
								# target it to be compiled
								compile.append(f)
								js_files.remove(f)
								break
		return compile
				
	@classmethod	
	def make_function_from_file(cls,path,file,instance=None):
		file_contents = open(os.path.expanduser(file)).read()
		file_contents = jspacker.jsmin(file_contents)
		file_contents = file_contents.replace('Titanium.','Ti.')
		if instance: instance.compile_js(file_contents)
		data = str(file_contents).encode("hex")
		method = "dataWithHexString(@\"%s\")" % data
		return {'method':method,'path':path}
	
	def copy_resources(self,sources,target,write_routing=True):
		
		if write_routing:
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
		
		if not os.path.exists(os.path.expanduser(target)):
			os.makedirs(os.path.expanduser(target))
			
		def add_compiled_resources(source,target):
			print "[DEBUG] copy resources from %s to %s" % (source,target)
			compiled_targets = {}
			for root, dirs, files in os.walk(source):
				for name in ignoreDirs:
					if name in dirs:
						dirs.remove(name)	# don't visit ignored directories			  
				for file in files:
					if file in ignoreFiles:
						continue					
					prefix = root[len(source):]
					from_ = os.path.join(root, file)			  
					to_ = os.path.expanduser(from_.replace(source, target, 1))
					to_directory = os.path.expanduser(os.path.split(to_)[0])
					if not os.path.exists(to_directory):
						os.makedirs(to_directory)
					fp = os.path.splitext(file)
					ext = fp[1]
					if ext == '.jss': continue
					if len(fp)>1 and write_routing and ext in ['.html','.js','.css']:
						path = prefix + os.sep + file
						path = path[1:]
						entry = {'path':path,'from':from_,'to':to_}
						if compiled_targets.has_key(ext):
							compiled_targets[ext].append(entry)
						else:
							compiled_targets[ext]=[entry]
					else:
						# only copy if different filesize or doesn't exist
						if not os.path.exists(to_) or os.path.getsize(from_)!=os.path.getsize(to_):
							print "[DEBUG] copying: %s to %s" % (from_,to_)
							shutil.copyfile(from_, to_)	
		
			if compiled_targets.has_key('.html'):
				compiled = self.process_html_files(compiled_targets,source)
				if len(compiled) > 0:
					for c in compiled:
						from_ = c['from']
						to_ = c['to']
						path = c['path']
						print "[DEBUG] copying: %s to %s" % (from_,to_)
						file_contents = open(from_).read()
						file_contents = jspacker.jsmin(file_contents)
						file_contents = file_contents.replace('Titanium.','Ti.')
						to = open(to_,'w')
						to.write(file_contents)
						to.close()
						
			for ext in ('.css','.html'):
				if compiled_targets.has_key(ext):
					for css_file in compiled_targets[ext]:
						from_ = css_file['from']
						to_ = css_file['to']
						print "[DEBUG] copying: %s to %s" % (from_,to_)
						if path.endswith('.css'):
							file_contents = open(from_).read()
							packer = CSSPacker(file_contents)
							file_contents = packer.pack()
							to = open(to_,'w')
							to.write(file_contents)
							to.close()
						else:
							shutil.copyfile(from_, to_)	
			
			if compiled_targets.has_key('.js'):	
				for js_file in compiled_targets['.js']:
					path = js_file['path']
					from_ = js_file['from']
					to_ = js_file['to']
					print "[DEBUG] compiling: %s" % from_
					metadata = Compiler.make_function_from_file(path,from_,self)
					method = metadata['method']
					eq = path.replace('.','_')
					impf.write('         [map setObject:%s forKey:@"%s"];\n' % (method,eq))
		
		# copy in any module assets
		for metadata in self.modules_metadata:
			tp_dir = os.path.join(metadata['dir'],'assets')
			if not os.path.exists(tp_dir): continue
			tp_id = metadata['id']
			t = '%s/modules/%s' %(target,tp_id)
			add_compiled_resources(tp_dir,t)
				
		for source in sources:
			add_compiled_resources(source,target)
						
		if write_routing:
			impf.write("     }\n")
			impf.write("     return [map objectForKey:path];\n")
			impf.write('}\n')
			impf.write(impf_buffer)

			intf.write(FOOTER)
			impf.write(FOOTER)

			intf.close()
			impf.close()
		
if __name__ == "__main__":
	project_dir = os.path.expanduser("~/tmp/yoyoyo")
	appid = "com.appcelerator.yoyoyo"
	name = "Yo Yo Yo"
	deploytype = 'development'
	xcode = False
	c = Compiler(project_dir,appid,name,deploytype,xcode)
	
	
