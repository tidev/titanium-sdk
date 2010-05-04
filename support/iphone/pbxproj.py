#
# This is a little class that will parse out an XCode project.pbxproj file 
# which is the proprietary metadata file for XCode projects
#
# Author: Jeff Haynie <jhaynie@appcelerator.com>
#

import os, uuid, sys, types
import StringIO

TOP_LEVEL_SECTIONS = ['PBXBuildFile','PBXFileReference']
MID_LEVEL_SECTIONS = ['PBXFrameworksBuildPhase','PBXGroup','PBXHeadersBuildPhase','PBXNativeTarget','PBXProject','PBXSourcesBuildPhase','XCBuildConfiguration','XCConfigurationList']


class PBXProj(object):

	def __init__(self):
		self.root_object = None
		
	def gen_uuid(self):
		genid = uuid.uuid4().__str__().upper().replace('-','')
		genid = genid[0:24]
		print genid
		return genid
	
	def extract_props(self,line):
		props = {}
		for token in line.split("; "):
			idx = token.find("=")
			key = token[0:idx].strip()
			val = token[idx+1:].strip()
			props[key]=val
		return props	
		
	def extract_section_entry(self,line):
		start = line.find("/* ")
		end = line.find(" */")
		if start < 0 or end < 0:
			return None
		guid = line[0:start].strip()
		tokens = line[start+3:end].strip().split(" ")
		filename = tokens[0]
		section_name = None
		if len(tokens) > 1:
			section_name = tokens[2]
		start = line.find("= {",end+3)
		end = line.rfind("; };")
		props = self.extract_props(line[start+3:end].strip())
		return {
			'guid':guid,
			'filename':filename,
			'section_name':section_name,
			'properties':props
		}
		
	def parse_out_section(self,content,name):
		start_text = "/* Begin %s section */" % name
		end_text = "/* End %s section */" % name
		start = content.find(start_text)
		end = content.find(end_text)
		if start < 0 or end < 0:
			return ''
		return content[start+len(start_text):end]
		
	def parse_detail(self,content,detail_name):
		guid = None
		typename = None
		properties = {}
		in_array = False
		in_section = False
		in_hash = False
		settings = None
		settings_name = None
		name = None
		items = None
		entries = []
		for line in self.parse_out_section(content,detail_name).splitlines():
			line = line.strip()
			#print line
			idx = line.find("*/ = {")
			if not in_array and idx>0:
				idx2 = line.find(" /*")
				guid = line[0:idx2].strip()
				typename = line[idx2+3:idx].strip()
				if typename == 'Project object':
					self.root_object = guid
			else:
				idx = line.find(" = (")
				if idx > 0:
					in_array = True
					name = line[0:idx].strip()
					items = []
				elif line==");" and in_array==True:
					in_array = False
					properties[name] = items
					name = None
					items = None
				elif line==");" and in_hash==False:
					pass
				elif line=='};':
					if in_hash:
						properties[settings_name]=settings
						in_hash=False
					else:
						entries.append({'guid':guid,'typename':typename,'properties':properties})
						name = None
						items = None
						properties = {}
						guid = None
						typename = None
				elif in_array==True:
					line = line[0:-1]
					items.append(line)
				elif in_hash==True:
					tokens = line.split(" = ")
					settings[tokens[0].strip()] = tokens[1][0:-1].strip()
				else:
					if line == '': continue
					tokens = line.split(" = ")
					if in_hash==False and line.find(" = {")!=-1:
						in_hash = True
						settings_name = tokens[0].strip()
						settings = {}
					else:
						properties[tokens[0].strip()] = tokens[1][0:-1].strip()
		return entries	
		
	def parse_section(self,content,name):
		items = []
		for line in self.parse_out_section(content,name).splitlines():
			if len(line)==0: continue
			entry = self.extract_section_entry(line.strip())
			items.append(entry)
		return items	
			
	def parse(self,fn):
		content = open(os.path.expanduser(fn)).read()
		if not content.startswith("// !$*UTF8*$!"):
			raise Exception("This does not look like a valid XCode project")
		contents = {}
		
		for name in TOP_LEVEL_SECTIONS:
			contents[name]=self.parse_section(content,name)
		for name in MID_LEVEL_SECTIONS:
			contents[name]=self.parse_detail(content,name)
		return contents
	
	def add_static_lib(self,contents,name,path='',source_tree=None):
		self.add_library(contents,name,path,'archive.ar',source_tree)
	
	def add_dynamic_lib(self,contents,name,path='',source_tree=None):
		self.add_library(contents,name,path,'"compiled.mach-o.dylib"',source_tree)
		
	def add_library(self,contents,name,path,filetype,source_tree):
		if source_tree==None and path!=None and path[0:1]=='/':
			source_tree="<absolute>"
			if not path.endswith(name):
				if not path.endswith("/"):
					path+="/"
				path+=name
		elif source_tree==None:
			source_tree = 'SOURCE_ROOT'
			if path=='' or path==None:
				path=name
		items = contents['PBXFileReference']
		found = False
		for item in items:
			if item['filename']==name:
				found=True
				break
		if not found:
			fileref = self.gen_uuid()
			items.append({
				'guid':fileref,
				'filename':name,
				'section_name':None,
				'properties':{
					'isa':'PBXFileReference',
					'lastKnownFileType':filetype,
					'name':name,
					'path':path,
					'sourceTree':source_tree
				}
			})	
			items = contents['PBXGroup']
			for item in items:
				if item['typename']=='Frameworks':
					props = item['properties']
					children = props['children']
					children.append("%s /* %s */" % (fileref,name))
					
	def add_framework(self,contents,name):
		items = contents['PBXFrameworksBuildPhase'][0]
		properties = items['properties']
		files = properties['files']
		framework_name = "%s.framework" % name
		found = False
		for fn in files:
			if fn.find(framework_name)!=-1:
				found = True
				break
		if found==False:
			guid = self.gen_uuid()
			line = "%s /* %s in Frameworks */" % (guid,framework_name)
			files.append(line)
			items = contents['PBXBuildFile']
			fileref = self.gen_uuid()
			items.append({
				'guid':guid,
				'section_name':'Frameworks',
				'filename':framework_name,
				'properties':{
					'isa':'PBXBuildFile',
					'fileRef':"%s /* %s */" % (fileref,framework_name)
				}
			})
			items = contents['PBXFileReference']
			items.append({
				'guid':fileref,
				'section_name':None,
				'filename':framework_name,
				'properties':{
					'isa':'PBXFileReference',
					'fileRef':"%s /* %s */" % (fileref,framework_name),
					'lastKnownFileType':'wrapper.framework',
					'name':framework_name,
					'path':'System/Library/Frameworks/%s' % framework_name,
					'sourceTree':'SDKROOT'
				}
			})
			items = contents['PBXGroup']
			for item in items:
				if item['typename']=='Frameworks':
					props = item['properties']
					children = props['children']
					children.append("%s /* %s in Frameworks */" % (fileref,framework_name))
	def get_section_entry(self,item):
		out = ""
		properties = item['properties']
		for prop in ['isa','fileRef','fileEncoding','explicitFileType','includeInIndex','lastKnownFileType','name','sourceTree','path']:
			if not properties.has_key(prop): continue
			value = properties[prop]
			out+="%s = %s; " % (prop,value)
		return out
		
	def write_section(self,output,contents,name):
		print >>output, "/* Begin %s section */" % name
		for item in contents:
			#print item
			detail = self.get_section_entry(item)
			desc = item['filename']
			sec_name = item['section_name']
			if sec_name!=None:
				desc+=" in %s" % sec_name
			print >>output, "                %s /* %s */ = {%s};" % (item['guid'],desc,detail)
		print >>output, "/* End %s section */" % name
		print >>output, ""
	
	def write_detail_entry(self,output,item):
		for value in ['isa','buildConfigurations','defaultConfigurationIsVisible','defaultConfigurationName','baseConfigurationReference','buildSettings','buildConfigurationList','compatibilityVersion','hasScannedForEncodings','knownRegions','mainGroup','productRefGroup','projectDirPath','projectRoot','targets','buildActionMask','files','children','sourceTree','runOnlyForDeploymentPostprocessing','buildPhases','buildRules','dependencies','name','path','productName','productReference','productType']:
			if item.has_key(value):
				entry = item[value]
				if type(entry)==types.ListType:
					print >>output, "                        %s = (\n                                %s\n                        );" % (value,",\n                                ".join(entry))
				elif type(entry)==types.DictType:
					print >>output, "                        %s = {" % value
					for key in entry:
						print >>output, "                                %s = %s;" % (key,entry[key])
					print >>output, "                        };"
				else:
					print >>output, "                        %s = %s;" % (value,entry)
			
	def write_detail(self,output,contents,name):
		print >>output, ""
		print >>output, "/* Begin %s section */" % name
		for detail in contents:
			print >>output, "                %s /* %s */ = {" % (detail['guid'],detail['typename'])
			self.write_detail_entry(output,detail['properties'])
			print >>output, "                };" 
		print >>output, "/* End %s section */" % name
		
	def write(self,contents):
		output = StringIO.StringIO()
		print >>output, "// !$*UTF8*$!"
		print >>output, """{
        archiveVersion = 1;
        classes = {
        };
        objectVersion = 45;
        objects = {
"""
		for name in TOP_LEVEL_SECTIONS:
			self.write_section(output,contents[name],name)
			
		for name in MID_LEVEL_SECTIONS:
			self.write_detail(output,contents[name],name)
			
		print >>output,"""	};
	rootObject = %s /* Project object */;
}""" % self.root_object
		out = output.getvalue()
		print out
		output.close()
		return out

proj = PBXProj()
f = "~/tmp/testp/testp.xcodeproj/project.pbxproj"
#i = proj.parse("~/Downloads/restorekitmoduledevelopment/OmniumTitanium.xcodeproj/project.pbxproj")
i = proj.parse(f)
#proj.add_framework(i,'FooBar')
#proj.add_static_lib(i,'libFoo.a','')
#proj.add_dynamic_lib(i,'libfoo.dylib','/usr/lib/foo')
proj.add_static_lib(i,'libTiCore.a',None)
#i = proj.parse("~/work/titanium_mobile/iphone/iphone/Titanium.xcodeproj/project.pbxproj")
out = proj.write(i)
o = open(os.path.expanduser(f),'w')
o.write(out)
o.close()

