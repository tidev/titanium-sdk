#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Build and Launch iPhone Application in Simulator or install
# the application on the device via iTunes
#

import os, sys, uuid, subprocess, shutil, signal, time, re, run, glob, codecs
from compiler import Compiler
from os.path import join, splitext, split, exists
from shutil import copyfile

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sys.path.append(os.path.join(template_dir,'../'))
from tiapp import *

ignoreFiles = ['.gitignore', '.cvsignore'];
ignoreDirs = ['.git','.svn', 'CVS'];

def dequote(s):
	if s[0:1] == '"':
		return s[1:-1]
	return s

def kill_simulator():
	run.run(['/usr/bin/killall',"iPhone Simulator"],True)

def copy_module_resources(source, target):
	if not os.path.exists(os.path.expanduser(target)):
		os.mkdir(os.path.expanduser(target))
	for root, dirs, files in os.walk(source):
		for name in ignoreDirs:
			if name in dirs:
				dirs.remove(name)	# don't visit ignored directories			  
			for file in files:
				if splitext(file)[-1] in ('.html', '.js', '.css', '.a', '.m', '.c', '.cpp', '.h', '.mm'):
					continue
				if file in ignoreFiles:
					continue
				from_ = join(root, file)			  
				to_ = os.path.expanduser(from_.replace(source, target, 1))
				to_directory = os.path.expanduser(split(to_)[0])
				if not exists(to_directory):
					os.makedirs(to_directory)
				copyfile(from_, to_)

def read_properties(propFile):
	propDict = dict()
	for propLine in propFile:
	    propDef = propLine.strip()
	    if len(propDef) == 0:
	        continue
	    if propDef[0] in ( '!', '#' ):
	        continue
	    punctuation= [ propDef.find(c) for c in ':= ' ] + [ len(propDef) ]
	    found= min( [ pos for pos in punctuation if pos != -1 ] )
	    name= propDef[:found].rstrip()
	    value= propDef[found:].lstrip(":= ").rstrip()
	    propDict[name]= value
	propFile.close()
	return propDict
	
