#!/usr/bin/python
#
# An autodetection utility for the Android SDK
#

import os, sys, platform, glob, subprocess, types, re

android_api_levels = {
	3: 'android-1.5',
	4: 'android-1.6',
	5: 'android-2.0',
	6: 'android-2.0.1',
	7: 'android-2.1'
}

class Device:
	def __init__(self, name, port=-1, emulator=False, offline=False):
		self.name = name
		self.port = port
		self.emulator = emulator
		self.offline = offline

	def get_name(self):
		return self.name

	def get_port(self):
		return self.port

	def is_emulator(self):
		return self.emulator

	def is_device(self):
		return not self.emulator

	def is_offline(self):
		return self.offline

class AndroidSDK:
	def __init__(self, android_sdk, api_level):
		self.android_sdk = self.find_sdk(android_sdk)
		if self.android_sdk is None:
			raise Exception('No Android SDK directory found')
		self.api_level = api_level
		self.find_platform_dir()
		self.find_google_apis_dir()

	def find_sdk(self, supplied):
		if platform.system() == 'Windows':
			default_dirs = ['C:\\android-sdk', 'C:\\android', 'C:\\Program Files\\android-sdk', 'C:\\Program Files\\android']
		else:
			default_dirs = ['/opt/android', '/opt/android-sdk', '/usr/android', '/usr/android-sdk']

		if 'ANDROID_SDK' in os.environ:
			return os.environ['ANDROID_SDK']

		if supplied is not None:
			return supplied

		for default_dir in default_dirs:
			if os.path.exists(default_dir):
				return default_dir

		path = os.environ['PATH']
		for dir in os.path.split(os.pathsep):
			if os.path.exists(os.path.join(dir, 'android')) \
				or os.path.exists(os.path.join(dir, 'android.exe')):
					return dir
		return None

	def find_dir(self, version, prefix):
		dirs = glob.glob(os.path.join(self.android_sdk, prefix+str(version)+"*"))
		if len(dirs) > 0:
			#grab the first.. good enough?
			return dirs[0]
		return None

	def find_platform_dir(self):
		platform_dir = self.find_dir(self.api_level, os.path.join('platforms', 'android-'))
		if platform_dir is None:
			old_style_dir = os.path.join(self.android_sdk, 'platforms', android_api_levels[self.api_level])
			if os.path.exists(old_style_dir):
				platform_dir = old_style_dir
		if platform_dir is None:
			raise Exception("No \"%s\" or \"%s\" in the Android SDK" % ('android-%s' % self.api_level, android_api_levels[self.api_level]))
		self.platform_dir = platform_dir

	def find_google_apis_dir(self):
		self.google_apis_dir = self.find_dir(self.api_level, os.path.join('add-ons', 'google_apis-'))
		if self.google_apis_dir is None:
			self.google_apis_dir = self.find_dir(self.api_level, os.path.join('add-ons', 'addon_google_apis_google_inc_'))

	def get_maps_jar(self):
		if self.google_apis_dir is not None:
			return os.path.join(self.google_apis_dir, "libs", "maps.jar")
		return None

	def get_android_jar(self):
		if self.platform_dir is not None:
			return os.path.join(self.platform_dir, "android.jar")
		return None

	def get_android_sdk(self):
		return self.android_sdk

	def get_platform_dir(self):
		return self.platform_dir

	def get_google_apis_dir(self):
		return self.google_apis_dir

	def get_platform_tools_dir(self):
		if self.platform_dir is not None:
			platform_tools = os.path.join(self.platform_dir, 'tools')
			if os.path.exists(platform_tools):
				return platform_tools
		return None

	def get_sdk_platform_tools_dir(self):
		if self.android_sdk is not None:
			sdk_platform_tools = os.path.join(self.android_sdk, 'platform-tools')
			if os.path.exists(sdk_platform_tools):
				return sdk_platform_tools
		return None

	def get_api_level(self):
		return self.api_level

	def get_tool(self, topdir, tool):
		if topdir is not None:
			tool_path = os.path.join(topdir, tool)
			if platform.system() == "Windows":
				if os.path.exists(tool_path+".exe"): return tool_path+".exe"
				elif os.path.exists(tool_path+".bat"): return tool_path+".bat"
				else: return None
			if os.path.exists(tool_path):
				return tool_path
		return None

	def get_sdk_tool(self, tool):
		return self.get_tool(os.path.join(self.android_sdk, 'tools'), tool)

	def get_platform_tool(self, tool):
		platform_tools_dir = self.get_platform_tools_dir()
		sdk_platform_tools_dir = self.get_sdk_platform_tools_dir()
		tool_path = None
		if platform_tools_dir is not None:
			tool_path = self.get_tool(platform_tools_dir, tool)
		if tool_path is None and sdk_platform_tools_dir is not None:
			tool_path = self.get_tool(sdk_platform_tools_dir, tool)
		if tool_path is None or not os.path.exists(tool_path):
			return self.get_sdk_tool(tool)
		return tool_path

	def get_dx(self):
		return self.get_platform_tool('dx')

	def get_dx_jar(self):
		platform_tools_dir = self.get_platform_tools_dir()
		sdk_platform_tools_dir = self.get_sdk_platform_tools_dir()
		if platform_tools_dir is not None:
			return os.path.join(platform_tools_dir, 'lib', 'dx.jar')
		elif sdk_platform_tools_dir is not None:
			return os.path.join(sdk_platform_tools_dir, 'lib', 'dx.jar')
		return None

	def get_dexdump(self):
		return self.get_platform_tool('dexdump')

	def get_zipalign(self):
		return self.get_sdk_tool('zipalign')

	def get_aapt(self):
		return self.get_platform_tool('aapt')

	def get_apkbuilder(self):
		return self.get_sdk_tool('apkbuilder')

	def get_android(self):
		return self.get_sdk_tool('android')

	def get_emulator(self):
		return self.get_sdk_tool('emulator')

	def get_adb(self):
		return self.get_platform_tool('adb')

	def get_mksdcard(self):
		return self.get_sdk_tool('mksdcard')

	def get_aidl(self):
		return self.get_platform_tool('aidl')

	def sdk_path(self, *path):
		return os.path.join(self.android_sdk, *path)

	def platform_path(self, *path):
		return os.path.join(self.platform_dir, *path)

	def google_apis_path(self, *path):
		return os.path.join(self.google_apis_dir, *path)

	def list_devices(self):
		adb = self.get_adb()
		(out, err) = subprocess.Popen([adb, 'devices'], stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
		if type(err) != types.NoneType and len(err) > 0:
			raise Exception(err)
		devices = []
		for line in out.splitlines():
			line = line.strip()
			if line.startswith("List of devices"): continue
			elif line.startswith("emulator-"):
				(name, status) = line.split()
				port = int(name[name.index("-")+1:])
				offline = False
				if status == "offline":
					offline = True
				devices.append(Device(name, port, True, offline))
			elif "device" in line:
				name = line.split()[0]
				devices.append(Device(name))
		return devices

	def list_processes(self, adb_args=None):
		args = [self.get_adb()]
		if adb_args != None:
			args.extend(adb_args)
		args.extend(['shell', 'ps'])
		(out, err) = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
		if type(err) != types.NoneType and len(err) > 0:
			raise Exception(err)
		processes = []
		for line in out.splitlines():
			line = line.strip()
			tokens = re.split(r"\s+", line)
			if len(tokens) < 2: continue
			if tokens[0] == 'USER': continue
			process = {"pid": tokens[1], "name": tokens[len(tokens)-1]}
			processes.append(process)
		return processes

if __name__ == "__main__":
	if len(sys.argv) < 2:
		print "Usage: %s ANDROID_SDK [API]" % sys.argv[0]
		print "  ANDROID_SDK is the default path to the Android SDK. Use '-' if there is no default path"
		print "  API (optional) is an Android API version (i.e. 4, 5, 6, 7, 8). The default is 4."
		print ""
		print "Prints the SDK directory, Android Platform directory, and Google APIs directory"
		sys.exit(1)

	sdk_path = sys.argv[1]
	if sdk_path == '-':
		sdk_path = None

	api_level = 4
	if len(sys.argv) > 2:
		api_level = int(sys.argv[2])
	try:
		sdk = AndroidSDK(sdk_path, api_level)
		print "ANDROID_SDK=%s" % sdk.get_android_sdk()
		print "ANDROID_API_LEVEL=%d" % sdk.get_api_level()
		print "ANDROID_PLATFORM=%s" % sdk.get_platform_dir()
		print "GOOGLE_APIS=%s" % sdk.get_google_apis_dir()
	except Exception, e:
		print >>sys.stderr, e