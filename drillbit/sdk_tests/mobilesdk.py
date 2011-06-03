import os, sys, tempfile
import platform, unittest
import subprocess, logging
import shutil

logging.basicConfig()

sdk_tests_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
mobile_dir = os.path.dirname(os.path.dirname(sdk_tests_dir))
sys.path.append(os.path.join(mobile_dir, 'build'))
import titanium_version

platform_name = {'Darwin': 'osx', 'Windows': 'win32', 'Linux': 'linux'}[platform.system()]
mobilesdk_dir = os.path.join(mobile_dir, 'dist', 'mobilesdk', platform_name, titanium_version.version)

class MobileSDKTest(unittest.TestCase):
	def setUp(self):
		self.mobilesdk_dir = mobilesdk_dir
		self.project_script = os.path.join(self.mobilesdk_dir, 'project.py')
		self.titanium_script = os.path.join(self.mobilesdk_dir, 'titanium.py')
		self.android_dir = os.path.join(self.mobilesdk_dir, 'android')
		self.android_builder_script = os.path.join(self.android_dir, 'builder.py')
		self.iphone_dir = os.path.join(self.mobilesdk_dir, 'iphone')
		self.iphone_builder_script = os.path.join(self.iphone_dir, 'builder.py')
		if 'ANDROID_SDK' in os.environ:
			self.android_sdk = os.environ['ANDROID_SDK']
		self.test_dir = tempfile.mkdtemp()

	def pythonProcess(self, *args, **kwargs):
		pyArgs = [sys.executable]
		pyArgs.extend(*args)
		return subprocess.Popen(pyArgs, **kwargs)

	def tearDown(self):
		shutil.rmtree(self.test_dir)