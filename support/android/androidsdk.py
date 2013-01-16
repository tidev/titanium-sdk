#!/usr/bin/python
#
# An autodetection utility for the Android SDK
#

import os, sys, platform, glob, subprocess, types, re

DEFAULT_API_LEVEL = 8

android_api_levels = {
	3: 'android-1.5',
	4: 'android-1.6',
	5: 'android-2.0',
	6: 'android-2.0.1',
	7: 'android-2.1',
	8: 'android-2.2',
	9: 'android-2.3',
	10: 'android-2.3.3',
	11: 'android-3.0'
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
	def __init__(self, android_sdk, api_level=DEFAULT_API_LEVEL):
		self.android_sdk = self.find_sdk(android_sdk)
		if self.android_sdk is None:
			raise Exception('No Android SDK directory found')
		self.set_api_level(api_level)

	def set_api_level(self, level):
		self.api_level = level
		self.find_platform_dir()
		self.find_google_apis_dir()

	def try_best_match_api_level(self, level):
		# Don't go backwards
		if level <= self.api_level:
			return

		orig_level = self.api_level
		orig_platform_dir = self.platform_dir
		orig_google_apis_dir = self.google_apis_dir

		check_level = level
		while check_level > orig_level:
			self.find_platform_dir(check_level, False)
			if self.platform_dir:
				self.api_level = check_level
				print "[INFO] Targeting Android SDK version %s" % self.api_level
				break
			check_level -= 1

		if not self.platform_dir:
			# Couldn't match.  Set it back and return.
			self.platform_dir = orig_platform_dir
			return

		# Now give the Google APIs a chance to match.
		check_level = level
		while check_level > orig_level:
			self.find_google_apis_dir(check_level)
			if self.google_apis_dir:
				break
			check_level -= 1

		if not self.google_apis_dir:
			# Couldn't match, so set it back to what it was.
			self.google_apis_dir = orig_google_apis_dir

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

	def find_platform_dir(self, api_level=-1, raise_error=True):
		if api_level == -1:
			api_level = self.api_level

		platform_dir = self.find_dir(api_level, os.path.join('platforms', 'android-'))
		if platform_dir is None:
			old_style_dir = os.path.join(self.android_sdk, 'platforms', android_api_levels[api_level])
			if os.path.exists(old_style_dir):
				platform_dir = old_style_dir
		if platform_dir is None and raise_error:
			raise Exception("No \"%s\" or \"%s\" in the Android SDK" % ('android-%s' % api_level, android_api_levels[api_level]))
		self.platform_dir = platform_dir

	def find_google_apis_dir(self, api_level=-1):
		if api_level == -1:
			api_level = self.api_level

		if 'GOOGLE_APIS' in os.environ:
			self.google_apis_dir = os.environ['GOOGLE_APIS']
			return self.google_apis_dir
		self.google_apis_dir = self.find_dir(api_level, os.path.join('add-ons', 'google_apis-'))
		if self.google_apis_dir is None:
			self.google_apis_dir = self.find_dir(api_level, os.path.join('add-ons', 'addon?google?apis?google*'))

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
		# for aapt (and maybe eventually for others) we
		# want to favor platform-tools over android-x/tools
		# because of new resource qualifiers for honeycomb
		sdk_platform_tools_dir = self.get_sdk_platform_tools_dir()
		if not sdk_platform_tools_dir is None and os.path.exists(os.path.join(sdk_platform_tools_dir, 'aapt')):
			return os.path.join(sdk_platform_tools_dir, 'aapt')

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

	def run_adb(self, args, device_args=None):
		adb_args = [self.get_adb()]
		if device_args != None:
			adb_args.extend(device_args)
		adb_args.extend(args)
		(out, err) = subprocess.Popen(adb_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
		if type(err) != types.NoneType and len(err) > 0:
			raise Exception(err)
		return out

	def list_processes(self, adb_args=None):
		out = self.run_adb(['shell', 'ps'], adb_args)
		processes = []
		for line in out.splitlines():
			line = line.strip()
			tokens = re.split(r"\s+", line)
			if len(tokens) < 2: continue
			if tokens[0] == 'USER': continue
			process = {"pid": tokens[1], "name": tokens[len(tokens)-1]}
			processes.append(process)
		return processes

	def jdwp_kill(self, app_id, adb_args=None, forward_port=51111):
		import socket, struct, uuid
		pid = None
		for process in self.list_processes(adb_args):
			if process['name'] == app_id:
				pid = process['pid']
				break
		if pid == None:
			raise Exception("No processes running with the name: %s" % app_id)

		out = self.run_adb(['jdwp'], adb_args)
		found_pid = False
		for line in out.splitlines():
			if line == pid:
				found_pid = True
				break
	
		if not found_pid:
			raise Exception("The application %s (PID %s) is not debuggable, and cannot be killed via JDWP" % (app_id, pid))

		self.run_adb(['forward', 'tcp:%d' % forward_port, 'jdwp:%s' % pid], adb_args)
		jdwp_socket = socket.create_connection(('', forward_port))
		jdwp_socket.settimeout(5.0)
		jdwp_socket.send('JDWP-Handshake')
		try:
			handshake = jdwp_socket.recv(14)
		except:
			jdwp_socket.close()
			raise Exception('Timeout when waiting for handshake, make sure no other DDMS debuggers are running (i.e. Eclipse)')

		if handshake != 'JDWP-Handshake':
			jdwp_socket.close()
			raise Exception('Incorrect handshake, make sure the process is still running')

		# Taken from Android ddmlib
		DDMS_CMD = 0x01
		DDMS_CMD_SET = 0xc7
		# just a random 32 bit integer should be good enough
		packetId = uuid.uuid4().time_low
		packetLen = 23

		# the string EXIT bitshifted into an integer
		EXIT = 1163413844
		EXIT_LEN = 4
		exitCode = 1

		packet = struct.pack('!2I3B3I', packetLen, packetId, 0, DDMS_CMD_SET, DDMS_CMD, EXIT, EXIT_LEN, exitCode)
		jdwp_socket.send(packet)
		jdwp_socket.close()

if __name__ == "__main__":
	if len(sys.argv) < 2:
		print "Usage: %s ANDROID_SDK [API]" % sys.argv[0]
		print "  ANDROID_SDK is the default path to the Android SDK. Use '-' if there is no default path"
		print "  API (optional) is an Android API version (i.e. 4, 5, 6, 7, 8). The default is 7."
		print ""
		print "Prints the SDK directory, Android Platform directory, and Google APIs directory"
		sys.exit(1)

	sdk_path = sys.argv[1]
	if sdk_path == '-':
		sdk_path = None

	api_level = DEFAULT_API_LEVEL
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