def main(args):
	argc = len(args)
	if argc < 5 or (argc > 1 and args[1] == 'distribute' and argc!=9):
		print "%s <command> <version> <project_dir> <appid> <name> [uuid] [dist_name] [output_dir]" % os.path.basename(args[0])
		print
		print "available commands: "
		print
		print "  install       install the app to itunes for testing on iphone"
		print "  simulator     build and run on the iphone simulator"
		print "  distribute    build final distribution bundle"

		sys.exit(1)

	print "[INFO] One moment, building ..."
	sys.stdout.flush()
	
	simulator = os.path.abspath(os.path.join(template_dir,'iphonesim'))
	
	command = args[1].decode("utf-8")
	iphone_version = dequote(args[2].decode("utf-8"))
	project_dir = os.path.expanduser(dequote(args[3].decode("utf-8")))
	appid = dequote(args[4].decode("utf-8"))
	name = dequote(args[5].decode("utf-8"))
	target = 'Debug'
	deploytype = 'development'
	debug = False
	
	if command == 'distribute':
		appuuid = dequote(args[6].decode("utf-8"))
		dist_name = dequote(args[7].decode("utf-8"))
		output_dir = os.path.expanduser(dequote(args[8].decode("utf-8")))
		target = 'Release'
		deploytype = 'production'
	elif command == 'simulator':
		deploytype = 'development'
		debug = True
	elif command == 'install':
		appuuid = dequote(args[6].decode("utf-8"))
		dist_name = dequote(args[7].decode("utf-8"))
		deploytype = 'test'
		
	
	iphone_dir = os.path.abspath(os.path.join(project_dir,'build','iphone'))
	project_resources = os.path.join(project_dir,'Resources')
	
	app_name = name+'.app'
	app_folder_name = '%s-iphoneos' % target
	app_dir = os.path.abspath(os.path.join(iphone_dir,'build','%s-iphonesimulator'%target,name+'.app'))
	app_bundle_folder = os.path.abspath(os.path.join(iphone_dir,'build',app_folder_name))
	app_bundle = os.path.join(app_bundle_folder,app_name)
	iphone_resources_dir = os.path.join(iphone_dir,'Resources')
	iphone_tmp_dir = os.path.join(iphone_dir,'tmp')
	
	
	if not os.path.exists(iphone_dir):
		print "Could not find directory: %s" % iphone_dir
		sys.exit(1)
	
	cwd = os.getcwd()
	
	tiapp_xml = os.path.join(project_dir,'tiapp.xml')
	if not os.path.exists(tiapp_xml):
		print "Missing tiapp.xml at %s" % tiapp_xml
		sys.exit(3)
	ti = TiAppXML(tiapp_xml)
	encrypt = False
	if ti.properties.has_key('encrypt'): 
		encrypt = (ti.properties['encrypt']=='true')
	
	# compile resources
	compiler = Compiler(appid,project_dir,encrypt,debug)
	compiler.compile()

	# copy over main since it can change with each release
	main_template = codecs.open(os.path.join(template_dir,'main.m'),'r','utf-8','replace').read()
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
	
	
	main_dest = codecs.open(os.path.join(iphone_dir,'main.m'),'w','utf-8','replace')
	main_dest.write(main_template.encode("utf-8"))
	main_dest.close()
	
	# migrate the xcode project given that it can change per release of sdk
	if iphone_version == '2.2.1':
		xcodeproj = codecs.open(os.path.join(template_dir,'project_221.pbxproj'),'r','utf-8','replace').read()
	else:
		xcodeproj = codecs.open(os.path.join(template_dir,'project.pbxproj'),'r','utf-8','replace').read()
	xcodeproj = xcodeproj.replace('__PROJECT_NAME__',name)
	xcodeproj = xcodeproj.replace('__PROJECT_ID__',appid)
	xcode_dir = os.path.join(iphone_dir,name+'.xcodeproj')
	xcode_pbx = codecs.open(os.path.join(xcode_dir,'project.pbxproj'),'w','utf-8','replace')
	xcode_pbx.write(xcodeproj.encode("utf-8"))
	xcode_pbx.close()	
	
	# copy in the default PNG
	default_png = os.path.join(project_resources,'iphone','Default.png')
	if os.path.exists(default_png):
		target_png = os.path.join(iphone_resources_dir,'Default.png')
		if os.path.exists(target_png):
			os.remove(target_png)
		shutil.copy(default_png,target_png)	
	
	iphone_tmp_module_dir = os.path.join(iphone_dir,"_modules")
	if os.path.exists(iphone_tmp_module_dir):
		shutil.rmtree(iphone_tmp_module_dir)
	
	os.mkdir(iphone_tmp_module_dir)
	
	# in case the developer has their own modules we can pick them up
	project_module_dir = os.path.join(project_dir,"modules","iphone")
	
	# copy in any resources in our module like icons
	if os.path.exists(project_module_dir):
		copy_module_resources(project_module_dir,iphone_tmp_dir)
	
	# see if the user has app data and if so, compile in the user data
	# such that it can be accessed automatically using Titanium.App.Properties.getString
	app_data_cfg = os.path.join(project_dir,"appdata.cfg")
	if os.path.exists(app_data_cfg):
		props = read_properties(open(app_data_cfg,"r"))
		module_data = ''
		for key in props.keys():
			value = props[key]
			data = str(value).encode("hex")
			module_data+="[[NSUserDefaults standardUserDefaults] setObject:[[[NSString alloc] initWithData:dataWithHexString(@\"%s\") encoding:NSUTF8StringEncoding] autorelease] forKey:@\"%s\"];\n" % (data,key)
		print("[DEBUG] detected user application data at = %s"% app_data_cfg)
		sys.stdout.flush()
		dtf = os.path.join(iphone_tmp_module_dir,"UserDataModule.m")
		if os.path.exists(dtf):
			os.remove(dtf)
		ctf = codecs.open(dtf,'w','utf-8','replace')
		cf_template = codecs.open(os.path.join(template_dir,'UserDataModule.m'),'r','utf-8','replace').read()
		cf_template = cf_template.replace('__MODULE_BODY__',module_data)
		ctf.write(cf_template.encode("utf-8"))
		ctf.close()
		compiler.modules.append('Userdata')
	
	# we build a new libTitanium that is basically only the modules used by the application all injected into the 
	# final libTitanium that is used by xcode
	# os.chdir(iphone_tmp_module_dir)
	# modules_detected=['Userdata']
	# for arch in ['i386','armv6']:
	# 	os.mkdir(os.path.join(iphone_tmp_module_dir,arch))
	# 	os.chdir(os.path.join(iphone_tmp_module_dir,arch))
	# 	for module_name in compiler.modules:
	# 		module_normalized_name = module_name[0:1].capitalize() + module_name[1:]
	# 		if len(module_normalized_name) == 2:
	# 		    module_normalized_name = module_normalized_name.upper()
	# 		libname = "lib%s-%s.a" % (module_normalized_name,iphone_version)
	# 		libpath = os.path.join(template_dir,libname)
	# 		if not os.path.exists(libpath):
	# 			# check to see if its in the user's project module dir
	# 			libpath = os.path.join(project_module_dir,libname)
	# 		if os.path.exists(libpath):
	# 			if not module_normalized_name in modules_detected:
	# 				modules_detected.append(module_normalized_name)
	# 				print "[DEBUG] module library dependency detected Titanium.%s" % (module_normalized_name)
	# 			os.system("/Developer/Platforms/iPhoneOS.platform/Developer/usr/bin/lipo \"%s\" -thin %s -o tmp.a" % (libpath,arch))
	# 			os.system("ar -x tmp.a")
	# 			os.remove("tmp.a")	
	# 		else:
	# 			if not os.path.exists(os.path.join(project_module_dir,"%sModule.m"%module_normalized_name)) and module_normalized_name!='Userdata':
	# 				print "[WARN] couldn't find module library for Titanium.%s" % module_normalized_name
	# 			elif not module_normalized_name in modules_detected:
	# 				print "[DEBUG] module library dependency detected Titanium.%s" % (module_normalized_name)
	# 				modules_detected.append(module_normalized_name)
	# 
	# os.chdir(iphone_tmp_module_dir)
	
	# copy any module image directories
	# for module in modules_detected:
	# 	img_dir = os.path.abspath(os.path.join(template_dir,'modules',module.lower(),'images'))
	# 	if os.path.exists(img_dir):
	# 		dest_img_dir = os.path.join(iphone_tmp_dir,'modules',module.lower(),'images')
	# 		if os.path.exists(dest_img_dir):
	# 			shutil.rmtree(dest_img_dir)
	# 		os.makedirs(dest_img_dir)
	# 		copy_module_resources(img_dir,dest_img_dir)
	# 		
	# 
	# for arch in ['i386','armv6']:
	# 	arch_dir = os.path.join(iphone_tmp_module_dir,arch)
	# 	if not os.path.exists(arch_dir):
	# 		os.mkdir(arch_dir)

	# extract our main libTitanium by architecture and then rebuild the final static library which includes
	# libTitanium as well as our dependent modules only
	# os.system("/Developer/Platforms/iPhoneOS.platform/Developer/usr/bin/lipo \"%s\" -thin i386 -output \"%s\"" % (os.path.join(template_dir,'libTitanium-%s.a'%iphone_version),os.path.join(iphone_tmp_module_dir,'i386','libTitanium-i386.a')))
	# os.system("/Developer/Platforms/iPhoneOS.platform/Developer/usr/bin/lipo \"%s\" -thin armv6 -output \"%s\"" % (os.path.join(template_dir,'libTitanium-%s.a'%iphone_version),os.path.join(iphone_tmp_module_dir,'armv6','libTitanium-armv6.a')))

	# for arch in ['i386','armv6']:
	# 	os.chdir(os.path.join(iphone_tmp_module_dir,arch))
	# 	os.system("ar -x \"%s\"" % os.path.join(iphone_tmp_module_dir,arch,"libTitanium-%s.a"%arch))
	# 
	# 	#compile in any user source
	# 	import inliner
	# 	include_dir = os.path.join(template_dir,"include")
	# 	if os.path.exists(include_dir) and os.path.exists(project_module_dir):
	# 		inliner.inliner(include_dir,iphone_version,arch,project_module_dir,os.path.join(iphone_tmp_module_dir,arch))
	# 
	# 	if os.path.exists(include_dir) and os.path.exists(iphone_tmp_module_dir):
	# 		inliner.inliner(include_dir,iphone_version,arch,iphone_tmp_module_dir,os.path.join(iphone_tmp_module_dir,arch))
	#         
	# 	os.system("/Developer/Platforms/iPhoneOS.platform/Developer/usr/bin/libtool -static -o \"%s\" *.o" % os.path.join(iphone_tmp_module_dir,"libTitanium-%s.a"%arch))
	#     
	# os.chdir(iphone_tmp_module_dir)

	sys.stdout.flush()
	
	# remake the combined architecture lib
	# os.system("/Developer/Platforms/iPhoneOS.platform/Developer/usr/bin/lipo libTitanium-i386.a libTitanium-armv6.a -create -output \"%s\"" % os.path.join(iphone_resources_dir,'libTitanium.a'))
	
	# shutil.rmtree(iphone_tmp_module_dir)
	
	shutil.copy(os.path.join(template_dir,'libTitanium.a'),os.path.join(iphone_resources_dir,'libTitanium.a'))
	shutil.copy(os.path.join(template_dir,'libTiCore.a'),os.path.join(iphone_resources_dir,'libTiCore.a'))

	# must copy the XIBs each time since they can change per SDK
	os.chdir(template_dir)
	for xib in glob.glob('*.xib'):
		shutil.copy(os.path.join(template_dir,xib),os.path.join(iphone_resources_dir,xib))
	os.chdir(cwd)		
		
	def is_adhoc(uuid):
		path = "~/Library/MobileDevice/Provisioning Profiles/%s.mobileprovision" % uuid
		f = os.path.expanduser(path)
		if os.path.exists(f):
			c = codecs.open(f,'r','utf-8','replace').read()
			return c.find("ProvisionedDevices")!=-1
		return False	
		
	def add_plist(dir):
		
		if not os.path.exists(dir):		
			os.makedirs(dir)
	
		# write out the modules we're using in the APP
		for m in compiler.required_modules:
			print "[INFO] Detected required module: Titanium.%s" % (m)
	
		if command == 'install':
			version = ti.properties['version']
			# we want to make sure in debug mode the version always changes
			version = "%s.%d" % (version,time.time())
			ti.properties['version']=version

		
		# write out the updated Info.plist
		infoplist_tmpl = os.path.join(iphone_dir,'Info.plist.template')
		infoplist = os.path.join(iphone_dir,'Info.plist')
		appicon = ti.generate_infoplist(infoplist,infoplist_tmpl,appid)
		
		# copy the app icon to the build resources
		iconf = os.path.join(iphone_tmp_dir,appicon)
		iconf_dest = os.path.join(dir,appicon)
		if os.path.exists(iconf):
			shutil.copy(iconf, iconf_dest)
	
	try:
		os.chdir(iphone_dir)

		
		# write out plist
		add_plist(os.path.join(iphone_dir,'Resources'))

		print "[INFO] Executing XCode build..."
		print "[BEGIN_VERBOSE] Executing XCode Compiler  <span>[toggle output]</span>"
		
		sys.stdout.flush()
		
		if command == 'simulator':
	
			# first build it
			log_id = uuid.uuid4()
			
			# make sure it's clean
			if os.path.exists(app_dir):
				shutil.rmtree(app_dir)

			output = run.run([
    			"xcodebuild",
    			"-configuration",
    			"Debug",
    			"-sdk",
    			"iphonesimulator%s" % iphone_version,
    			"WEB_SRC_ROOT=%s" % iphone_tmp_dir,
    			"GCC_PREPROCESSOR_DEFINITIONS=__LOG__ID__=%s DEPLOYTYPE=development DEBUG=1" % log_id
			])
	    	
			print output
			print "[END_VERBOSE]"
			sys.stdout.flush()

			shutil.rmtree(iphone_tmp_dir)

			if output.find("** BUILD FAILED **")!=-1 or output.find("ld returned 1")!=-1:
			    print "[ERROR] Build Failed. Please see output for more details"
			    sys.exit(1)
	
			# first make sure it's not running
			kill_simulator()

			logger = os.path.realpath(os.path.join(template_dir,'logger.py'))
			
			# start the logger
			log = subprocess.Popen([
			  	logger,
				str(log_id)+'.log'
			])	
			
			sim = None
	
			def handler(signum, frame):
				print "[INFO] Simulator is exiting"
				sys.stdout.flush()
				if not log == None:
					try:
						os.system("kill -2 %s" % str(log.pid))
					except:
						pass
				if not sim == None and signum!=3:
					try:
						os.system("kill -3 %s" % str(sim.pid))
					except:
						pass

				kill_simulator()
				sys.exit(0)
	    
			signal.signal(signal.SIGHUP, handler)
			signal.signal(signal.SIGINT, handler)
			signal.signal(signal.SIGQUIT, handler)
			signal.signal(signal.SIGABRT, handler)
			signal.signal(signal.SIGTERM, handler)

			print "[INFO] Launching application in Simulator"
			sys.stdout.flush()
			sys.stderr.flush()
	
			#launch the simulator
			sim = subprocess.Popen("\"%s\" launch \"%s\" %s" % (simulator,app_dir,iphone_version),shell=True)
						
			# activate the simulator window
			ass = os.path.join(template_dir,'iphone_sim_activate.scpt')
			cmd = "osascript \"%s\"" % ass
			os.system(cmd)
			
			print "[INFO] Launched application in Simulator"
			sys.stdout.flush()
			sys.stderr.flush()
			
			os.waitpid(sim.pid,0)

			print "[INFO] Application has exited from Simulator"
			
			# in this case, the user has exited the simulator itself
			# and not clicked Stop Emulator from within Developer so we kill
			# our tail log process but let simulator keep running

			if not log == None:
				try:
					os.system("kill -2 %s" % str(log.pid))
				except:
					pass
			
			sys.exit(0)
			
			
		elif command == 'install':
	
			# make sure it's clean
			if os.path.exists(app_bundle):
				shutil.rmtree(app_bundle)
				
			output = run.run(["xcodebuild",
				"-configuration",
				"Debug",
				"-sdk",
				"iphoneos%s" % iphone_version,
				"CODE_SIGN_ENTITLEMENTS=",
				"GCC_PREPROCESSOR_DEFINITIONS='DEPLOYTYPE=test'",
				"PROVISIONING_PROFILE[sdk=iphoneos*]=%s" % appuuid,
				"CODE_SIGN_IDENTITY[sdk=iphoneos*]=iPhone Developer: %s" % dist_name
			])

			shutil.rmtree(iphone_tmp_dir)
			
			if output.find("** BUILD FAILED **")!=-1:
			    print "[ERROR] Build Failed. Please see output for more details"
			    sys.exit(1)
	
			# look for a code signing error
			error = re.findall(r'Code Sign error:(.*)',output)
			if len(error) > 0:
				print "[ERROR] Code sign error: %s" % error[0].strip()
				sys.exit(1)

			print "[INFO] Installing application in iTunes ... one moment"
			sys.stdout.flush()
			
			# for install, launch itunes with the app
			cmd = "open -b com.apple.itunes \"%s\"" % app_bundle
			os.system(cmd)
			
			# now run our applescript to tell itunes to sync to get
			# the application on the phone
			ass = os.path.join(template_dir,'itunes_sync.scpt')
			cmd = "osascript \"%s\"" % ass
			os.system(cmd)

			print "[INFO] iTunes sync initiated"
			sys.stdout.flush()
	
		elif command == 'distribute':
	
			# make sure it's clean
			if os.path.exists(app_bundle):
				shutil.rmtree(app_bundle)
				
			# in this case, we have to do different things based on if it's
			# an ad-hoc distribution cert or not - in the case of non-adhoc
			# we don't use the entitlements file but in ad hoc we need to
			adhoc_line = "CODE_SIGN_ENTITLEMENTS="
			deploytype = "production_adhoc"
			if not is_adhoc(appuuid):
				adhoc_line="CODE_SIGN_ENTITLEMENTS = Resources/Entitlements.plist"
				deploytype = "production"
			
			# build the final release distribution
			output = run.run(["xcodebuild",
				"-configuration",
				"Release",
				"-sdk",
				"iphoneos%s" % iphone_version,
				"%s" % adhoc_line,
				"GCC_PREPROCESSOR_DEFINITIONS='DEPLOYTYPE=%s'" % deploytype,
				"PROVISIONING_PROFILE[sdk=iphoneos*]=%s" % appuuid,
				"CODE_SIGN_IDENTITY[sdk=iphoneos*]=iPhone Distribution: %s" % dist_name
			])

			shutil.rmtree(iphone_tmp_dir)
			
			if output.find("** BUILD FAILED **")!=-1:
			    print "[ERROR] Build Failed. Please see output for more details"
			    sys.exit(1)
			
			# look for a code signing error
			error = re.findall(r'Code Sign error:(.*)',output)
			if len(error) > 0:
				print "[ERROR] Code sign error: %s" % error[0].strip()
				sys.exit(1)
			
			# switch to app_bundle for zip
			os.chdir(app_bundle_folder)
			
			# you *must* use ditto here or it won't upload to appstore
			os.system('ditto -ck --keepParent --sequesterRsrc "%s" "%s/%s.zip"' % (app_name,output_dir,app_name))
			
			sys.exit(0)
			
		else:
			print "Unknown command: %s" % command
			sys.exit(2)
			
	
	finally:
		os.chdir(cwd)
	


if __name__ == "__main__":
    main(sys.argv)

