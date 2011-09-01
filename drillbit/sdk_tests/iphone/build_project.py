#!/usr/bin/env python
import os, sys, mobilesdk

class BuildProject(mobilesdk.MobileSDKTest):
	def testLogIndexSearch(self):
		supportDir = os.path.join(self.mobileDir, "support")
		iphoneSupportDir = os.path.join(supportDir, "iphone")
		sys.path.insert(0, supportDir)
		sys.path.insert(0, iphoneSupportDir)

		import tiapp
		from builder import is_indexing_enabled

		testResourcesDir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "testResources")
		tiappEnableMdfind = tiapp.TiAppXML(os.path.join(testResourcesDir, "tiapp_enablemdfind.xml"))
		tiappDisableMdfind = tiapp.TiAppXML(os.path.join(testResourcesDir, "tiapp_disablemdfind.xml"))

		simulatorDir = os.path.expanduser('~/Library/Application Support/iPhone Simulator/%s' % self.iosVersion)

		nonRootDisabled = "/:\n\tIndexing enabled.\n/Volumes/Dummy:\n\tIndexing disabled."
		rootDisabledUsersEnabled = "/:\n\tIndexing disabled.\n/Users:\n\tIndexing enabled."
		onlyRootDisabled = "/:\n\tIndexing disabled."
		onlyRootEnabled = "/:\n\tIndexing enabled."

		# should be disabled in leopard, regardless of enablemdfind property
		self.assertFalse(is_indexing_enabled(tiappEnableMdfind, simulatorDir,
			platform_release="9.0.0"))

		# enablemdfind = false should disable
		self.assertFalse(is_indexing_enabled(tiappDisableMdfind, simulatorDir))

		# indexing disabled on non-root volume should still be enabled
		self.assertTrue(is_indexing_enabled(tiappEnableMdfind, simulatorDir,
			indexer_status=nonRootDisabled))

		# indexing enabled when / is disabled, but /Users is enabled
		self.assertTrue(is_indexing_enabled(tiappEnableMdfind, simulatorDir,
			indexer_status=rootDisabledUsersEnabled))

		# indexing disabled when / is disabled by itself
		self.assertFalse(is_indexing_enabled(tiappEnableMdfind, simulatorDir,
			indexer_status=onlyRootDisabled))

		# indexing enabled when / is enabled by itself
		self.assertTrue(is_indexing_enabled(tiappEnableMdfind, simulatorDir,
			indexer_status=onlyRootEnabled))



