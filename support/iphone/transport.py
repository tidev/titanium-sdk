#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Make an iOS project transportable so that it can be zipped and 
# sent to another machine
# 

import os, sys, shutil, codecs, glob
template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))

def find_sdk(version):
	dir = os.path.join(os.path.expanduser("~/Library/Application Support/Titanium"),"mobilesdk","osx",version)
	if os.path.exists(dir):
		return dir
	dir = os.path.join("/Library","Application Support","Titanium","mobilesdk","osx",version)
	if os.path.exists(dir):
		return dir
	print "Is Titanium installed? I can't find it"
	sys.exit(1)
	
def info(msg):
	print msg
	sys.stdout.flush()
		
def main(args):
	if len(args)!=2:
		print "Usage: %s <directory>" % os.path.basename(args[0])
		sys.exit(1)
	
	
	# these are the following things that need to be done to make an xcode project transportable
	#
	# 1. copy in libTiCore and fix symlink
	# 2. copy in iphone
	# 3. migrate TI_SDK_DIR to project.xcconfig
	# 4. migrate shellScript in xcodeproj
	
	project_dir = os.path.abspath(args[1])
	tiapp_xml = os.path.join(project_dir,'tiapp.xml')
	build_dir = os.path.join(project_dir,'build','iphone')
	lib_file = os.path.join(build_dir,'lib','libTiCore.a')
	support_dir = os.path.join(build_dir,'support')

	info("Migrating iOS project ... ")

	files = glob.glob('%s/*.xcodeproj' % build_dir)
	if len(files)!=1:
		print "Couldn't find the .xcodeproj file at %s" % build_dir
		sys.exit(1)
		
	xcodeproj_dir = files[0]
	
	# first check that we're in a valid project folder that has been built
	if not os.path.exists(tiapp_xml):
		print "%s doesn't look like a valid project folder" % project_dir
		sys.exit(1)
	
	if not os.path.exists(build_dir):
		print "%s hasn't build built by Titanium yet. Build it and re-try" % project_dir
		sys.exit(1)

	info("  + Preparing project")
	
	if os.path.islink(lib_file) or os.path.exists(lib_file):
		os.remove(lib_file)
		
	if os.path.exists(support_dir):
		shutil.rmtree(support_dir)
	
	os.makedirs(support_dir)

	# migrate TI_SDK_DIR
	project_xcconfig = os.path.join(build_dir,'project.xcconfig')
	contents = codecs.open(project_xcconfig,'r',encoding='utf-8').read()
	new_contents = u''
	version = None
	
	for line in contents.splitlines(True):
		if line.find('TI_VERSION=')!=-1:
			k,v = line.split("=")
			version = v.strip()
		if line.find('TI_SDK_DIR=')==-1:
			new_contents+=line
		else:
			new_contents+="TI_SDK_DIR=support/iphone\n"

	ti_sdk = find_sdk(version)
	iphone_dir = os.path.join(ti_sdk,'iphone')
	info("  + Detected version %s" % version)
			
	# write our migrated version		
	f = codecs.open(project_xcconfig,'w',encoding='utf-8')		
	f.write(new_contents)
	f.close()

	info("  + Migrated xcconfig")
	
	# copy in key folders
	for f in ('common','iphone'):
		info("  + Copying %s directory" % f)
		shutil.copytree(os.path.join(ti_sdk,f),os.path.join(support_dir,f))	
		
	# remove some folders that aren't needed in transport
	for f in ('Classes','headers','include','resources'):
		shutil.rmtree(os.path.join(support_dir,'iphone',f))
	
	# copy in key files
	for f in ('tiapp.py','manifest.py'):
		shutil.copy(os.path.join(ti_sdk,f),support_dir)

	info("  + Copied scripts")
	
	# create our symlink
	cwd = os.getcwd()
	os.chdir(os.path.join(build_dir,'lib'))
	os.symlink('../support/iphone/libTiCore.a','libTiCore.a')
	os.chdir(cwd)
	
	xcodeproj = os.path.join(xcodeproj_dir,'project.pbxproj')
	
	contents = codecs.open(xcodeproj,'r',encoding='utf-8').read()
	new_contents = u''
	
	for line in contents.splitlines(True):
		if line.find('shellScript =')==-1:
			new_contents+=line
		else:
			new_contents+='      shellScript = "support/iphone/builder.py xcode\\nexit $?";\n'
	
	# write our migrated version		
	f = codecs.open(xcodeproj,'w',encoding='utf-8')		
	f.write(new_contents)
	f.close()
	
	info("  + Removing temporary build")
	shutil.rmtree(os.path.join(build_dir,'build'))

	info("Finished!")
	
		
if __name__ == "__main__":
	main(sys.argv)
	sys.exit(0)
