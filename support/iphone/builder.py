#!/usr/bin/env python
#
# Appcelerator Titanium Mobile
# Copyright (c) 2009 Appcelerator, Inc. All Right Reserved.
#
# Build and Launch iPhone Application in Simulator or install
# the application on the device via iTunes
#

import os, sys, uuid, subprocess, shutil, signal, time, re, run, glob
from compiler import Compiler

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sys.path.append(os.path.join(template_dir,'../'))
from tiapp import *


def dequote(s):
    if s[0:1] == '"':
	return s[1:-1]
    return s

def kill_simulator():
	print "kill simulator called"
	p = subprocess.Popen(['/bin/ps','-exwo','pid,comm'],stdout=subprocess.PIPE)
	while p.poll() == None:
	    buf = p.communicate()[0]
	    if buf == None or buf == '': break
	    buf = buf.strip()
	    for line in buf.split("\n"):
	        line = line.strip()
	        i = line.index(' ')
	        pid = line[0:i]
	        cmd = line[i+1:]
	        if len(re.findall('iPhoneSimulator',cmd)) > 0:
			try:
				os.system("/bin/kill -9 %s 2>/dev/null" % pid)
			except:
				pass

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

	print "One moment, building ..."
	
	simulator = os.path.abspath(os.path.join(template_dir,'iphonesim'))
	
	command = args[1]
	iphone_version = dequote(args[2])
	project_dir = os.path.expanduser(dequote(args[3]))
	appid = dequote(args[4])
	name = dequote(args[5])
	target = 'Debug'
	
	deploytype = 'development'
	
	if command == 'distribute':
		appuuid = dequote(args[6])
		dist_name = dequote(args[7])
		output_dir = os.path.expanduser(dequote(args[8]))
		target = 'Release'
		deploytype = 'production'
	elif command == 'simulator':
		deploytype = 'test'
	elif command == 'install':
		appuuid = dequote(args[6])
		dist_name = dequote(args[7])
		
	
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
	compiler = Compiler(appid,project_dir,encrypt)
	compiler.compile()
	
	# copy in the default PNG
	default_png = os.path.join(project_resources,'iphone','Default.png')
	if os.path.exists(default_png):
		target_png = os.path.join(iphone_resources_dir,'Default.png')
		if os.path.exists(target_png):
			os.remove(target_png)
		shutil.copy(default_png,target_png)	
	
	# copy in the write version of the titanium runtime based on which iphone
	# version the project is building for
	shutil.copy(os.path.join(template_dir,'libTitanium-%s.a'%iphone_version),os.path.join(iphone_resources_dir,'libTitanium.a'))
	
	# must copy the XIBs each time since they can change per SDK
	os.chdir(template_dir)
	for xib in glob.glob('*.xib'):
		shutil.copy(os.path.join(template_dir,xib),os.path.join(iphone_resources_dir,xib))
	os.chdir(cwd)		
		
	# cleanup compiled resources
	def cleanup_compiled_resources(dir):
		for root, dirs, files in os.walk(dir):
			if len(files) > 0:
				for f in files:
					fp = os.path.splitext(f)
					if len(fp)!=2: continue
					if not fp[1] in ['.html','.js','.css','.a']: continue
					basedir = root.replace(dir+'/','')
					os.remove(os.path.join(dir,basedir,f))
	
	def is_adhoc(uuid):
		path = "~/Library/MobileDevice/Provisioning Profiles/%s.mobileprovision" % uuid
		f = os.path.expanduser(path)
		if os.path.exists(f):
			c = open(f).read()
			return c.find("ProvisionedDevices")!=-1
		return False	
		
	def add_plist(dir):
		
		if not os.path.exists(dir):		
			os.makedirs(dir)
	
		plist_f = os.path.join(dir,'tiapp.plist')
		plist = open(plist_f,'w+')
	
		module_str = ''
		# write out the modules we're using in the APP
		for m in compiler.modules:
			module_str += '   <key>%s</key>\n   <real>0.0</real>\n' % (m.lower())
	
		tip = TiPlist(ti)
		plist_template = tip.generate(module_str,appid,deploytype)
	
		# write out the generated tiapp.plist
		plist.write(plist_template)
		plist.close()
		
		# write out the updated Info.plist
		infoplist_tmpl = os.path.join(iphone_dir,'Info.plist.template')
		infoplist = os.path.join(iphone_dir,'Info.plist')
		appicon = tip.generate_infoplist(infoplist,infoplist_tmpl,appid)
		
		# copy the app icon to the build resources
		iconf = os.path.join(iphone_tmp_dir,appicon)
		iconf_dest = os.path.join(dir,appicon)
		if os.path.exists(iconf):
			shutil.copy(iconf, iconf_dest)
	
		# compile to binary plist
		os.system("/usr/bin/plutil -convert binary1 \"%s\"" % plist_f)
	
	try:
		os.chdir(iphone_dir)
		
		# write out plist
		add_plist(os.path.join(iphone_dir,'Resources'))
		
		if command == 'simulator':
	
			# first build it
			log_id = uuid.uuid4()
			
			# make sure it's clean
			if os.path.exists(app_dir):
				shutil.rmtree(app_dir)
	
			os.system("xcodebuild -configuration Debug -sdk iphonesimulator%s WEB_SRC_ROOT='%s' GCC_PREPROCESSOR_DEFINITIONS='__LOG__ID__=%s DEPLOYTYPE=development'" % (iphone_version,iphone_tmp_dir,log_id))
	
			# clean since the xcodebuild copies
			cleanup_compiled_resources(app_dir)
			
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
				print "signal caught: %d" % signum
				if not log == None:
					print "calling log kill on %d" % log.pid
					try:
						os.system("kill -3 %d" % log.pid)
					except:
						pass
				if not sim == None:
					print "calling sim kill on %d" % sim.pid
					try:
						os.system("kill -3 %d" % sim.pid)
					except:
						pass
					
				kill_simulator()
				sys.exit(0)
	    
			signal.signal(signal.SIGHUP, handler)
			signal.signal(signal.SIGINT, handler)
			signal.signal(signal.SIGQUIT, handler)
			signal.signal(signal.SIGABRT, handler)
			signal.signal(signal.SIGTERM, handler)
	
			# launch the simulator
			sim = subprocess.Popen("\"%s\" launch \"%s\" %s" % (simulator,app_dir,iphone_version),shell=True)
			
			# activate the simulator window
			ass = os.path.join(template_dir,'iphone_sim_activate.scpt')
			cmd = "osascript \"%s\"" % ass
			os.system(cmd)
			
			os.waitpid(sim.pid,0)
			sim = None
	
			handler(3,None)
			sys.exit(0)
			
		elif command == 'install':
	
			# make sure it's clean
			if os.path.exists(app_bundle):
				shutil.rmtree(app_bundle)
	
			# clean since the xcodebuild copies
			cleanup_compiled_resources(app_bundle)
	
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
	
			# look for a code signing error
			error = re.findall(r'Code Sign error:(.*)',output)
			if len(error) > 0:
				print error[0].strip()
				sys.exit(1)
			
			# for install, launch itunes with the app
			cmd = "open -b com.apple.itunes \"%s\"" % app_bundle
			os.system(cmd)
			
			# now run our applescript to tell itunes to sync to get
			# the application on the phone
			ass = os.path.join(template_dir,'itunes_sync.scpt')
			cmd = "osascript \"%s\"" % ass
			os.system(cmd)
	
		elif command == 'distribute':
	
			# make sure it's clean
			if os.path.exists(app_bundle):
				shutil.rmtree(app_bundle)
				
			# in this case, we have to do different things based on if it's
			# an ad-hoc distribution cert or not - in the case of non-adhoc
			# we don't use the entitlements file but in ad hoc we need to
			adhoc_line = "CODE_SIGN_ENTITLEMENTS="
			if not is_adhoc(appuuid):
				adhoc_line="CODE_SIGN_ENTITLEMENTS = Resources/Entitlements.plist"
			
			# build the final release distribution
			output = run.run(["xcodebuild",
				"-configuration",
				"Release",
				"-sdk",
				"iphoneos%s" % iphone_version,
				"%s" % adhoc_line,
				"GCC_PREPROCESSOR_DEFINITIONS='DEPLOYTYPE=production'",
				"PROVISIONING_PROFILE[sdk=iphoneos*]=%s" % appuuid,
				"CODE_SIGN_IDENTITY[sdk=iphoneos*]=iPhone Distribution: %s" % dist_name
			])
			# look for a code signing error
			error = re.findall(r'Code Sign error:(.*)',output)
			if len(error) > 0:
				print error[0].strip()
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

