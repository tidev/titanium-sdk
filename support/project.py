#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Unified Titanium Mobile Project Script
#
import os, sys, subprocess, shutil, codecs, optparse

usage="""
%s <name> <id> <directory> [iphone,android,mobileweb,blackberry] [android_sdk] [--blackberry_ndk BLACKBERRY_NDK] [--update-platforms]
""" % os.path.basename(__file__)

parser = optparse.OptionParser(usage=usage)
parser.add_option('--blackberry_ndk', help='BlackBerry NDK home')
parser.add_option('-u', '--update-platforms', dest='update_platforms',
		help='Initialize project for any missing platforms. Use this to add a platform to the project without overwriting tiapp.xml and app.js.',
		action='store_true', default=False)

def run(args):
	return subprocess.Popen(args, stderr=subprocess.PIPE, stdout=subprocess.PIPE).communicate()

def is_iphone(platform):
	return ((platform == 'iphone') or (platform == 'ios') or (platform == 'ipad'))

def main(args, update_platforms=False):
	argc = len(args)
	if argc < 5 or args[1]=='--help':
		parser.print_help()
		sys.exit(1)

	name = args[1].decode("utf-8")
	appid = args[2].decode("utf-8")
	directory = os.path.abspath(os.path.expanduser(args[3].decode("utf-8")))
	iphone = False
	android = False
	android_sdk = None
	sdk = None
	mobileweb = False
	blackberry = False
	blackberry_ndk = None

	if is_iphone(args[4]) or (argc > 5 and is_iphone(args[5])) or (argc > 6 and is_iphone(args[6])):
		iphone = True
	if args[4] == 'android' or (argc > 5 and args[5] == 'android') or (argc > 6 and args[6] == 'android'):
		android = True
	if args[4] == 'mobileweb' or (argc > 5 and args[5] == 'mobileweb') or (argc > 6 and args[6] == 'mobileweb'):
		mobileweb = True
	if args[4] == 'blackberry' or (argc > 5 and args[5] == 'blackberry') or (argc > 6 and args[6] == 'blackberry'):
		blackberry = True

	if android:
		sys.path.append(os.path.join(os.path.dirname(args[0]), "android"))
		from androidsdk import AndroidSDK
		android_sdk = args[argc-1].decode("utf-8")
		try:
			sdk = AndroidSDK(android_sdk)
		except Exception, e:
			print >>sys.stderr, e
			sys.exit(1)

	if blackberry:
		sys.path.append(os.path.join(os.path.dirname(args[0]), "blackberry"))
		from blackberryndk import BlackberryNDK
		blackberry_ndk = options.blackberry_ndk and options.blackberry_ndk.decode("utf-8")
		try:
			bbndk = BlackberryNDK(blackberry_ndk)
			if blackberry_ndk is None:
				blackberry_ndk = bbndk.getBlackberryNdk()
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

	tiapp_file_out = os.path.join(project_dir, 'tiapp.xml')
	if not update_platforms or not os.path.exists(tiapp_file_out):
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

	iphone_resources = os.path.join(resources_dir,'iphone')
	if iphone and (not update_platforms or not os.path.exists(iphone_resources)):
		if not os.path.exists(iphone_resources):
			os.makedirs(iphone_resources)
		iphone_gen = os.path.join(template_dir,'iphone','iphone.py')
		run_args = [sys.executable, iphone_gen, name, appid, directory]
		run(run_args)

	android_resources = os.path.join(resources_dir,'android')
	if android and (not update_platforms or not os.path.exists(android_resources)):
		if not os.path.exists(android_resources):
			os.makedirs(android_resources)
		android_gen = os.path.join(template_dir,'android','android.py')
		run_args = [sys.executable, android_gen, name, appid, directory, android_sdk]
		run(run_args)

	mobileweb_resources = os.path.join(resources_dir,'mobileweb')
	if mobileweb and (not update_platforms or not os.path.exists(mobileweb_resources)):
		if not os.path.exists(mobileweb_resources):
			os.makedirs(mobileweb_resources)
		mobileweb_gen = os.path.join(template_dir,'mobileweb','mobileweb.py')
		run_args = [sys.executable, mobileweb_gen, name, appid, directory]
		run(run_args)

	blackberry_resources = os.path.join(resources_dir, 'blackberry')
	if blackberry and (not update_platforms or not os.path.exists(blackberry_resources)):
		blackberry_gen = os.path.join(template_dir,'blackberry','blackberry.py')
		run_args = [sys.executable, blackberry_gen, '--name', name, '--id', appid, '--dir', directory, '--ndk', blackberry_ndk]
		run(run_args)

	if not update_platforms:
		# copy LICENSE and README
		for file in ['LICENSE','README']:
			out_path = os.path.join(project_dir, file)
			shutil.copy(os.path.join(all_dir, file), out_path)
		# copy IMAGES
		for file in ['KS_nav_ui.png', 'KS_nav_views.png']:
			out_path = os.path.join(resources_dir, file)
			shutil.copy(os.path.join(all_dir, file), out_path)

	app_js_out = os.path.join(resources_dir, 'app.js')
	if not update_platforms or not os.path.exists(app_js_out):
		# copy APP.JS
		shutil.copy(os.path.join(all_dir, 'app.js'), app_js_out)

if __name__ == '__main__':
	(options, args) = parser.parse_args()

	# To mimic sys.argv, put the script name at position 0 in args
	args.insert(0, __file__)

	main(args, options.update_platforms)

