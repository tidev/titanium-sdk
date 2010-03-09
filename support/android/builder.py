#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Android Simulator for building a project and launching
# the Android Emulator or on the device
#
import os, sys, subprocess, shutil, time, signal, string, platform, re, run, avd, glob
from os.path import splitext
from compiler import Compiler
from os.path import join, splitext, split, exists
from shutil import copyfile

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sys.path.append(os.path.join(template_dir,'..'))
from tiapp import *
from android import Android
from androidsdk import AndroidSDK

ignoreFiles = ['.gitignore', '.cvsignore', '.DS_Store'];
ignoreDirs = ['.git','.svn','_svn', 'CVS'];

def dequote(s):
	if s[0:1] == '"':
		return s[1:-1]
	return s

def pipe(args1,args2):
	p1 = subprocess.Popen(args1, stdout=subprocess.PIPE)
	p2 = subprocess.Popen(args2, stdin=p1.stdout, stdout=subprocess.PIPE)
	return p2.communicate()[0]

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

def copy_resources(source, target):
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


class Builder(object):

	def __init__(self, name, sdk, project_dir, support_dir, app_id):
		self.top_dir = project_dir
		self.project_dir = os.path.join(project_dir,'build','android')
		# this is hardcoded for now
		self.sdk = AndroidSDK(sdk, 4)
		self.name = name
		self.app_id = app_id
		self.support_dir = support_dir
		
		# we place some files in the users home
		if platform.system() == "Windows":
			self.home_dir = os.path.join(os.environ['USERPROFILE'], '.titanium')
			self.android_home_dir = os.path.join(os.environ['USERPROFILE'], '.android')
		else:
			self.home_dir = os.path.join(os.path.expanduser('~'), '.titanium')
			self.android_home_dir = os.path.join(os.path.expanduser('~'), '.android')
		
		if not os.path.exists(self.home_dir):
			os.makedirs(self.home_dir)
		self.sdcard = os.path.join(self.home_dir,'android.sdcard')
		self.classname = "".join(string.capwords(self.name).split(' '))
		

	def wait_for_device(self,type):
		print "[DEBUG] Waiting for device to be ready ..."
		sys.stdout.flush()
		t = time.time()
		while True:
			output = run.run([self.sdk.get_adb(),"-%s" % type, 'devices'],True)
			print "[TRACE] wait_for_device returned: %s" % output
			if output != None: 
				if output.find("emulator-")!=None or (time.time()-t > 0.2):
					break
			time.sleep(1)
		print "[DEBUG] Device connected..."
		sys.stdout.flush()
		duration = time.time() - t
		print "[DEBUG] waited %f seconds on emulator to get ready" % duration
		if duration > 0.15:
			print "[INFO] Waiting for the Android Emulator to become available"
			time.sleep(10) # give it a little more time to get installed
	
	def create_avd(self,avd_id,avd_skin):
		name = "titanium_%s_%s" % (avd_id,avd_skin)
		if not os.path.exists(self.home_dir):
			os.makedirs(self.home_dir)
		sdcard = os.path.abspath(os.path.join(self.home_dir,'android.sdcard'))
		if not os.path.exists(sdcard):
			print "[INFO] Created shared 10M SD card for use in Android emulator(s)"
			run.run([self.sdk.get_mksdcard(), '10M', sdcard])

		avd_path = os.path.join(self.android_home_dir, 'avd')
		my_avd = os.path.join(avd_path,"%s.avd" % name)
		if not os.path.exists(my_avd):
			print "[INFO] creating new AVD %s %s" % (avd_id,avd_skin)
			inputgen = os.path.join(template_dir,'input.py')
			pipe([sys.executable, inputgen], [self.sdk.get_android(), '--verbose', 'create', 'avd', '--name', name, '--target', avd_id, '-s', avd_skin, '--force', '--sdcard', sdcard])
			inifile = os.path.join(my_avd,'config.ini')
			inifilec = open(inifile,'r').read()
			inifiledata = open(inifile,'w')
			inifiledata.write(inifilec)
			inifiledata.write("hw.camera=yes\n")
			inifiledata.close()
			
		return name
	
	def run_emulator(self,avd_id,avd_skin):
		
		print "[INFO] Launching Android emulator...one moment"
		print "[DEBUG] From: " + self.sdk.get_emulator()
		print "[DEBUG] SDCard: " + self.sdcard
		print "[DEBUG] AVD ID: " + avd_id
		print "[DEBUG] AVD Skin: " + avd_skin
		print "[DEBUG] SDK: " + sdk_dir
		
		# flush before a long IO operation
		sys.stdout.flush()
		
		# this will create an AVD on demand or re-use existing one if already created
		avd_name = self.create_avd(avd_id,avd_skin)

		sys.stdout.flush()

		# start the emulator
		p = subprocess.Popen([
			self.sdk.get_emulator(),
			'-avd',
			avd_name,
			'-port',
			'5560',
			'-sdcard',
			self.sdcard,
			'-logcat',
			"'*:d *'"
		])
		
		def handler(signum, frame):
			print "[DEBUG] signal caught: %d" % signum
			if not p == None:
				print "[DEBUG] calling emulator kill on %d" % p.pid
				os.system("kill -9 %d" % p.pid)

		if platform.system() != "Windows":
			signal.signal(signal.SIGHUP, handler)
			signal.signal(signal.SIGQUIT, handler)
		
		signal.signal(signal.SIGINT, handler)
		signal.signal(signal.SIGABRT, handler)
		signal.signal(signal.SIGTERM, handler)
		
		# give it some time to exit prematurely
		time.sleep(1)
		rc = p.poll()
		
		if rc != None:
			handler(3,None)
			sys.exit(rc)
		
		# wait for the emulator to finish
		try:
			rc = p.wait()
		except OSError:
			handler(3,None)

		print "[INFO] Android Emulator has exited"
		sys.exit(rc)
	
	def build_and_run(self, install, avd_id, keystore=None, keystore_pass='tirocks', keystore_alias='tidev', dist_dir=None):
		deploy_type = 'development'
		if install:
			if keystore == None:
				deploy_type = 'test'
			else:
				deploy_type = 'production'
		
		aapt = self.sdk.get_aapt()
		android_jar = self.sdk.get_android_jar()
		titanium_jar = os.path.join(self.support_dir,'titanium.jar')
		dx = self.sdk.get_dx()
		apkbuilder = self.sdk.get_apkbuilder()
		
		if keystore==None:
			keystore = os.path.join(self.support_dir,'dev_keystore')
		
		curdir = os.getcwd()
		android_jars = glob.glob(os.path.join(self.support_dir, '*.jar'))
		timapjar = os.path.join(self.support_dir, 'modules', 'titanium-map.jar')
		ti_resources_dir = os.path.join(self.support_dir, 'resources')
		
		try:
			os.chdir(self.project_dir)
			
			if os.path.exists('bin'):
				shutil.rmtree('bin')
			os.makedirs('bin')
			
			if os.path.exists('lib'):
				for jar in android_jars:
					shutil.copy(jar, 'lib')

			resources_dir = os.path.join(self.top_dir,'Resources')
			assets_dir = os.path.join(self.project_dir,'bin','assets')
			asset_resource_dir = os.path.join(assets_dir,'Resources')
			
			if not os.path.exists(assets_dir):
				os.makedirs(assets_dir)
			
			shutil.copy(os.path.join(self.top_dir,'tiapp.xml'), assets_dir)
			finalxml = os.path.join(assets_dir,'tiapp.xml')
			tiapp = TiAppXML(finalxml)
			tiapp.setDeployType(deploy_type)
			
			# we re-run the create each time through in case any of our key files
			# have changed
			android = Android(self.name,self.app_id,self.sdk)
			android.create(os.path.abspath(os.path.join(self.top_dir,'..')),True)

			# transform resources
			def strip_slash(s):
				if s[0:1]=='/' or s[0:1]=='\\': return s[1:]
				return s
			def recursive_cp(dir,dest):
				for root, dirs, files in os.walk(dir):
					# Remove file from the list of files copied
					# that shouldn't appear in the binaries
					for name in ignoreFiles:
						if name in files:
							files.remove(name);
					for name in ignoreDirs:
						if name in dirs:
							dirs.remove(name)
					# Copy remaining files
					relative = strip_slash(root.replace(dir,''))
					relative_dest = os.path.join(dest,relative)
					if not os.path.exists(relative_dest):
						os.makedirs(relative_dest)
					for f in files:
						fullpath = os.path.join(root,f)
						relativedest = os.path.join(dest,relative,f)
						print "[TRACE] COPYING: %s => %s" %(fullpath,relativedest)
						shutil.copy(fullpath,relativedest)

			if os.path.exists(asset_resource_dir):
				shutil.rmtree(asset_resource_dir)
			os.makedirs(asset_resource_dir)
			recursive_cp(resources_dir,asset_resource_dir)
			if os.path.exists(os.path.join(asset_resource_dir,'iphone')):
				shutil.rmtree(os.path.join(asset_resource_dir,'iphone'))
			if os.path.exists(os.path.join(resources_dir,'android')):
				recursive_cp(os.path.join(resources_dir,'android'),asset_resource_dir)		
				shutil.rmtree(os.path.join(asset_resource_dir,'android'))
				


			sys.stdout.flush()

			if not os.path.exists(assets_dir):
				os.makedirs(assets_dir)
				
			my_avd = None	
			google_apis_supported = False
				
			# find the AVD we've selected and determine if we support Google APIs
			for avd_props in avd.get_avds(self.sdk):
				if avd_props['id'] == avd_id:
					my_avd = avd_props
					google_apis_supported = (my_avd['name'].find('Google')!=-1)
					break

			# compile resources
			full_resource_dir = os.path.join(self.project_dir,asset_resource_dir)
			compiler = Compiler(self.app_id,full_resource_dir,False)
			compiler.compile()
			
			# Android SDK version --- FIXME: this is hardcoded until i hook in Nolan's code from Developer
			android_sdk_version = '4'
			
			# NOTE: these are built-in permissions we need -- we probably need to refine when these are needed too
			permissions_required = ['INTERNET','ACCESS_WIFI_STATE','ACCESS_NETWORK_STATE']
			
			GEO_PERMISSION = [ 'ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION', 'ACCESS_MOCK_LOCATION']
			CONTACTS_PERMISSION = ['READ_CONTACTS']
			VIBRATE_PERMISSION = ['VIBRATE']
			CAMERA_PERMISSION = ['CAMERA']
			
			# this is our module method to permission(s) trigger - for each method on the left, require the permission(s) on the right
			permission_mapping = {
				# GEO
				'Geolocation.watchPosition' : GEO_PERMISSION,
				'Geolocation.getCurrentPosition' : GEO_PERMISSION,
				'Geolocation.watchHeading' : GEO_PERMISSION,
				'Geolocation.getCurrentHeading' : GEO_PERMISSION,
				
				# MEDIA
				'Media.vibrate' : VIBRATE_PERMISSION,
				'Media.createVideoPlayer' : CAMERA_PERMISSION,
				'Media.showCamera' : CAMERA_PERMISSION,
				
				# CONTACTS
				'Contacts.createContact' : CONTACTS_PERMISSION,
				'Contacts.saveContact' : CONTACTS_PERMISSION,
				'Contacts.removeContact' : CONTACTS_PERMISSION,
				'Contacts.addContact' : CONTACTS_PERMISSION,
				'Contacts.getAllContacts' : CONTACTS_PERMISSION,
				'Contacts.showContactPicker' : CONTACTS_PERMISSION,
			}
			
			VIDEO_ACTIVITY = """<activity
			android:name="ti.modules.titanium.media.TiVideoActivity"
			android:configChanges="keyboardHidden|orientation"
			android:launchMode="singleTask"
	    	/>"""
	
			MAP_ACTIVITY = """<activity
	    		android:name="ti.modules.titanium.map.TiMapActivity"
	    		android:configChanges="keyboardHidden|orientation"
	    		android:launchMode="singleTask"
	    	/>
		<uses-library android:name="com.google.android.maps" />"""
	
			FACEBOOK_ACTIVITY = """<activity 
			android:name="org.appcelerator.titanium.module.facebook.FBActivity"
			android:theme="@android:style/Theme.Translucent.NoTitleBar"
        />"""
			
			activity_mapping = {
			
				# MEDIA
				'Media.createVideoPlayer' : VIDEO_ACTIVITY,
				
				# MAPS
				'Map.createView' : MAP_ACTIVITY,
		    	
				# FACEBOOK
				'Facebook.setup' : FACEBOOK_ACTIVITY,
				'Facebook.login' : FACEBOOK_ACTIVITY,
				'Facebook.createLoginButton' : FACEBOOK_ACTIVITY,
			}
			
			# this is a map of our APIs to ones that require Google APIs to be available on the device
			google_apis = {
				"Map.createView" : True
			}
			
			activities = []
			
			# figure out which permissions we need based on the used module methods
			for mn in compiler.module_methods:
				try:
					perms = permission_mapping[mn]
					if perms:
						for perm in perms: 
							try:
								permissions_required.index(perm)
							except:
								permissions_required.append(perm)
				except:
					pass
				try:
					mappings = activity_mapping[mn]
					try:
						if google_apis[mn] and not google_apis_supported:
							print "[WARN] Google APIs detected but a device has been selected that doesn't support them. The API call to Titanium.%s will fail using '%s'" % (mn,my_avd['name'])
							sys.stdout.flush()
							continue
					except:
						pass
					try:
						activities.index(mappings)
					except:
						activities.append(mappings)
				except:
					pass
			
			# build the permissions XML based on the permissions detected
			permissions_required_xml = ""
			for p in permissions_required:
				permissions_required_xml+="<uses-permission android:name=\"android.permission.%s\"/>\n\t" % p
			
			use_maps = False
			# copy any module image directories
			for module in compiler.modules:
				if module.lower() == 'map' and google_apis_supported:
					use_maps = True
					print "[INFO] Detected Google Maps dependency. Using Titanium + Maps"
				img_dir = os.path.abspath(os.path.join(template_dir,'modules',module.lower(),'images'))
				if os.path.exists(img_dir):
					dest_img_dir = os.path.join(full_resource_dir,'modules',module.lower(),'images')
					if os.path.exists(dest_img_dir):
						shutil.rmtree(dest_img_dir)
					os.makedirs(dest_img_dir)
					copy_resources(img_dir,dest_img_dir)
				

			iconname = tiapp.properties['icon']
			iconpath = os.path.join(asset_resource_dir,iconname)
			iconext = os.path.splitext(iconpath)[1]
			if not os.path.exists(os.path.join('res','drawable')):
				os.makedirs(os.path.join('res','drawable'))
				
			existingicon = os.path.join('res','drawable','appicon%s' % iconext)	
			if os.path.exists(existingicon):	
				os.remove(existingicon)
			if os.path.exists(iconpath):
				shutil.copy(iconpath,existingicon)
			else:
				shutil.copy(os.path.join(ti_resources_dir, 'default.png'), existingicon)

			# make our Titanium theme for our icon
			resfiledir = os.path.join('res','values')
			if not os.path.exists(resfiledir):
				os.makedirs(resfiledir)
			resfilepath = os.path.join(resfiledir,'theme.xml')
			if not os.path.exists(resfilepath):
				resfile = open(resfilepath,'w')
				TITANIUM_THEME="""<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.Titanium" parent="android:Theme">
        <item name="android:windowBackground">@drawable/background</item>
    </style>
</resources>
	"""
				resfile.write(TITANIUM_THEME)
				resfile.close()
			
			# create our background image which acts as splash screen during load	
			splashimage = os.path.join(asset_resource_dir,'default.png')
			background_png = os.path.join('res','drawable','background.png')
			if os.path.exists(splashimage):
				print "[DEBUG] found splash screen at %s" % os.path.abspath(splashimage)
				shutil.copy(splashimage, background_png)
			else:
				shutil.copy(os.path.join(ti_resources_dir, 'default.png'), background_png)
			

			src_dir = os.path.join(self.project_dir, 'src')
			android_manifest = os.path.join(self.project_dir, 'AndroidManifest.xml')
			
			android_manifest_to_read = android_manifest

			# NOTE: allow the user to use their own custom AndroidManifest if they put a file named
			# AndroidManifest.custom.xml in their android project directory in which case all bets are
			# off
			android_custom_manifest = os.path.join(self.project_dir, 'AndroidManifest.custom.xml')
			if os.path.exists(android_custom_manifest):
				android_manifest_to_read = android_custom_manifest
				print "[INFO] Detected custom ApplicationManifest.xml -- no Titanium version migration supported"
			
			# we need to write out the new manifest
			manifest_contents = open(android_manifest_to_read,'r').read()
			manifest_contents = manifest_contents.replace('<!-- TI_ACTIVITIES -->',"\n\n\t\t".join(activities))
			manifest_contents = manifest_contents.replace('<!-- TI_PERMISSIONS -->',permissions_required_xml)
			manifest_contents = manifest_contents.replace('<uses-sdk android:minSdkVersion="4" />', '<uses-sdk android:minSdkVersion="%s" />' % android_sdk_version)

			# write out the new manifest
			amf = open(android_manifest,'w')
			amf.write(manifest_contents)
			amf.close()
			
			res_dir = os.path.join(self.project_dir, 'res')
			output = run.run([aapt, 'package', '-m', '-J', src_dir, '-M', android_manifest, '-S', res_dir, '-I', android_jar])
			if output == None:
				sys.exit(1)
			success = re.findall(r'ERROR (.*)',output)
			if len(success) > 0:
				print "[ERROR] %s" % success[0]
				sys.exit(1)
			
			srclist = []
			jarlist = []
						
			for root, dirs, files in os.walk(os.path.join(self.project_dir,'src')):
				# Strip out directories we shouldn't traverse
				for name in ignoreDirs:
					if name in dirs:
						dirs.remove(name)
						
				if len(files) > 0:
					for f in files:
						if f in ignoreFiles : continue
						path = root + os.sep + f
						srclist.append(path)
		
			project_module_dir = os.path.join(self.top_dir,'modules','android')
			if os.path.exists(project_module_dir):
				for root, dirs, files in os.walk(project_module_dir):
					# Strip out directories we shouldn't traverse
					for name in ignoreDirs:
						if name in dirs:
							dirs.remove(name)

					if len(files) > 0:
						for f in files:
							path = root + os.sep + f
							ext = splitext(f)[-1]
							if ext in ('.java'):
								srclist.append(path)
							elif ext in ('.jar'):
								jarlist.append(path) 
				
		
			classes_dir = os.path.join(self.project_dir, 'bin', 'classes')	
			if not os.path.exists(classes_dir):
				os.makedirs(classes_dir)

			jarsigner = "jarsigner"	
			javac = "javac"
			java = "java"
			if platform.system() == "Windows":
				if os.environ.has_key("JAVA_HOME"):
					home_jarsigner = os.path.join(os.environ["JAVA_HOME"], "bin", "jarsigner.exe")
					home_javac = os.path.join(os.environ["JAVA_HOME"], "bin", "javac.exe")
					home_java = os.path.join(os.environ["JAVA_HOME"], "bin", "java.exe")
					if os.path.exists(home_jarsigner):
						jarsigner = home_jarsigner
					if os.path.exists(home_javac):
						javac = home_javac
					if os.path.exists(home_java):
						java = home_java
				else:
					found = False
					for path in os.environ['PATH'].split(os.pathsep):
						if os.path.exists(os.path.join(path, 'jarsigner.exe')) and os.path.exists(os.path.join(path, 'javac.exe')):
							jarsigner = os.path.join(path, 'jarsigner.exe')
							javac = os.path.join(path, 'javac.exe')
							java = os.path.join(path, 'java.exe')
							found = True
							break
					if not found:
						print "[ERROR] Error locating JDK: set $JAVA_HOME or put javac and jarsigner on your $PATH"
						sys.exit(1)
						
			# see if the user has app data and if so, compile in the user data
			# such that it can be accessed automatically using Titanium.App.Properties.getString
			app_data_cfg = os.path.join(self.top_dir,"appdata.cfg")
			if os.path.exists(app_data_cfg):
				props = read_properties(open(app_data_cfg,"r"))
				module_data = ''
				for key in props.keys():
					data = props[key]
					module_data+="properties.setString(\"%s\",\"%s\");\n   " % (key,data)
					print("[DEBUG] detected user application data at = %s"% app_data_cfg)
					sys.stdout.flush()
					dtf = os.path.join(src_dir,"AppUserData.java")
					if os.path.exists(dtf):
						os.remove(dtf)
					ctf = open(dtf,"w")
					cf_template = open(os.path.join(template_dir,'templates','AppUserData.java'),'r').read()
					cf_template = cf_template.replace('__MODULE_BODY__',module_data)
					ctf.write(cf_template)
					ctf.close()
					srclist.append(dtf)
						
			classpath = android_jar + os.pathsep + titanium_jar + os.pathsep.join(jarlist)
			# TODO re-enable me
			if use_maps:
				classpath += os.pathsep + timapjar
			
			javac_command = [javac, '-classpath', classpath, '-d', classes_dir, '-sourcepath', src_dir]
			javac_command += srclist
			print "[DEBUG] %s" % javac_command
			sys.stdout.flush()
			out = run.run(javac_command)
			
			classes_dex = os.path.join(self.project_dir, 'bin', 'classes.dex')
			android_module_jars = glob.glob(os.path.join(self.support_dir, 'modules', 'titanium-*.jar'))
			
			# the dx.bat that ships with android in windows doesn't allow command line
			# overriding of the java heap space, so we call the jar directly
			if platform.system() == 'Windows':
				dex_args = [java, '-Xmx512M', '-Djava.ext.dirs=%s' % self.sdk.get_platform_tools_dir(), '-jar', self.sdk.get_dx_jar()]
			else:
				dex_args = [dx, '-JXmx512M']
			dex_args += ['--dex', '--output='+classes_dex, classes_dir]
			dex_args += android_jars
			dex_args += android_module_jars
			
			run.run(dex_args)
			
			ap_ = os.path.join(self.project_dir, 'bin', 'app.ap_')
			rhino_jar = os.path.join(self.support_dir, 'js.jar')
			run.run([aapt, 'package', '-f', '-M', 'AndroidManifest.xml', '-A', assets_dir, '-S', 'res', '-I', android_jar, '-I', titanium_jar, '-F', ap_])
		
			unsigned_apk = os.path.join(self.project_dir, 'bin', 'app-unsigned.apk')
			apk_build_cmd = [apkbuilder, unsigned_apk, '-u', '-z', ap_, '-f', classes_dex, '-rf', src_dir, '-rj', titanium_jar, '-rj', rhino_jar]
			for module in android_module_jars:
				apk_build_cmd += ['-rj', module]
			
			run.run(apk_build_cmd)
	
			if dist_dir:
				app_apk = os.path.join(dist_dir, project_name + '.apk')	
			else:
				app_apk = os.path.join(self.project_dir, 'bin', 'app.apk')	

			output = run.run([jarsigner, '-storepass', keystore_pass, '-keystore', keystore, '-signedjar', app_apk, unsigned_apk, keystore_alias])
			success = re.findall(r'RuntimeException: (.*)',output)
			if len(success) > 0:
				print "[ERROR] %s " %success[0]
				sys.exit(1)
				
			# NOTE: we can't zipalign until we officially support 1.6+
			# # attempt to zipalign -- this only exists in 1.6 and above so be nice
			# zipalign = os.path.join(self.tools_dir,'zipalign')
			# if platform.system() == "Windows":
			# 	zipalign+=".exe"
			# 	
			# if os.path.exists(zipalign):
			# 	#zipalign -v 4 source.apk destination.apk
			# 	run.run([zipalign, '-v', '4', app_apk, app_apk+'z'])
			# 	os.rename(app_apk+'z',app_apk)

			if dist_dir:
				sys.exit(0)			

			out = subprocess.Popen([self.sdk.get_adb(),'get-state'], stderr=subprocess.PIPE, stdout=subprocess.PIPE).communicate()[0]
			out = str(out).strip()
			
			# try a few times as sometimes it fails waiting on boot
			attempts = 0
			launched = False
			launch_failed = False
			while attempts < 5:
				try:
					cmd = [self.sdk.get_adb()]
					if install:
						self.wait_for_device('d')
						print "[INFO] Installing application on emulator"
						cmd += ['-d', 'install', '-r', app_apk]
					else:
						self.wait_for_device('e')
						print "[INFO] Installing application on device"
						cmd += ['-e', 'install', '-r', app_apk]
					if run.run(cmd)==None:
						launch_failed = True
					elif not install:
						launched = True
					break
				except:
					time.sleep(3)
					attempts+=1

			if launched:
				print "[INFO] Launching application ... %s" % self.name
				sys.stdout.flush()
				run.run([self.sdk.get_adb(), '-e' , 'shell', 'am', 'start', '-a', 'android.intent.action.MAIN', '-c','android.intent.category.LAUNCHER', '-n', '%s/.%sActivity' % (self.app_id , self.classname)])
				print "[INFO] Deployed %s ... Application should be running." % self.name
			elif launch_failed==False:
				print "[INFO] Application installed. Launch from drawer on Home Screen"

		finally:
			os.chdir(curdir)
			sys.stdout.flush()
			

