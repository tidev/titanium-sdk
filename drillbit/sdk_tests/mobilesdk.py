import os, sys, tempfile
import platform, unittest2
import subprocess, logging
import shutil, zipfile

logging.basicConfig(
	format = "[%(asctime)s] [%(levelname)s] %(message)s",
	datefmt = "%m/%d/%Y %I:%M:%S %p",
	level = logging.INFO)
log = logging.getLogger("drillbit_sdk")

class MobileSDKTest(unittest2.TestCase):
	CONFIG_ANDROID_SDK = "androidSdk"
	CONFIG_IOS_VERSION = "iosVersion"
	CONFIG_AUTO_DELETE_PROJECTS = "autoDeleteProjects"
	CONFIG_RUN_WITH_PDB = "runWithPdb"
	CONFIG_SUPPRESS_OUTPUT = "suppressOutput"
	CONFIG_MOBILE_SDK_ZIP = "mobileSdkZip"
	CONFIG_MOBILE_SDK_DIR = "mobileSdkDir"

	@classmethod
	def getSdkConfig(cls, property):
		import sdkconfig
		if hasattr(sdkconfig, property):
			return getattr(sdkconfig, property)
		return None

	@classmethod
	def setUpClass(cls):
		cls.sdkTestsDir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
		cls.mobileDir = os.path.dirname(os.path.dirname(cls.sdkTestsDir))
		sys.path.append(os.path.join(cls.mobileDir, "build"))
		import titanium_version

		sdkConfigScript = os.path.join(cls.sdkTestsDir, "sdkconfig.py")
		if not os.path.exists(sdkConfigScript):
			log.error("No sdkconfig.py found in %s" % cls.sdkTestsDir)
			log.error("Copy sdkconfig.py.example for your environment")
			sys.exit(1)

		cls.tiVersion = titanium_version.version
		cls.platformName = {"Darwin": "osx", "Windows": "win32", "Linux": "linux"}[platform.system()]
		mobileSdkZip = cls.getSdkConfig(cls.CONFIG_MOBILE_SDK_ZIP)
		mobileSdkDir = cls.getSdkConfig(cls.CONFIG_MOBILE_SDK_DIR)

		configFormatter = {
			"platform": cls.platformName,
			"version": cls.tiVersion,
			"mobileDir": cls.mobileDir }
		if mobileSdkDir:
			cls.mobileSdkDir = mobileSdkDir % configFormatter
		elif mobileSdkZip:
			path = mobileSdkZip % configFormatter
			zip = zipfile.ZipFile(path)
			cls.mobileSdkDir = tempfile.mkdtemp()
			log.info("Extracting MobileSDK zip %s to %s..." % (path, cls.mobileSdkDir))
			zip.extractall(cls.mobileSdkDir)
			zip.close()
		else:
			log.error("No MobileSDK zip or directory specified, at least one is required to run the MobileSDK test suite")
			sys.exit(1)

		if not os.path.exists(cls.mobileSdkDir):
			log.error("MobileSDK directory doesn't exist: %s" % cls.mobileSdkDir)
			sys.exit(1)
		else:
			log.info("Using MobileSDK at %s" % cls.mobileSdkDir)

	def setUp(self):
		import sdkconfig
		self.projectScript = os.path.join(self.mobileSdkDir, "project.py")
		self.titaniumScript = os.path.join(self.mobileSdkDir, "titanium.py")
		self.androidDir = os.path.join(self.mobileSdkDir, "android")
		self.androidBuilderScript = os.path.join(self.androidDir, "builder.py")
		self.iphoneDir = os.path.join(self.mobileSdkDir, "iphone")
		self.iphoneBuilderScript = os.path.join(self.iphoneDir, "builder.py")
		if "ANDROID_SDK" in os.environ:
			self.androidSdk = os.environ["ANDROID_SDK"]
		elif hasattr(sdkconfig, "androidSdk"):
			self.androidSdk = sdkconfig.androidSdk
		if "IOS_VERSION" in os.environ:
			self.iosVersion = os.environ["IOS_VERSION"]
		elif hasattr(sdkconfig, "iosVersion"):
			self.iosVersion = sdkconfig.iosVersion
		self.testDir = tempfile.mkdtemp()

	def pythonProcess(self, *args, **kwargs):
		pyArgs = [sys.executable]

		runWithPdb = self.getSdkConfig(self.CONFIG_RUN_WITH_PDB)
		if runWithPdb:
			pyArgs.append("-mpdb")

		pyArgs.extend(*args)

		if self.getSdkConfig(self.CONFIG_SUPPRESS_OUTPUT) and not runWithPdb:
			kwargs["stdout"] = subprocess.PIPE
		return subprocess.Popen(pyArgs, **kwargs)

	def createProject(self, name, platform, id=None, sdk=None):
		self.projectName = name
		self.projectId = id
		if id == None:
			self.projectId = "org.appcelerator.drillbit." + name

		args = [self.projectScript, self.projectName, self.projectId,
			self.testDir, platform]

		if sdk == None and platform == "android":
			args.append(self.androidSdk)
		elif sdk == None and platform in ("iphone", "ios", "ipad"):
			args.append(self.iosVersion)
		elif sdk != None:
			args.append(sdk)

		p = self.pythonProcess(args)
		p.communicate()
		self.assertEqual(p.returncode, 0)

		self.projectDir = os.path.join(self.testDir, self.projectName)
		self.assertTrue(os.path.exists(self.projectDir))
		logging.info("Succesfully created project at %s" % self.projectDir)

	def buildAndroidProject(self):
		p = self.pythonProcess([self.androidBuilderScript, "build",
			self.projectName, self.androidSdk, self.projectDir, self.projectId])
		p.communicate()
		self.assertEqual(p.returncode, 0)

	def buildIOSProject(self):
		p = self.pythonProcess([self.iphoneBuilderScript, "build",
			self.iosVersion, self.projectDir, self.projectId, self.projectName])
		p.communicate()
		self.assertEqual(p.returncode, 0)

	def tearDown(self):
		if self.getSdkConfig(self.CONFIG_AUTO_DELETE_PROJECTS):
			shutil.rmtree(self.testDir)
