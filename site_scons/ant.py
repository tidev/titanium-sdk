import os, sys, platform

root = os.path.abspath(os.path.join(os.path.dirname(sys._getframe(0).f_code.co_filename), ".."))

lib_dir = os.path.join(root, 'android', 'build', 'lib')
ant_classpath = [
	os.path.join(lib_dir, 'ant.jar'),
	os.path.join(lib_dir, 'ant-launcher.jar'),
	os.path.join(lib_dir, 'xercesImpl.jar'),
	os.path.join(lib_dir, 'xml-apis.jar'),
	os.path.join(lib_dir, 'ant-nodeps.jar')
]

jdk_jar_added = False
def get_java():
	global jdk_jar_added
	java = 'java'
	if platform.system() == 'Windows':
		# oh windows, we hate you so
		if 'JAVA_HOME' in os.environ:
			java = os.path.join(os.environ['JAVA_HOME'], 'bin', 'java.exe')
			if not jdk_jar_added:
				ant_classpath.append(os.path.join(os.environ['JAVA_HOME'], 'lib', 'tools.jar'))
				jdk_jar_added = True
	return java

def build(script='build.xml', target='', properties={}):
	ant_cmd = '%s -cp %s org.apache.tools.ant.launch.Launcher -Dant.home=build' % \
		(get_java(), os.pathsep.join(ant_classpath))
	for property in properties.keys():
		ant_cmd += ' -D%s=%s' % (property, properties[property])
	
	ant_cmd += ' -buildfile %s %s' % (script, target)
	print ant_cmd
	os.system(ant_cmd)