if __name__ == "__main__":
	
	if len(sys.argv)<6 or sys.argv[1] == '--help' or (sys.argv[1]=='distribute' and len(sys.argv)<10):
		print "%s <command> <project_name> <sdk_dir> <project_dir> <app_id> [key] [password] [alias] [dir] [avdid] [avdsdk]" % os.path.basename(sys.argv[0])
		print
		print "available commands: "
		print
		print "  emulator      build and run the emulator"
		print "  simulator     build and run the app on the simulator"
		print "  install       build and install the app on the device"
		print "  distribute	   build final distribution package for upload to marketplace"
		
		sys.exit(1)

	template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
	project_name = dequote(sys.argv[2])
	sdk_dir = os.path.abspath(os.path.expanduser(dequote(sys.argv[3])))
	project_dir = os.path.abspath(os.path.expanduser(dequote(sys.argv[4])))
	app_id = dequote(sys.argv[5])
	
	s = Builder(project_name,sdk_dir,project_dir,template_dir,app_id)
	
	if sys.argv[1] == 'emulator':
		avd_id = dequote(sys.argv[6])
		avd_skin = dequote(sys.argv[7])
		s.run_emulator(avd_id,avd_skin)
	elif sys.argv[1] == 'simulator':
		print "[INFO] Building %s for Android ... one moment" % project_name
		avd_id = dequote(sys.argv[6])
		s.build_and_run(False,avd_id)
	elif sys.argv[1] == 'install':
		avd_id = dequote(sys.argv[6])
		s.build_and_run(True,avd_id)
	elif sys.argv[1] == 'distribute':
		key = os.path.abspath(os.path.expanduser(dequote(sys.argv[6])))
		password = dequote(sys.argv[7])
		alias = dequote(sys.argv[8])
		output_dir = dequote(sys.argv[9])
		avd_id = dequote(sys.argv[10])
		s.build_and_run(True,avd_id,key,password,alias,output_dir)
	else:
		print "[ERROR] Unknown command"
		sys.exit(1)

	sys.exit(0)
	
