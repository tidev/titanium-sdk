#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Android Simulator for building a project and launching
# the Android Emulator or on the device
#
import os, sys, subprocess, shutil, time, signal, string, platform, re, run
from os.path import splitext

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sys.path.append(os.path.join(template_dir,'..'))
from tiapp import *
from mako.template import Template
from android import Android

def dequote(s):
    if s[0:1] == '"':
	return s[1:-1]
    return s

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
		self.sdk = sdk
		self.name = name
		self.app_id = app_id
		self.support_dir = support_dir
		self.platform_dir = os.path.join(sdk,'platforms','android-1.5')
		self.tools_dir = os.path.join(self.platform_dir,'tools')
		self.emulator = os.path.join(self.sdk,'tools','emulator')
		if platform.system() == "Windows":
			self.emulator += ".exe"
		self.adb = os.path.join(self.sdk,'tools','adb')
		if platform.system() == "Windows":
			self.adb += ".exe"
		# we place some files in the users home
		self.home_dir = os.path.join(os.path.expanduser('~'), '.titanium')
		if not os.path.exists(self.home_dir):
			os.makedirs(self.home_dir)
		self.sdcard = os.path.join(self.home_dir,'android.sdcard')
		self.classname = "".join(string.capwords(self.name).split(' '))
		

	def wait_for_device(self,type):
		print "[DEBUG] Waiting for device..."
		print "\"%s\" -%s wait-for-device" % (self.adb,type)
		os.system("\"%s\" -%s wait-for-device" % (self.adb,type))
		print "[DEBUG] Device connected..."
	
	def run_emulator(self):
		
		print "[INFO] Launching Android emulator...one moment"
		print "[DEBUG] From: " + self.emulator
		print "[DEBUG] SDCard: " + self.sdcard
		
		sys.stdout.flush()

		# start the emulator
		p = subprocess.Popen([
			self.emulator,
			'-avd',
			'titanium',
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

		sys.exit(rc)
		
	def build_and_run(self, install, keystore=None, keystore_pass='tirocks', keystore_alias='tidev', dist_dir=None):
		deploy_type = 'development'
		if install:
			if keystore == None:
				deploy_type = 'test'
			else:
				deploy_type = 'production'
				
		aapt = os.path.join(self.tools_dir,'aapt')
		jar = os.path.join(self.platform_dir,'android.jar')
		dx = os.path.join(self.tools_dir,'dx')
		apkbuilder = os.path.join(self.sdk,'tools','apkbuilder')
		if platform.system() == "Windows":
			aapt += ".exe"
			dx += ".bat"
			apkbuilder += ".bat"
		
		if keystore==None:
			keystore = os.path.join(self.support_dir,'dev_keystore')
		
		curdir = os.getcwd()
		tijar = os.path.join(self.support_dir,'titanium.jar')
		
		try:
			#Files to ignore during build tree operations
			ignoreFiles = ['.gitignore', '.cvsignore'];
			ignoreDirs = ['.git','.svn','_svn', 'CVS'];
			
			os.chdir(self.project_dir)
			
			if os.path.exists('bin'):
				#shutil.rmtree('bin')
				for root, dirs, files in os.walk('bin', topdown=False):
					for name in ignoreFiles:
						if name in files:
							files.remove(name)
					#delete everything else
					for name in files:
						os.remove(os.path.join(root, name))
					for name in dirs:
						os.rmdir(os.path.join(root, name))
				
			if os.path.exists('lib'):
				shutil.copy(tijar,'lib')

			resources_dir = os.path.join(self.top_dir,'Resources')
			assets_dir = os.path.join('bin','assets')
			asset_resource_dir = os.path.join(assets_dir,'Resources')

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
						shutil.copy(fullpath,relativedest)

			if os.path.exists(asset_resource_dir):
				shutil.rmtree(asset_resource_dir)
			os.makedirs(asset_resource_dir)
			recursive_cp(resources_dir,asset_resource_dir)
			if os.path.exists(os.path.join(asset_resource_dir,'iphone')):
				shutil.rmtree(os.path.join(asset_resource_dir,'iphone'))
			if os.path.exists(os.path.join(asset_resource_dir,'android')):
				recursive_cp(os.path.join(resources_dir,'android'),asset_resource_dir)		
				shutil.rmtree(os.path.join(asset_resource_dir,'android'))

			if not os.path.exists(assets_dir):
				os.makedirs(assets_dir)

			shutil.copy(os.path.join(self.top_dir,'tiapp.xml'), assets_dir)
			
			tiapp = open(os.path.join(assets_dir, 'tiapp.xml')).read()
			
			finalxml = os.path.join(assets_dir,'tiapp.xml')
			tiapp = TiAppXML(finalxml)
			tiapp.setDeployType(deploy_type)
			
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
			
			# we re-run the create each time through in case any of our key files
			# have changed
			android = Android(self.name,self.app_id,self.sdk)
			android.create(os.path.abspath(os.path.join(self.top_dir,'..')),True)

			src_dir = os.path.join(self.project_dir, 'src')
			android_manifest = os.path.join(self.project_dir, 'AndroidManifest.xml')
			res_dir = os.path.join(self.project_dir, 'res')
			output = run.run([aapt, 'package', '-m', '-J', src_dir, '-M', android_manifest, '-S', res_dir, '-I', jar])
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
						if f == '.DS_Store' or f in ignoreFiles : continue
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
			if platform.system() == "Windows":
				if os.environ.has_key("JAVA_HOME"):
					home_jarsigner = os.path.join(os.environ["JAVA_HOME"], "bin", "jarsigner.exe")
					home_javac = os.path.join(os.environ["JAVA_HOME"], "bin", "javac.exe")
					if os.path.exists(home_jarsigner):
						jarsigner = home_jarsigner
					if os.path.exists(home_javac):
						javac = home_javac
				else:
					found = False
					for path in os.environ['PATH'].split(os.pathsep):
						if os.path.exists(os.path.join(path, 'jarsigner.exe')) and os.path.exists(os.path.join(path, 'javac.exe')):
							jarsigner = os.path.join(path, 'jarsigner.exe')
							javac = os.path.join(path, 'javac.exe')
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
						
			classpath = jar + os.pathsep + tijar + os.pathsep.join(jarlist)
			
			javac_command = [javac, '-classpath', classpath, '-d', classes_dir, '-sourcepath', src_dir]
			javac_command += srclist
			print "[DEBUG] %s" % javac_command
			sys.stdout.flush()
			out = run.run(javac_command)
			
		
			classes_dex = os.path.join(self.project_dir, 'bin', 'classes.dex')	
			if platform.system() == "Windows":
				run.run([dx, '--dex', '--output='+classes_dex, classes_dir, tijar])
			else:
				run.run([dx, '-JXmx512M', '--dex', '--output='+classes_dex, classes_dir, tijar])
										
			ap_ = os.path.join(self.project_dir, 'bin', 'app.ap_')	
			run.run([aapt, 'package', '-f', '-M', 'AndroidManifest.xml', '-A', assets_dir, '-S', 'res', '-I', jar, '-I', tijar, '-F', ap_])
		
			unsigned_apk = os.path.join(self.project_dir, 'bin', 'app-unsigned.apk')	
			run.run([apkbuilder, unsigned_apk, '-u', '-z', ap_, '-f', classes_dex, '-rf', src_dir, '-rj', tijar])
	
			if dist_dir:
				app_apk = os.path.join(dist_dir, project_name + '.apk')	
			else:
				app_apk = os.path.join(self.project_dir, 'bin', 'app.apk')	

			output = run.run([jarsigner, '-storepass', keystore_pass, '-keystore', keystore, '-signedjar', app_apk, unsigned_apk, keystore_alias])
			success = re.findall(r'RuntimeException: (.*)',output)
			if len(success) > 0:
				print "[ERROR] %s " %success[0]
				sys.exit(1)

			if dist_dir:
				sys.exit(0)			

			out = subprocess.Popen([self.adb,'get-state'], stderr=subprocess.PIPE, stdout=subprocess.PIPE).communicate()[0]
			out = str(out).strip()
			
			# try a few times as sometimes it fails waiting on boot
			attempts = 0
			launched = False
			while attempts < 5:
				try:
					cmd = [self.adb]
					if install:
						self.wait_for_device('d')
						print "[INFO] Installing application on emulator"
						cmd += ['-d', 'install', '-r', app_apk]
					else:
						self.wait_for_device('e')
						print "[INFO] Installing application on device"
						cmd += ['-e', 'install', '-r', app_apk]
					run.run(cmd)
					break
				except:
					time.sleep(3)
					attempts+=1

			if launched:
				print "[INFO] Launching application ... %s" % self.name
				sys.stdout.flush()
				time.sleep(3)
				run.run([self.adb, 'shell', 'am', 'start', '-a', 'android.intent.action.MAIN', '-n', '%s/%s.%s' % (self.app_id, self.app_id , self.classname)])
				print "[DEBUG] Deployed %s ... " % self.name
			else :
				print "[INFO] Application installed. Launch from drawer on Home Screen"

		finally:
			os.chdir(curdir)
			sys.stdout.flush()
			

if __name__ == "__main__":
	
	if len(sys.argv)<6 or sys.argv[1] == '--help' or (sys.argv[1]=='distribute' and len(sys.argv)!=10):
		print "%s <command> <project_name> <sdk_dir> <project_dir> <app_id> [key] [password] [alias] [dir]" % os.path.basename(sys.argv[0])
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
		s.run_emulator()
	elif sys.argv[1] == 'simulator':
		print "[INFO] Building %s for Android ... one moment" % project_name
		s.build_and_run(False)
	elif sys.argv[1] == 'install':
		s.build_and_run(True)
	elif sys.argv[1] == 'distribute':
		key = os.path.abspath(os.path.expanduser(dequote(sys.argv[6])))
		password = dequote(sys.argv[7])
		alias = dequote(sys.argv[8])
		output_dir = dequote(sys.argv[9])
		s.build_and_run(True,key,password,alias, output_dir)
	else:
		print "[ERROR] Unknown command"
		sys.exit(1)		

	sys.exit(0)
	
