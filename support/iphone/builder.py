#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Build and Launch iPhone Application in Simulator or install
# the application on the device via iTunes
#

import os, sys, uuid, subprocess, shutil, signal, time, re, run, glob, codecs, hashlib
from compiler import Compiler
from projector import Projector
from pbxproj import PBXProj
from os.path import join, splitext, split, exists

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sys.path.append(os.path.join(template_dir,'../'))

from tiapp import *

ignoreFiles = ['.gitignore', '.cvsignore']
ignoreDirs = ['.git','.svn', 'CVS']

def dequote(s):
	if s[0:1] == '"':
		return s[1:-1]
	return s

def kill_simulator():
	run.run(['/usr/bin/killall',"iPhone Simulator"],True)

def write_project_property(f,prop,val):
	existing_val = read_project_property(f,prop)
	if existing_val!=val:
		fx = open(f,'w')
		fx.write("%s=%s\n"%(prop,val))
		fx.close()
		
def read_project_property(f,prop):
	if os.path.exists(f):
		contents = open(f).read()
		for line in contents.splitlines(False):
			(k,v) = line.split("=")
			if k == prop:
				return v
	return None

def read_project_appid(f):
	return read_project_property(f,'TI_APPID')
	
def read_project_version(f):
	return read_project_property(f,'TI_VERSION')
			
def infoplist_has_appid(f,appid):
	if os.path.exists(f):
		contents = open(f).read()
		return contents.find(appid)>0
	return False
		
def copy_module_resources(source, target, copy_all=False, force=False):
	if not os.path.exists(os.path.expanduser(target)):
		os.mkdirs(os.path.expanduser(target))
	for root, dirs, files in os.walk(source):
		for name in ignoreDirs:
			if name in dirs:
				dirs.remove(name)	# don't visit ignored directories			  
		for file in files:
			if copy_all==False and splitext(file)[-1] in ('.html', '.js', '.css', '.a', '.m', '.c', '.cpp', '.h', '.mm'):
				continue
			if file in ignoreFiles:
				continue
			from_ = os.path.join(root, file)			  
			to_ = os.path.expanduser(from_.replace(source, target, 1))
			to_directory = os.path.expanduser(split(to_)[0])
			if not exists(to_directory):
				os.makedirs(to_directory)
			# only copy if different filesize or doesn't exist
			if not os.path.exists(to_) or os.path.getsize(from_)!=os.path.getsize(to_) or force:
				if os.path.exists(to_): os.remove(to_)
				shutil.copyfile(from_, to_)

def make_appname(s):
	r = re.compile('[0-9a-zA-Z_]')
	buf = ''
	for i in s:
		if r.match(i)!=None:
			buf+=i
	# if name starts with number, we simply append a k to it
	if re.match('^[0-9]+',buf):
		buf = 'k%s' % buf
	return buf
				
