#!/usr/bin/env python
#
# Appcelerator Titanium Mobile
# Copyright (c) 2009 Appcelerator, Inc. All Right Reserved.
#
# Android Simulator for building a project and launching
# the Android Emulator or on the device
#
import os, sys, subprocess, shutil, time, signal, string, platform, re

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
sys.path.append(os.path.join(template_dir,'..'))
from tiapp import *

def dequote(s):
    if s[0:1] == '"':
	return s[1:-1]
    return s

def run(args):
	return subprocess.Popen(args, stderr=subprocess.PIPE, stdout=subprocess.PIPE).communicate()[0]

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
		print "Waiting for device..."
		os.system("\"%s\" -%s wait-for-device" % (self.adb,type))
		print "Device connected..."
	
	def run_emulator(self):
		#FIXME: this stuff aint gonna work for our
		#dear friends windoooz
		
		print "Launching Android emulator...one moment"

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
			print "signal caught: %d" % signum
			if not p == None:
				print "calling emulator kill on %d" % p.pid
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
		#TODO: win32
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
			os.chdir(self.project_dir)
			
			if os.path.exists('bin'):
				shutil.rmtree('bin')

			resources_dir = os.path.join(self.top_dir,'Resources')
			assets_dir = os.path.join('bin','assets')
			asset_resource_dir = os.path.join(assets_dir,'Resources')

			# transform resources
			def strip_slash(s):
				if s[0:1]=='/' or s[0:1]=='\\': return s[1:]
				return s
			def recursive_cp(dir,dest):
				for root, dirs, files in os.walk(dir):
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
			
			finalxml = os.path.join(assets_dir,'tiapp.xml')
			tiapp = TiAppXML(finalxml)
			iconname = tiapp.properties['icon']
			iconpath = os.path.join(asset_resource_dir,iconname)
			iconext = os.path.splitext(iconpath)[1]
			existingicon = os.path.join('res','drawable','appicon%s' % iconext)	
			if os.path.exists(existingicon):	
				os.remove(existingicon)
			if os.path.exists(iconpath):
				shutil.copy(iconpath,existingicon)
			

			src_dir = os.path.join(self.project_dir, 'src')
			android_manifest = os.path.join(self.project_dir, 'AndroidManifest.xml')
			res_dir = os.path.join(self.project_dir, 'res')
			run([aapt, 'package', '-m', '-J', src_dir, '-M', android_manifest, '-S', res_dir, '-I', jar])
			#cmd = "\"%s\" package -m -J src -M AndroidManifest.xml -S res -I \"%s\"" %(aapt,jar)
			#print cmd
			#os.system(cmd)
			
			srclist = []
			
			
			for root, dirs, files in os.walk(os.path.join(self.project_dir,'src')):
				if len(files) > 0:
					#prefix = root[len(self.project_dir)+1:]
					for f in files:
						path = root + os.sep + f
						srclist.append(path)
		
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
						print "Error locating JDK: set $JAVA_HOME or put javac and jarsigner on your $PATH"
						sys.exit(1)
						
			javac_command = [javac, '-classpath', jar + os.pathsep + tijar, '-d', classes_dir, '-sourcepath', src_dir]
			javac_command += srclist
			run(javac_command)
			#cmd = "javac -classpath \"%s\"" % jar + os.pathsep + "\"%s\"" % tijar + " -d bin/classes -sourcepath src %s" % " ".join(srclist)
			#print cmd
			#os.system(cmd)
			
		
			classes_dex = os.path.join(self.project_dir, 'bin', 'classes.dex')	
			run([dx, '--dex', '--output='+classes_dex, classes_dir, tijar])
			#cmd = "\"%s\" --dex --output=bin/classes.dex bin/classes \"%s\"" %(dx,tijar)
			#print cmd
			#os.system(cmd)
									
			ap_ = os.path.join(self.project_dir, 'bin', 'app.ap_')	
			run([aapt, 'package', '-f', '-M', 'AndroidManifest.xml', '-A', assets_dir, '-S', 'res', '-I', jar, '-I', tijar, '-F', ap_])
			#cmd = "\"%s\" package -f -M AndroidManifest.xml -A \"%s\" -S res -I \"%s\" -I \"%s\" -F bin/app.ap_" %(aapt,assets_dir,jar,tijar)
			#print cmd
			#os.system(cmd)
		
			unsigned_apk = os.path.join(self.project_dir, 'bin', 'app-unsigned.apk')	
			run([apkbuilder, unsigned_apk, '-u', '-z', ap_, '-f', classes_dex, '-rf', src_dir, '-rj', tijar])
			#cmd = "\"%s\" bin/app-unsigned.apk -u -z bin/app.ap_ -f bin/classes.dex -rf src -rj \"%s\"" %(apkbuilder,tijar)
			#print cmd
			#os.system(cmd)
	
			if dist_dir:
				app_apk = os.path.join(dist_dir, project_name + '.apk')	
			else:
				app_apk = os.path.join(self.project_dir, 'bin', 'app.apk')	

			output = run([jarsigner, '-storepass', keystore_pass, '-keystore', keystore, '-signedjar', app_apk, unsigned_apk, keystore_alias])
			success = re.findall(r'RuntimeException: (.*)',output)
			if len(success) > 0:
				print success[0]
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
						cmd += ['-d', 'install', '-r', app_apk]
						#cmd = "\"%s\" -d install -r bin/app.apk" % self.adb
					else:
						self.wait_for_device('e')
						cmd += ['-e', 'install', '-r', app_apk]
						#cmd = "\"%s\" -e install -r bin/app.apk" % self.adb
					run(cmd)
					#print cmd
					#os.system(cmd)
					#launched = True
					break
				except:
					time.sleep(3)
					attempts+=1

			if launched:
				print "Launching application ... %s" % self.name
				time.sleep(3)
				run([self.adb, 'shell', 'am', 'start', '-a', 'android.intent.action.MAIN', '-n', '%s/%s.%s' % (self.app_id, self.app_id , self.classname)])
				#os.system("adb shell am start -a android.intent.action.MAIN -n %s/%s.%s" % (self.app_id, self.app_id , self.classname))
				print "Deployed %s ... " % self.name

		finally:
			os.chdir(curdir)
			

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
		print "Building %s for Android ... one moment" % project_name
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
		print "Unknown command"
		sys.exit(1)		

	sys.exit(0)
	
