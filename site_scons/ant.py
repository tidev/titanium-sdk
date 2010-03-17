import os, sys

root = os.path.abspath(os.path.join(os.path.dirname(sys._getframe(0).f_code.co_filename), ".."))

lib_dir = os.path.join(root, 'android', 'build', 'lib')
ant_classpath = [
	os.path.join(lib_dir, 'ant.jar'),
	os.path.join(lib_dir, 'ant-launcher.jar'),
	os.path.join(lib_dir, 'xercesImpl.jar'),
	os.path.join(lib_dir, 'xml-apis.jar'),
	os.path.join(lib_dir, 'ant-nodeps.jar')
]

def build(script="build.xml", target="", properties={}):
	ant_cmd = 'java -cp %s org.apache.tools.ant.launch.Launcher -Dant.home=build' % ":".join(ant_classpath)
	for property in properties.keys():
		ant_cmd += " -D%s=%s" % (property, properties[property])
	
	ant_cmd += " -buildfile %s %s" % (script, target)
	print ant_cmd
	os.system(ant_cmd)