def main(args):
	argc = len(args)
	if argc == 2 and (args[1]=='--help' or args[1]=='-h'):
		print "%s <command> <version> <project_dir> <appid> <name> [options]" % os.path.basename(args[0])
		print
		print "available commands: "
		print
		print "  install       install the app to itunes for testing on iphone"
		print "  simulator     build and run on the iphone simulator"
		print "  distribute    build final distribution bundle"
		print "  xcode         build from within xcode"
	
		sys.exit(1)

	print "[INFO] One moment, building ..."
	sys.stdout.flush()
	start_time = time.time()
	command = args[1].decode("utf-8")
	
	target = 'Debug'
	deploytype = 'development'
	devicefamily = None
	debug = False
	simulator = False
	xcode_build = False
	force_xcode = False
	
	if command == 'xcode':
		xcode_build = True
		project_dir = os.path.expanduser(dequote(args[2].decode("utf-8")))
		name = os.environ['PROJECT_NAME']
		target = os.environ['CONFIGURATION']
		appid = os.environ['TI_APPID']
		arch = os.environ['CURRENT_ARCH']
		sdk_name = os.environ['SDK_NAME']
		iphone_version = sdk_name.replace('iphoneos','').replace('iphonesimulator','')
		# SUPPORTED_DEVICE_FAMILIES 1 or 2 or both
		# TARGETED_DEVICE_FAMILY 1 or 2
		target_device = os.environ['TARGETED_DEVICE_FAMILY']
		if target_device == '1':
			devicefamily = 'iphone'
		elif target_device == '2':
			devicefamily = 'ipad'
		if arch == 'i386': 
			# simulator always indicates simulator
			deploytype = 'development'
		else:
			# if arch!=i386 indicates a build for device
			if target=='Debug':
				# non-simulator + debug build indicates test on device
				deploytype = 'test'
			else:
				# non-simulator + release build indicates package for distribution
				deploytype = 'production' 
		compiler = Compiler(project_dir,appid,name,deploytype,xcode_build,devicefamily,iphone_version)
	else:
		iphone_version = dequote(args[2].decode("utf-8"))
		iphonesim = os.path.abspath(os.path.join(template_dir,'iphonesim'))
		project_dir = os.path.expanduser(dequote(args[3].decode("utf-8")))
		appid = dequote(args[4].decode("utf-8"))
		name = dequote(args[5].decode("utf-8"))
		iphone_dir = os.path.abspath(os.path.join(project_dir,'build','iphone'))
		project_xcconfig = os.path.join(iphone_dir,'project.xcconfig')
		tiapp_xml = os.path.join(project_dir,'tiapp.xml')
		ti = TiAppXML(tiapp_xml)
		target = 'Release'
		ostype = 'os'
		version_file = None
		log_id = None
		
		if command == 'distribute':
			appuuid = dequote(args[6].decode("utf-8"))
			dist_name = dequote(args[7].decode("utf-8"))
			output_dir = os.path.expanduser(dequote(args[8].decode("utf-8")))
			if argc > 9:
				devicefamily = dequote(args[9].decode("utf-8"))
			deploytype = 'production'
		elif command == 'simulator':
			deploytype = 'development'
			debug = True
			simulator = True
			target = 'Debug'
			ostype = 'simulator'
			if argc > 6:
				devicefamily = dequote(args[6].decode("utf-8"))
		elif command == 'install':
			appuuid = dequote(args[6].decode("utf-8"))
			dist_name = dequote(args[7].decode("utf-8"))
			if argc > 8:
				devicefamily = dequote(args[8].decode("utf-8"))
			deploytype = 'test'
		
		build_out_dir = os.path.abspath(os.path.join(iphone_dir,'build'))
		build_dir = os.path.abspath(os.path.join(build_out_dir,'%s-iphone%s'%(target,ostype)))
		app_dir = os.path.abspath(os.path.join(build_dir,name+'.app'))
		binary = os.path.join(app_dir,name)
		sdk_version = os.path.basename(os.path.abspath(os.path.join(template_dir,'../')))
		iphone_resources_dir = os.path.join(iphone_dir,'Resources')
		version_file = os.path.join(iphone_resources_dir,'.simulator')
		force_rebuild = read_project_version(project_xcconfig)!=sdk_version or not os.path.exists(version_file)
		infoplist = os.path.join(iphone_dir,'Info.plist')

		# find the module directory relative to the root of the SDK	
		tp_module_dir = os.path.abspath(os.path.join(template_dir,'..','..','..','..','modules','iphone'))
		tp_modules = []
		tp_depends = []
		
		def find_depends(config,depends):
			for line in open(config).readlines():
				if line.find(':')!=-1:
					(token,value)=line.split(':')
					for entry in value.join(','):
						entry = entry.strip()
						try:
							depends.index(entry)
						except:
							depends.append(entry)

		tp_lib_search_path = []
		for module in ti.properties['modules']:
			tp_name = module['name'].lower()
			tp_version = module['version']
			tp_dir = os.path.join(tp_module_dir,tp_name,tp_version)
			if not os.path.exists(tp_dir):
				print "[ERROR] Third-party module: %s/%s detected in tiapp.xml but not found at %s" % (tp_name,tp_version,tp_dir)
				sys.exit(1)
			libname = 'lib%s.a' % tp_name
			tp_module = os.path.join(tp_dir,libname)
			if not os.path.exists(tp_module):
				print "[ERROR] Third-party module: %s/%s missing library at %s" % (tp_name,tp_version,tp_module)
				sys.exit(1)
			tp_config = os.path.join(tp_dir,'manifest')
			if not os.path.exists(tp_config):
				print "[ERROR] Third-party module: %s/%s missing manifest at %s" % (tp_name,tp_version,tp_config)
				sys.exit(1)
			find_depends(tp_config,tp_depends)	
			tp_modules.append(tp_module)
			tp_lib_search_path.append([libname,os.path.abspath(tp_module)])	
			print "[INFO] Detected third-party module: %s/%s" % (tp_name,tp_version)
			force_xcode = True
		
			# copy module resources
			img_dir = os.path.join(tp_dir,'assets','images')
			if os.path.exists(img_dir):
				dest_img_dir = os.path.join(app_dir,'modules',tp_name,'images')
				if not os.path.exists(dest_img_dir):
					os.makedirs(dest_img_dir)
				copy_module_resources(img_dir,dest_img_dir)
		
		print "[INFO] Titanium SDK version: %s" % sdk_version
		print "[INFO] iPhone Device family: %s" % devicefamily
		print "[INFO] iPhone SDK version: %s" % iphone_version
		
		if devicefamily!=None:
			xib = 'MainWindow_%s.xib' % devicefamily
		else:
			xib = 'MainWindow_iphone.xib'
		s = os.path.join(template_dir,xib)
		t = os.path.join(iphone_resources_dir,'MainWindow.xib')
		xib_out = open(s).read()
		xib_out = xib_out.replace('Titanium',make_appname(name))
		xib_f = open(t,'w')
		xib_f.write(xib_out)
		xib_f.close()
		
		if not simulator:
			version = ti.properties['version']
			# we want to make sure in debug mode the version always changes
			version = "%s.%d" % (version,time.time())
			ti.properties['version']=version
		
		# check to see if the appid is different (or not specified) - we need to re-generate
		# the Info.plist before we actually invoke the compiler in this case
		if read_project_appid(project_xcconfig)!=appid or not infoplist_has_appid(infoplist,appid):
			# write out the updated Info.plist
			infoplist_tmpl = os.path.join(iphone_dir,'Info.plist.template')
			if devicefamily!=None:
				ti.generate_infoplist(infoplist,infoplist_tmpl,appid,devicefamily)
			else:
				ti.generate_infoplist(infoplist,infoplist_tmpl,appid,'iphone')
		
		new_lib_hash = None
		lib_hash = None	
		
		if simulator and force_xcode==False:
			if os.path.exists(app_dir):
				if os.path.exists(version_file):
					line = open(version_file).read().strip()
					lines = line.split(",")
					v = lines[0]
					log_id = lines[1]
					if len(lines) > 2:
						lib_hash = lines[2]
						if iphone_version!=lines[3]:
							force_xcode=True
					if lib_hash==None:
						force_xcode = True
					else:
						if template_dir==v and force_rebuild==False:
							force_rebuild = False
						else:
							log_id = None

		if simulator:
			source_lib=os.path.join(template_dir,'libTiCore.a')
			fd = open(source_lib,'rb')
			m = hashlib.md5()
			m.update(fd.read(1024)) # just read 1K, it's binary
			new_lib_hash = m.hexdigest()
			fd.close()
		
		if force_xcode==False and new_lib_hash!=lib_hash:
			force_xcode=True
		
		lib_hash=new_lib_hash
					
		if force_rebuild:
			print "[INFO] Performing full rebuild. This will take a little bit. Hold tight..."
			sys.stdout.flush()
			project = Projector(name,sdk_version,template_dir,project_dir,appid)
			project.create(template_dir,iphone_dir)	
			force_xcode = True
		else:
			xcconfig = open(project_xcconfig,'w')
			xcconfig.write("TI_VERSION=%s\n"% sdk_version)
			xcconfig.write("TI_SDK_DIR=%s\n" % template_dir.replace(sdk_version,'$(TI_VERSION)'))
			xcconfig.write("TI_PROJECT_DIR=%s\n" % project_dir)
			xcconfig.write("TI_APPID=%s\n" % appid)
			xcconfig.close()
			
		# write out any modules into the xcode project
		# this must be done after project create above or this will be overriden
		if len(tp_lib_search_path)>0:
			proj = PBXProj()
			xcode_proj = os.path.join(iphone_dir,'%s.xcodeproj'%name,'project.pbxproj')
			current_xcode = open(xcode_proj).read()
			for tp in tp_lib_search_path:
				proj.add_static_library(tp[0],tp[1])
			out = proj.parse(xcode_proj)
			# since xcode changes can be destructive, only write as necessary (if changed)
			if current_xcode!=out:
				o = open(xcode_proj,'w')
				o.write(out)
				o.close()

		cwd = os.getcwd()
		
		# check to see if the symlink exists and that it points to the
		# right version of the library
		libticore = os.path.join(template_dir,'libTiCore.a')
		make_link = True
		symlink = os.path.join(iphone_dir,'lib','libTiCore.a')
		if os.path.islink(symlink):
			path = os.path.realpath(symlink)
			if path.find(sdk_version) > 0:
				make_link = False
		if make_link:
			if os.path.exists("libTiCore.a"): os.unlink("libTiCore.a")
			libdir = os.path.join(iphone_dir,'lib')
			if not os.path.exists(libdir): os.makedirs(libdir)
			os.chdir(libdir)
			os.symlink(libticore,"libTiCore.a")
			os.chdir(cwd)
		
		def optimize_build():
			return run.run(["/Developer/Platforms/iPhoneOS.platform/Developer/usr/bin/iphoneos-optimize",app_dir])
		
		try:		
			os.chdir(iphone_dir)
			
			deploy_target = "IPHONEOS_DEPLOYMENT_TARGET=3.1"
			device_target = 'TARGETED_DEVICE_FAMILY=iPhone'  # this is non-sensical, but you can't pass empty string

			# write out the build log, useful for debugging
			if not os.path.exists(build_out_dir): os.makedirs(build_out_dir)
			o = open(os.path.join(build_out_dir,'build.log'),'w')

			if devicefamily!=None:
				if devicefamily == 'ipad':
					device_target=" TARGETED_DEVICE_FAMILY=iPad"
					deploy_target = "IPHONEOS_DEPLOYMENT_TARGET=3.2"
			
			def is_adhoc(uuid):
				path = "~/Library/MobileDevice/Provisioning Profiles/%s.mobileprovision" % uuid
				f = os.path.expanduser(path)
				if os.path.exists(f):
					c = codecs.open(f,'r','utf-8','replace').read()
					return c.find("ProvisionedDevices")!=-1
				return False	
	
			def execute_xcode(sdk,extras,print_output=True):
				
				args = ["xcodebuild","-configuration",target,"-sdk",sdk]
				args += extras
				args += [deploy_target,device_target]
				
				o.write("Starting Xcode compile with the following arguments:\n\n")
				for arg in args: o.write("    %s\n" % arg)
				o.write("\n\n")
				o.flush()
				
				if print_output:
					print "[DEBUG] compile checkpoint: %0.2f seconds" % (time.time()-start_time)
					print "[INFO] Executing XCode build..."
					print "[BEGIN_VERBOSE] Executing XCode Compiler  <span>[toggle output]</span>"

				output = run.run(args)
				
				if print_output:
					print output
					print "[END_VERBOSE]"
					sys.stdout.flush()

				o.write(output)
				
				# check to make sure the user doesn't have a custom build location 
				# configured in Xcode which currently causes issues with titanium
				idx = output.find("TARGET_BUILD_DIR ")
				if idx > 0:
					endidx = output.find("\n",idx)
					if endidx > 0:
						target_build_dir = output[idx+17:endidx].strip()
						if target_build_dir!=build_dir:
							print "[ERROR] Your TARGET_BUILD_DIR is incorrectly set. Most likely you have configured in Xcode a customized build location. Titanium does not currently support this configuration."
							print "[ERROR] Expected dir %s, was: %s" % (build_dir,target_build_dir)
							sys.stdout.flush()
							sys.exit(1)
			
				# look for build error
				if output.find("** BUILD FAILED **")!=-1 or output.find("ld returned 1")!=-1 or output.find("The following build commands failed:")!=-1 or not os.path.exists(binary):
					print "[ERROR] Build Failed. Please see output for more details"
					sys.stdout.flush()
					sys.exit(1)
					
				# look for a code signing error
				error = re.findall(r'Code Sign error:(.*)',output)
				if len(error) > 0:
					print "[ERROR] Code sign error: %s" % error[0].strip()
					sys.stdout.flush()
					sys.exit(1)
		
			if command == 'simulator':
				
				# only build if force rebuild (different version) or 
				# the app hasn't yet been built initially
				if ti.properties['guid']!=log_id or force_xcode:
					log_id = ti.properties['guid']
					f = open(version_file,'w+')
					f.write("%s,%s,%s,%s" % (template_dir,log_id,lib_hash,iphone_version))
					f.close()
				
				if force_rebuild or force_xcode or not os.path.exists(binary):
					shutil.copy(os.path.join(template_dir,'Classes','defines.h'),os.path.join(iphone_dir,'Classes','defines.h'))
					execute_xcode("iphonesimulator%s" % iphone_version,["GCC_PREPROCESSOR_DEFINITIONS=__LOG__ID__=%s DEPLOYTYPE=development DEBUG=1 TI_VERSION=%s" % (log_id,sdk_version)])
				
				# first make sure it's not running
				kill_simulator()
				
				o.close()

				# sometimes the simulator doesn't remove old log files
				# in which case we get our logging jacked - we need to remove
				# them before running the simulator
				def cleanup_app_logfiles():
					print "[DEBUG] finding old log files"
					sys.stdout.flush()
					def find_all_log_files(folder, fname):
						results = []
						for root, dirs, files in os.walk(os.path.expanduser(folder)):
							for file in files:
								if fname==file:
									fullpath = os.path.join(root, file)
									results.append(fullpath)
						return results
					for f in find_all_log_files("~/Library/Application Support/iPhone Simulator",'%s.log' % log_id):
						print "[DEBUG] removing old log file: %s" % f
						sys.stdout.flush()
						os.remove(f)

				cleanup_app_logfiles()

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
			
				# launch the simulator
				if devicefamily==None:
					sim = subprocess.Popen("\"%s\" launch \"%s\" %s iphone" % (iphonesim,app_dir,iphone_version),shell=True)
				else:
					sim = subprocess.Popen("\"%s\" launch \"%s\" %s %s" % (iphonesim,app_dir,iphone_version,devicefamily),shell=True)

				# activate the simulator window
				ass = os.path.join(template_dir,'iphone_sim_activate.scpt')
				cmd = "osascript \"%s\"" % ass
				os.system(cmd)

				end_time = time.time()-start_time

				print "[INFO] Launched application in Simulator (%0.2f seconds)" % end_time
				sys.stdout.flush()
				sys.stderr.flush()

				# give the simulator a bit to get started and up and running before 
				# starting the logger
				time.sleep(2)

				logger = os.path.realpath(os.path.join(template_dir,'logger.py'))

				# start the logger
				log = subprocess.Popen([
				  	logger,
					str(log_id)+'.log',
					iphone_version
				])	

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

				args = [
					"GCC_PREPROCESSOR_DEFINITIONS='DEPLOYTYPE=test'",
					"PROVISIONING_PROFILE[sdk=iphoneos*]=%s" % appuuid,
					"CODE_SIGN_IDENTITY[sdk=iphoneos*]=iPhone Developer: %s" % dist_name
				]
				execute_xcode("iphoneos%s" % iphone_version,args,False)
				
				print "[INFO] Installing application in iTunes ... one moment"
				sys.stdout.flush()
				
				output = run.run(["/Developer/Platforms/iPhoneOS.platform/Developer/usr/bin/PackageApplication",app_dir,"-v"])
				o.write(output)
				
				# optimize the build
				output = optimize_build()
				o.write(output)

				# for install, launch itunes with the app
				ipa = os.path.join(os.path.dirname(app_dir),"%s.ipa" % name)
				cmd = "open -b com.apple.itunes \"%s\"" % ipa
				os.system(cmd)
				
				# now run our applescript to tell itunes to sync to get
				# the application on the phone
				ass = os.path.join(template_dir,'itunes_sync.scpt')
				cmd = "osascript \"%s\"" % ass
				os.system(cmd)
				
				print "[INFO] iTunes sync initiated"

				o.close()
				sys.stdout.flush()
				sys.exit(0)
				
			elif command == 'distribute':

				# in this case, we have to do different things based on if it's
				# an ad-hoc distribution cert or not - in the case of non-adhoc
				# we don't use the entitlements file but in ad hoc we need to
				adhoc_line = ""
				deploytype = "production_adhoc"
				if not is_adhoc(appuuid):
					adhoc_line="CODE_SIGN_ENTITLEMENTS = Resources/Entitlements.plist"
					deploytype = "production"

				# build the final release distribution
				args = [
					adhoc_line,
					"GCC_PREPROCESSOR_DEFINITIONS='DEPLOYTYPE=%s'" % deploytype,
					"PROVISIONING_PROFILE[sdk=iphoneos*]=%s" % appuuid,
					"CODE_SIGN_IDENTITY[sdk=iphoneos*]=iPhone Distribution: %s" % dist_name
				]
				execute_xcode("iphoneos%s" % iphone_version,args,False)

				# optimize the build
				output = optimize_build()
				o.write(output)
				o.close()

				# switch to app_bundle for zip
				os.chdir(app_bundle_folder)

				outfile = os.path.join(output_dir,"%s.zip"%app_name)
				if os.path.exists(outfile): os.remove(outfile)
				
				# you *must* use ditto here or it won't upload to appstore
				os.system('ditto -ck --keepParent --sequesterRsrc "%s" "%s"' % (app_name,outfile))
				
				sys.exit(0)
				
		finally:
			os.chdir(cwd)

if __name__ == "__main__":
    main(sys.argv)
