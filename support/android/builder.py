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
from deltafy import Deltafy, Delta

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
		self.set_java_commands()
	
	def set_java_commands(self):
		self.jarsigner = "jarsigner"
		self.javac = "javac"
		self.java = "java"
		if platform.system() == "Windows":
			if os.environ.has_key("JAVA_HOME"):
				home_jarsigner = os.path.join(os.environ["JAVA_HOME"], "bin", "jarsigner.exe")
				home_javac = os.path.join(os.environ["JAVA_HOME"], "bin", "javac.exe")
				home_java = os.path.join(os.environ["JAVA_HOME"], "bin", "java.exe")
				if os.path.exists(home_jarsigner):
					self.jarsigner = home_jarsigner
				if os.path.exists(home_javac):
					self.javac = home_javac
				if os.path.exists(home_java):
					self.java = home_java
			else:
				found = False
				for path in os.environ['PATH'].split(os.pathsep):
					if os.path.exists(os.path.join(path, 'jarsigner.exe')) and os.path.exists(os.path.join(path, 'javac.exe')):
						self.jarsigner = os.path.join(path, 'jarsigner.exe')
						self.javac = os.path.join(path, 'javac.exe')
						self.java = os.path.join(path, 'java.exe')
						found = True
						break
				if not found:
					print "[ERROR] Error locating JDK: set $JAVA_HOME or put javac and jarsigner on your $PATH"
					sys.exit(1)

	def wait_for_device(self,type):
		print "[DEBUG] Waiting for device to be ready ..."
		sys.stdout.flush()
		t = time.time()
		while True:
			output = run.run([self.sdk.get_adb(),"-%s" % type, 'devices'],True)
			print "[TRACE] wait_for_device returned: %s" % output
			if output != None: 
				if output.find("emulator-") != -1 and output.find("offline") == -1:
					break
			time.sleep(1)
		print "[DEBUG] Device connected..."
		sys.stdout.flush()
		duration = time.time() - t
		print "[DEBUG] waited %f seconds on emulator to get ready" % duration
		if duration > 1.0:
			print "[INFO] Waiting for the Android Emulator to become available"
			time.sleep(15) # give it a little more time to get installed
	
	def create_avd(self,avd_id,avd_skin):
		name = "titanium_%s_%s" % (avd_id,avd_skin)
		if not os.path.exists(self.home_dir):
			os.makedirs(self.home_dir)
		sdcard = os.path.abspath(os.path.join(self.home_dir,'android.sdcard'))
		if not os.path.exists(sdcard):
			print "[INFO] Created shared 64M SD card for use in Android emulator(s)"
			run.run([self.sdk.get_mksdcard(), '64M', sdcard])

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
		emulator_cmd = [
			self.sdk.get_emulator(),
			'-avd',
			avd_name,
			'-port',
			'5560',
			'-sdcard',
			self.sdcard,
			'-logcat',
			"'*:d *'",
			'-no-boot-anim'
		]
		print '[DEBUG] ' + (' '.join(emulator_cmd))
		sys.stdout.flush()
		
		p = subprocess.Popen(emulator_cmd)
		
		def handler(signum, frame):
			print "[DEBUG] signal caught: %d" % signum
			if not p == None:
				print "[DEBUG] calling emulator kill on %d" % p.pid
				#os.system("kill -9 %d" % p.pid)
				p.kill()

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
	
	def is_app_installed(self):
		output = run.run([self.sdk.get_adb(), 'shell', 'ls', '/data/app/%s.apk' % self.app_id])
		if output != None:
			if output.find("No such file or directory") == -1:
				return True
		return False
	
	def include_path(self, path, isfile):
		if not isfile and os.path.basename(path) in ignoreDirs: return False
		elif isfile and os.path.basename(path) in ignoreFiles: return False
		return True
	
	def copy_project_resources(self):
		print "[INFO] Copying project resources.."
		sys.stdout.flush()
		
		resources_dir = os.path.join(self.top_dir, 'Resources')
		android_resources_dir = os.path.join(resources_dir, 'android')
		self.project_deltafy = Deltafy(resources_dir, include_callback=self.include_path)
		self.project_deltas = self.project_deltafy.scan()
		
		def strip_slash(s):
			if s[0:1]=='/' or s[0:1]=='\\': return s[1:]
			return s
		
		for delta in self.project_deltas:
			if delta.get_status() != Delta.DELETED:
				path = delta.get_path()
				if path.startswith(android_resources_dir):
					dest = os.path.join(self.assets_resources_dir, strip_slash(path[len(android_resources_dir):]))
				else:
					dest = os.path.join(self.assets_resources_dir, strip_slash(path[len(resources_dir):]))
				parent = os.path.dirname(dest)
				if not os.path.exists(parent):
					os.makedirs(parent)
				print "[TRACE] COPYING %s FILE: %s => %s" % (delta.get_status_str(), path, dest)
				sys.stdout.flush()
				shutil.copy(path, dest)
				# copy to the sdcard in development mode
				if self.app_installed and self.deploy_type == 'development':
					relative_path = delta.get_path()[len(resources_dir)+1:]
					relative_path = relative_path.replace("\\", "/")
					cmd = [self.sdk.get_adb(), "push", delta.get_path(), "/sdcard/Ti.debug/%s/Resources/%s" % (self.app_id, relative_path)]
					run.run(cmd)

	def generate_android_manifest(self):
		# compile resources
		full_resource_dir = os.path.join(self.project_dir,self.assets_resources_dir)
		compiler = Compiler(self.app_id,full_resource_dir,False)
		if len(self.project_deltas) > 0:
			print "[INFO] Compiling javascript..."
			compiler.compile(self.project_deltas)
		
		# NOTE: these are built-in permissions we need -- we probably need to refine when these are needed too
		permissions_required = ['INTERNET','ACCESS_WIFI_STATE','ACCESS_NETWORK_STATE', 'WRITE_EXTERNAL_STORAGE']
		
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
					if google_apis[mn] and not self.google_apis_supported:
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
		
		self.use_maps = False
		iconname = self.tiapp.properties['icon']
		iconpath = os.path.join(self.assets_resources_dir,iconname)
		iconext = os.path.splitext(iconpath)[1]
		if not os.path.exists(os.path.join('res','drawable')):
			os.makedirs(os.path.join('res','drawable'))
			
		existingicon = os.path.join('res','drawable','appicon%s' % iconext)	
		if os.path.exists(existingicon):	
			os.remove(existingicon)
		if os.path.exists(iconpath):
			shutil.copy(iconpath,existingicon)
		else:
			shutil.copy(os.path.join(self.support_resources_dir, 'default.png'), existingicon)

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
		splashimage = os.path.join(self.assets_resources_dir,'default.png')
		background_png = os.path.join('res','drawable','background.png')
		if os.path.exists(splashimage):
			print "[DEBUG] found splash screen at %s" % os.path.abspath(splashimage)
			shutil.copy(splashimage, background_png)
		else:
			shutil.copy(os.path.join(self.support_resources_dir, 'default.png'), background_png)
		

		self.src_dir = os.path.join(self.project_dir, 'src')
		android_manifest = os.path.join(self.project_dir, 'AndroidManifest.xml')
		
		android_manifest_to_read = android_manifest

		# NOTE: allow the user to use their own custom AndroidManifest if they put a file named
		# AndroidManifest.custom.xml in their android project directory in which case all bets are
		# off
		android_custom_manifest = os.path.join(self.project_dir, 'AndroidManifest.custom.xml')
		if os.path.exists(android_custom_manifest):
			android_manifest_to_read = android_custom_manifest
			print "[INFO] Detected custom ApplicationManifest.xml -- no Titanium version migration supported"
		
		manifest_contents = open(android_manifest_to_read,'r').read()
		ti_activities = '<!-- TI_ACTIVITIES -->'
		ti_permissions = '<!-- TI_PERMISSIONS -->'
		manifest_changed = False
		
		match = re.search('<uses-sdk android:minSdkVersion="(\d)" />', manifest_contents)
		
		# TODO pull this from the command line
		android_sdk_version = '4'
		manifest_sdk_version = None
		if match != None:
			manifest_sdk_version = match.group(1)
		
		if manifest_contents.find(ti_activities) != -1 or manifest_contents.find(ti_permissions) != -1 \
			or android_sdk_version != manifest_sdk_version \
			or Deltafy.compare_paths(android_manifest_to_read, android_manifest) > 0:
				print "[TRACE] Generating AndroidManifest.xml"
				# we need to write out the new manifest
				manifest_contents = manifest_contents.replace(ti_activities,"\n\n\t\t".join(activities))
				manifest_contents = manifest_contents.replace(ti_permissions,permissions_required_xml)
				manifest_contents = manifest_contents.replace('<uses-sdk android:minSdkVersion="4" />', '<uses-sdk android:minSdkVersion="%s" />' % android_sdk_version)
				amf = open(android_manifest,'w')
				amf.write(manifest_contents)
				amf.close()
				manifest_changed = True
		
		if manifest_changed:
			res_dir = os.path.join(self.project_dir, 'res')
			output = run.run([self.aapt, 'package', '-m', '-J', self.src_dir, '-M', android_manifest, '-S', res_dir, '-I', self.android_jar])
			if output == None:
				print "[ERROR] Error generating R.java from manifest"
				sys.exit(1)
		return manifest_changed

	def build_generated_classes(self):
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
			
	
		# see if the user has app data and if so, compile in the user data
		# such that it can be accessed automatically using Titanium.App.Properties.getString
		# TODO - re-enable user data
		# app_data_cfg = os.path.join(self.top_dir,"appdata.cfg")
		# if os.path.exists(app_data_cfg):
		# 	props = read_properties(open(app_data_cfg,"r"))
		# 	module_data = ''
		# 	for key in props.keys():
		# 		data = props[key]
		# 		module_data+="properties.setString(\"%s\",\"%s\");\n   " % (key,data)
		# 		print("[DEBUG] detected user application data at = %s"% app_data_cfg)
		# 		sys.stdout.flush()
		# 		dtf = os.path.join(src_dir,"AppUserData.java")
		# 		if os.path.exists(dtf):
		# 			os.remove(dtf)
		# 		ctf = open(dtf,"w")
		# 		cf_template = open(os.path.join(template_dir,'templates','AppUserData.java'),'r').read()
		# 		cf_template = cf_template.replace('__MODULE_BODY__',module_data)
		# 		ctf.write(cf_template)
		# 		ctf.close()
		# 		srclist.append(dtf)

		classpath = self.android_jar + os.pathsep + self.titanium_jar + os.pathsep.join(jarlist)
		# TODO re-enable me
		if self.use_maps: classpath += os.pathsep + self.titanium_map_jar
		
		javac_command = [self.javac, '-classpath', classpath, '-d', self.classes_dir, '-sourcepath', self.src_dir]
		javac_command += srclist
		print "[DEBUG] %s" % javac_command
		sys.stdout.flush()
		out = run.run(javac_command)
	
	def package_and_deploy(self):
		ap_ = os.path.join(self.project_dir, 'bin', 'app.ap_')
		rhino_jar = os.path.join(self.support_dir, 'js.jar')
		run.run([self.aapt, 'package', '-f', '-M', 'AndroidManifest.xml', '-A', self.assets_dir, '-S', 'res', '-I', self.android_jar, '-I', self.titanium_jar, '-F', ap_])
	
		unsigned_apk = os.path.join(self.project_dir, 'bin', 'app-unsigned.apk')
		apk_build_cmd = [self.apkbuilder, unsigned_apk, '-u', '-z', ap_, '-f', self.classes_dex, '-rf', self.src_dir]
		for jar in self.android_jars + self.android_module_jars:
			apk_build_cmd += ['-rj', jar]
		
		run.run(apk_build_cmd)

		if self.dist_dir:
			app_apk = os.path.join(self.dist_dir, self.name + '.apk')	
		else:
			app_apk = os.path.join(self.project_dir, 'bin', 'app.apk')	

		output = run.run([self.jarsigner, '-storepass', self.keystore_pass, '-keystore', self.keystore, '-signedjar', app_apk, unsigned_apk, self.keystore_alias])
		success = re.findall(r'RuntimeException: (.*)', output)
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

		if self.dist_dir:
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
				if self.install:
					self.wait_for_device('d')
					print "[INFO] Installing application on emulator"
					cmd += ['-d', 'install', '-r', app_apk]
				else:
					self.wait_for_device('e')
					print "[INFO] Installing application on device"
					cmd += ['-e', 'install', '-r', app_apk]
				output = run.run(cmd)
				print "[TRACE] output: %s" % output
				if output == None:
					launch_failed = True
				elif not self.install:
					launched = True
				break
			except Exception, e:
				print '[ERROR] %s' % e
				time.sleep(3)
				attempts+=1
		
		if not self.app_installed and self.deploy_type == 'development':
			cmd = [self.sdk.get_adb(), "push", os.path.join(self.top_dir, 'Resources'), "/sdcard/Ti.debug/%s/Resources" % self.app_id]
			output = run.run(cmd)
			print "[TRACE] sdcard output: %s" % output
			
		return (launched, launch_failed)
	
	def run_app(self):
		print "[INFO] Launching application ... %s" % self.name
		sys.stdout.flush()
		output = run.run([
			self.sdk.get_adb(), '-e' , 'shell', 'am', 'start',
			'-a', 'android.intent.action.MAIN',
			'-c','android.intent.category.LAUNCHER',
			'-n', '%s/.%sActivity' % (self.app_id , self.classname)])
		
		print "[TRACE] Launch output: %s" % output
		
	def build_and_run(self, install, avd_id, keystore=None, keystore_pass='tirocks', keystore_alias='tidev', dist_dir=None):
		self.wait_for_device('e')
		deploy_type = 'development'
		if install:
			if keystore == None:
				deploy_type = 'test'
			else:
				deploy_type = 'production'
		
		self.install = install
		self.deploy_type = deploy_type
		self.dist_dir = dist_dir
		self.aapt = self.sdk.get_aapt()
		self.android_jar = self.sdk.get_android_jar()
		self.titanium_jar = os.path.join(self.support_dir,'titanium.jar')
		dx = self.sdk.get_dx()
		self.apkbuilder = self.sdk.get_apkbuilder()
		self.app_installed = self.is_app_installed()
		print "[DEBUG] %s installed? %s" % (self.app_id, self.app_installed)
		
		if keystore == None:
			keystore = os.path.join(self.support_dir,'dev_keystore')
		
		self.keystore = keystore
		self.keystore_pass = keystore_pass
		self.keystore_alias = keystore_alias
		curdir = os.getcwd()
		self.android_jars = glob.glob(os.path.join(self.support_dir, '*.jar'))
		self.titanium_map_jar = os.path.join(self.support_dir, 'modules', 'titanium-map.jar')
		self.support_resources_dir = os.path.join(self.support_dir, 'resources')
		
		try:
			os.chdir(self.project_dir)
			
			if not os.path.exists('bin'):
				os.makedirs('bin')
			
			if os.path.exists('lib'):
				for jar in self.android_jars:
					shutil.copy(jar, 'lib')

			resources_dir = os.path.join(self.top_dir,'Resources')
			self.assets_dir = os.path.join(self.project_dir,'bin','assets')
			self.assets_resources_dir = os.path.join(self.assets_dir,'Resources')
			
			if not os.path.exists(self.assets_dir):
				os.makedirs(self.assets_dir)
			
			project_tiappxml = os.path.join(self.top_dir,'tiapp.xml')
			shutil.copy(project_tiappxml, self.assets_dir)
			finalxml = os.path.join(self.assets_dir,'tiapp.xml')
			self.tiapp = TiAppXML(finalxml)
			self.tiapp.setDeployType(deploy_type)
			
			self.copy_project_resources()
			sys.stdout.flush()
			
			tiapp_delta = self.project_deltafy.scan_single_file(project_tiappxml)
			tiapp_changed = tiapp_delta is not None
			if tiapp_changed:
				print "[TRACE] Generating Java Classes"
				android = Android(self.name,self.app_id,self.sdk,deploy_type)
				android.create(os.path.abspath(os.path.join(self.top_dir,'..')),True)
			else:
				print "[INFO] Tiapp.xml unchanged, skipping class generation"
			sys.stdout.flush()

			if not os.path.exists(self.assets_dir):
				os.makedirs(self.assets_dir)
				
			my_avd = None	
			self.google_apis_supported = False
				
			# find the AVD we've selected and determine if we support Google APIs
			for avd_props in avd.get_avds(self.sdk):
				if avd_props['id'] == avd_id:
					my_avd = avd_props
					self.google_apis_supported = (my_avd['name'].find('Google')!=-1)
					break

			manifest_changed = self.generate_android_manifest()
			
			self.classes_dir = os.path.join(self.project_dir, 'bin', 'classes')	
			if not os.path.exists(self.classes_dir):
				os.makedirs(self.classes_dir)
			
			generated_classes_built = False
			if manifest_changed or tiapp_changed:
				self.build_generated_classes()
				generated_classes_built = True
			else:
				print "[INFO] Manifest unchanged, skipping Java build"
			
			self.classes_dex = os.path.join(self.project_dir, 'bin', 'classes.dex')
			self.android_module_jars = glob.glob(os.path.join(self.support_dir, 'modules', '*.jar'))
			
			def jar_includer(path, isfile):
				if isfile and path.endswith(".jar"): return True
				return False
			support_deltafy = Deltafy(self.support_dir, jar_includer)
			support_deltas = support_deltafy.scan()
			
			dex_built = False
			if len(support_deltas) > 0 or generated_classes_built:
				# the dx.bat that ships with android in windows doesn't allow command line
				# overriding of the java heap space, so we call the jar directly
				if platform.system() == 'Windows':
					dex_args = [self.java, '-Xmx512M', '-Djava.ext.dirs=%s' % self.sdk.get_platform_tools_dir(), '-jar', self.sdk.get_dx_jar()]
				else:
					dex_args = [dx, '-JXmx512M']
				dex_args += ['--dex', '--output='+self.classes_dex, self.classes_dir]
				dex_args += self.android_jars
				dex_args += self.android_module_jars
		
				run.run(dex_args)
				dex_built = True
			
			
			if dex_built or generated_classes_built or tiapp_changed or manifest_changed or not self.app_installed:
				# metadata has changed, we need to do a full re-deploy
				launched, launch_failed = self.package_and_deploy()
				if launched:
					self.run_app()
					print "[INFO] Deployed %s ... Application should be running." % self.name
				elif launch_failed==False:
					print "[INFO] Application installed. Launch from drawer on Home Screen"
			else:
				# we copied all the files to the sdcard, no need to package
				# just kill from adb which forces a restart
				print "[INFO] Re-launching application ... %s" % self.name
				sys.stdout.flush()
				
				relaunched = False
				processes = run.run([self.sdk.get_adb(), '-e', 'shell', 'ps'])
				for line in processes.splitlines():
					columns = line.split()
					if len(columns) > 1:
						pid = columns[1]
						id = columns[len(columns)-1]
						
						if id == self.app_id:
							run.run([self.sdk.get_adb(), '-e', 'shell', 'kill', pid])
							relaunched = True
				
				if relaunched:			
					print "[INFO] Relaunched %s ... Application should be running." % self.name
				else:
					self.run_app()

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
	
