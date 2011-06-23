#!/usr/bin/env python
import os, sys, mobilesdk
import zipfile, time

class PackagingTest(mobilesdk.MobileSDKTest):
	def assertZipData(self, zip, path, data):
		try:
			info = zip.getinfo(path)
			infoData = zip.open(info).read()
			self.assertEqual(infoData, data)
		except KeyError, e:
			self.fail(e)

	def testIncrementalPackaging(self):
		self.createProject("packagingTest", "android")

		# First test a clean build with a single custom file, and make sure it exists
		testFile = os.path.join(self.projectDir, "Resources", "test-file.txt")
		open(testFile, "w").write("#1")

		self.buildAndroidProject()
		buildAndroidDir = os.path.join(self.projectDir, "build", "android")
		buildResourcesDir = os.path.join(buildAndroidDir, "bin", "assets", "Resources")

		destTestFile = os.path.join(buildResourcesDir, "test-file.txt")
		self.assertTrue(os.path.exists(destTestFile))

		destData = open(destTestFile, "r").read()
		self.assertEqual(destData, "#1")

		# Now test with an updated version of the same file, and a second new file
		testFile2 = os.path.join(self.projectDir, "Resources", "test-file2.txt")
		open(testFile, "w").write("#1 changed")
		open(testFile2, "w").write("#2")
		self.buildAndroidProject()

		destTestFile2 = os.path.join(buildResourcesDir, "test-file2.txt")
		self.assertTrue(os.path.exists(destTestFile2))

		destData = open(destTestFile, "r").read()
		destData2 = open(destTestFile2, "r").read()
		self.assertEqual(destData, "#1 changed")
		self.assertEqual(destData2, "#2")

		apk = os.path.join(buildAndroidDir, "bin", "app.apk")
		self.assertTrue(os.path.exists(apk))

		apkZip = zipfile.ZipFile(apk)
		def assertApkResourceData(path, data):
			self.assertZipData(apkZip, "assets/Resources/%s" % path, data)

		assertApkResourceData("test-file.txt", "#1 changed")
		assertApkResourceData("test-file2.txt", "#2")
		apkZip.close()

		# Test with a new file that has an older timestamp
		testFile3 = os.path.join(self.projectDir, "Resources", "test-file3.txt")
		open(testFile3, "w").write("#3")

		yesterday = time.time() - (60 * 60 * 24)
		os.utime(testFile3, (yesterday, yesterday))
		self.buildAndroidProject()

		destTestFile3 = os.path.join(buildResourcesDir, "test-file3.txt")
		self.assertTrue(os.path.exists(destTestFile3))

		destData3 = open(destTestFile3, "r").read()
		self.assertEqual(destData3, "#3")

		apkZip = zipfile.ZipFile(apk)
		assertApkResourceData("test-file3.txt", "#3")

