#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Unified Titanium Mobile Project Script
#
import os, sys, subprocess, shutil, codecs

def run(args):
	return subprocess.Popen(args, stderr=subprocess.PIPE, stdout=subprocess.PIPE).communicate()
	
def main(args,argc):
	if argc < 5 or args[1]=='--help':
		print "Usage: %s <name> <id> <directory> [iphone,android] [android_sdk]" % os.path.basename(args[0])
		sys.exit(1)
		
	name = args[1].decode("utf-8")
	appid = args[2].decode("utf-8")
	directory = os.path.abspath(os.path.expanduser(args[3].decode("utf-8")))
	iphone = False
	android = False
	android_sdk = None
	sdk = None
	
	if args[4] == 'iphone' or (argc > 5 and args[5] == 'iphone'):
		iphone = True
	if args[4] == 'android' or (argc > 5 and args[5] == 'android'):
		android = True
	
	if android:
		sys.path.append(os.path.join(os.path.dirname(args[0]), "android"))
		from androidsdk import AndroidSDK
		android_sdk = args[argc-1].decode("utf-8")
		try:
			sdk = AndroidSDK(android_sdk, 4)
		except Exception, e:
			print >>sys.stderr, e
			sys.exit(1)
	
	if not os.path.exists(directory):
		os.makedirs(directory)
		
	project_dir = os.path.join(directory,name)
	
	if not os.path.exists(project_dir):
		os.makedirs(project_dir)

	template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
	all_dir = os.path.abspath(os.path.join(template_dir,'all'))
	
	if not os.path.exists(all_dir):
		all_dir = template_dir

	tiapp = codecs.open(os.path.join(all_dir,'tiapp.xml'),'r','utf-8','replace').read()
	tiapp = tiapp.replace('__PROJECT_ID__',appid)
	tiapp = tiapp.replace('__PROJECT_NAME__',name)
	tiapp = tiapp.replace('__PROJECT_VERSION__','1.0')
	
	tiapp_file = codecs.open(os.path.join(project_dir,'tiapp.xml'),'w+','utf-8','replace')
	tiapp_file.write(tiapp)
	tiapp_file.close()

	# create the titanium resources
	resources_dir = os.path.join(project_dir,'Resources')
	if not os.path.exists(resources_dir):
		os.makedirs(resources_dir)
		
	# write out our gitignore
	gitignore = open(os.path.join(project_dir,'.gitignore'),'w')
	# start in 1.4, we can safely exclude build folder from git
	gitignore.write("tmp\n")
	gitignore.close()
					
	if iphone:
		iphone_resources = os.path.join(resources_dir,'iphone')
		if not os.path.exists(iphone_resources): os.makedirs(iphone_resources)
		iphone_gen = os.path.join(template_dir,'iphone','iphone.py')
		run([sys.executable, iphone_gen, name, appid, directory])
		
	if android:
		android_resources = os.path.join(resources_dir,'android')
		if not os.path.exists(android_resources): os.makedirs(android_resources)
		android_gen = os.path.join(template_dir,'android','android.py')
		run([sys.executable, android_gen, name, appid, directory, android_sdk])
		
	# copy LICENSE and README
	for file in ['LICENSE','README']:
		shutil.copy(os.path.join(all_dir,file),os.path.join(project_dir,file))
	
	# copy RESOURCES
	for file in ['app.js']:
		shutil.copy(os.path.join(all_dir,file),os.path.join(resources_dir,file))

	# copy IMAGES
	for file in ['KS_nav_ui.png', 'KS_nav_views.png']:
		shutil.copy(os.path.join(all_dir,file),os.path.join(resources_dir,file))

	sys.exit(0)

if __name__ == '__main__':
	main(sys.argv,len(sys.argv))
	
