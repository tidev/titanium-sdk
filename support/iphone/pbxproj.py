#
# This is a little class that will parse out an XCode project.pbxproj file 
# which is the proprietary metadata file for XCode projects
#
# Author: Jeff Haynie <jhaynie@appcelerator.com>
#

import os, uuid, sys, types, re
import StringIO

class PBXProj(object):

	def __init__(self):
		self.static_libs = []
		
	def gen_uuid(self):
		genid = uuid.uuid4().__str__().upper().replace('-','')
		genid = genid[0:24]
		return genid
	
	def add_static_library(self,name,path):
		if path.find(name)==-1:
			path = os.path.abspath(os.path.join(path,name))
		self.static_libs.append((name,path,os.path.dirname(path)))
		
	def parse(self,f):
		contents = open(os.path.expanduser(f)).read()
		file_markers = []
		ref_markers = []
		framework_markers = []
		group_markers = []
		target_libs = []
		for lib in self.static_libs:
			if contents.find(lib[0])==-1:
				target_libs.append(lib)
		if len(target_libs)==0:
			return contents
		for line in contents.splitlines():
			# find our file marker
			if line.find("/* libTiCore.a */;")!=-1:
				file_markers.append(line)
			if line.find("/* libTiCore.a */ =")!=-1:
				ref_markers.append(line)
			if line.find("/* libTiCore.a in Frameworks */,")!=-1:
				framework_markers.append(line)
			if line.find("/* libTiCore.a */,")!=-1:
				group_markers.append(line)
		file_markers_to_file_refs = {}
		file_markers_to_frameworks = {}
		group_uuid = None
		for fm in file_markers:
			m = re.search(r'([0-9a-zA-Z]+) /*',fm)
			uuid = m.group(1).strip()
			if group_uuid==None:
				m = re.search(r'fileRef = ([0-9a-zA-Z]+) ',fm)
				group_uuid = m.group(1).strip()
			new_uuid = self.gen_uuid()
			file_markers_to_file_refs[uuid]=new_uuid
		for lib in target_libs:
			libname = lib[0]
			libpath = lib[1]
			libdir = lib[2]
			new_group_uuid = self.gen_uuid()
			for fm in file_markers:
				begin = contents.find(fm)
				end = begin + len(fm)
				line = contents[begin:end]
				line = line.replace('libTiCore.a',libname)
				line = line.replace(group_uuid,new_group_uuid)
				m = re.search(r'([0-9a-zA-Z]+) /*',fm)
				new_uuid = file_markers_to_file_refs[m.group(1)]
				line = line.replace(m.group(1),new_uuid)
				contents = contents[0:end] + '\n' + line + '\n' + contents[end+1:]
			for rm in ref_markers:
				begin = contents.find(rm)
				end = begin + len(rm)
				line = contents[begin:end]
				line = line.replace('lib/libTiCore.a',"\"%s\""%libpath)
				line = line.replace('libTiCore.a',libname)
				line = line.replace("SOURCE_ROOT","\"<absolute>\"")
				m = re.search(r'([0-9a-zA-Z]+) /*',rm)
				uuid = m.group(1).strip()
				line = line.replace(uuid,new_group_uuid)
				contents = contents[0:end] + '\n' + line + '\n' + contents[end+1:]
			for gm in group_markers:
				begin = contents.find(gm)
				end = begin + len(gm)
				line = contents[begin:end]
				line = line.replace('libTiCore.a',libname)
				line = line.replace(group_uuid,new_group_uuid)
				contents = contents[0:end] + '\n' +  line + '\n' + contents[end+1:]
			for fm in framework_markers:
				m = re.search(r'([0-9a-zA-Z]+) /*',fm)
				fileRef = m.group(1).strip()
				new_uuid = file_markers_to_file_refs[fileRef]
				begin = contents.find(fm)
				end = begin + len(fm)
				line = contents[begin:end]
				line = line.replace('libTiCore.a',libname)
				line = line.replace(fileRef,new_uuid)
				contents = contents[0:end] + '\n' +  line + '\n' + contents[end+1:]
			
			libpath = "\"\\\"$(SRCROOT)/lib\\\"\","
			begin = contents.find(libpath)
			while begin>0:
				end = begin + len(libpath)
				line = contents[begin:end]
				line = line.replace(libpath,"\"\\\"%s\\\"\"," % libdir)
				contents = contents[0:end] + '\n                                        ' +  line + '\n' + contents[end+1:]
				begin = contents.find(libpath,end)
				
			contents = contents.replace('Resources-iPad/MainWindow.xib','Resources/MainWindow.xib')	
			contents = contents.replace('path = MainWindow.xib;','path = Resources/MainWindow.xib;')	
				
		return contents	

if __name__ == "__main__":
	proj = PBXProj()
	f = "~/tmp/a.pbxproj"
	proj.add_static_library('libflurry.a','/Library/Application Support/Titanium/modules/iphone/flurry/0.1')
	out = proj.parse(f)		
	o = open(os.path.expanduser("~/tmp/foo.pbxproj"),'w')
	o.write(out)
	o.close()

