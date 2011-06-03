#!/usr/bin/env python
import os, sys, subprocess
import unittest, drillbit, drillbit_sdk

drillbit_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
mobilesdk_dir = drillbit.extract_mobilesdk()

sdk_tests_dir = os.path.join(drillbit_dir, "sdk_tests")
sys.path.append(sdk_tests_dir)

def main():
	import android
	android_suite = unittest.TestLoader().loadTestsFromModule(android)
	#iphone_suite = unittest.TestLoader().loadTestsFromModule(iphone)
	all_suites = unittest.TestSuite([android_suite])
	unittest.TextTestRunner(verbosity=2).run(all_suites)

if __name__ == "__main__":
	main()