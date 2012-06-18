#!/usr/bin/env python
#
# Appcelerator Titanium Module Packager
#

version = '__VERSION__'
sdk_path = r'__SDK__'

import os, sys, time, datetime, string, math, zipfile, codecs, re, shutil, subprocess, base64
from datetime import date
from xml.dom.minidom import parseString
sys.path.append(os.path.join(sdk_path, "common"))
import simplejson

try:
	import markdown2 as markdown
except ImportError:
	import markdown

ignoreFiles = ['.DS_Store','.cvsignore','.gitignore']
ignoreDirs = ['.svn','_svn','.git','CVS','CVSROOT']

required_manifest_keys = ['name','version','moduleid','description','copyright','license','copyright','platform','minsdk']
manifest_defaults = {
	'description':'My module',
	'author': 'Your Name',
	'license' : 'Specify your license',
	'copyright' : 'Copyright (c) %s by Your Company' % str(date.today().year),
}
module_license_default = "TODO: place your license here and we'll include it in the module distribution"

def getText(nodelist):
	rc = ''
	for node in nodelist:
		if node.nodeType == node.TEXT_NODE:
			rc = rc + node.data
	rc = rc.strip()
	if rc.lower() in ['true', 'yes', '1']:
		rc = 'true'
	elif rc in ['false', 'no', '0']:
		rc = 'false'
	return rc

class Compiler(object):

	def __init__(self, deploytype):
		start_time = time.time()
		
		if not os.path.exists(sdk_path):
			print '[ERROR] Unable to find SDK path "%s"' % sdk_path
			sys.exit(1)
		
		print '[INFO] Titanium Mobile Web Module Compiler v%s' % version
		
		self.deploytype = deploytype
		self.module_path = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
		self.src_path = os.path.join(self.module_path, 'src')
		self.build_path = os.path.join(self.module_path, 'build')
		
		self.load_manifest()
		self.check_license()
		self.load_timodule_xml()
		self.check_main()
		
		self.modules_map = {}
		self.require_cache = {}
		self.parse_module(self.main, None)
		
		self.modules_to_cache = []
		for module in self.require_cache:
			if module != self.main and os.path.exists(os.path.join(self.build_path, module + '.js')):
				self.modules_to_cache.append(module)
		if 'precache' in self.timodule and 'requires' in self.timodule['precache'] and len(self.timodule['precache']['requires']):
			for req in self.timodule['precache']['requires']:
				self.modules_to_cache.append('commonjs:' + req)
		
		self.precache_images = []
		if 'precache' in self.timodule and 'images' in self.timodule['precache'] and len(self.timodule['precache']['images']):
			for img in self.timodule['precache']['images']:
				self.precache_images.append(img)
		
		if os.path.exists(self.build_path):
			shutil.rmtree(self.build_path, True)
		try:
			os.makedirs(self.build_path)
		except:
			pass
		
		self.copy(self.src_path, self.build_path)
		self.build_js()
		self.minify_js()
		self.package()
		
		total_time = round(time.time() - start_time)
		total_minutes = math.floor(total_time / 60)
		total_seconds = total_time % 60
		if total_minutes > 0:
			print '[INFO] Finished in %s minutes %s seconds' % (int(total_minutes), int(total_seconds))
		else:
			print '[INFO] Finished in %s seconds' % int(total_time)
	
	def load_manifest(self):
		self.manifest = {}
		manifest_file = os.path.join(self.module_path, 'manifest')
		
		if not os.path.exists(manifest_file):
			print '[ERROR] Unable to find manifest file'
			sys.exit(1)
		
		for line in open(manifest_file).readlines():
			line = line.strip()
			if line[0:1] == '#': continue
			if line.find(':') < 0: continue
			key,value = line.split(':')
			self.manifest[key.strip()] = value.strip()
		
		for key in required_manifest_keys:
			if not self.manifest.has_key(key):
				print '[ERROR] Missing required manifest key "%s"' % key
				sys.exit(1)
			
			if manifest_defaults.has_key(key):
				defvalue = manifest_defaults[key]
				curvalue = self.manifest[key]
				if curvalue == defvalue:
					print '[WARN] Please update the manifest key: "%s" to a non-default value' % key
	
	def check_license(self):
		c = open(os.path.join(self.module_path, 'LICENSE')).read()
		if c.find(module_license_default) != -1:
			print '[WARN] Please update the LICENSE file with your license text before distributing'
	
	def load_timodule_xml(self):
		global_settings = {}
		mobileweb_settings = {}
		timodule_file = os.path.join(self.module_path, 'timodule.xml')
		
		if not os.path.exists(timodule_file):
			print '[ERROR] Unable to find timodule.xml file'
			sys.exit(1)
		
		dom = parseString(codecs.open(timodule_file,'r','utf-8','replace').read().encode('utf-8'))
		root = dom.documentElement
		
		for node in root.childNodes:
			if node.nodeType == 1 and node.nodeName not in ['android', 'iphone']:
				if node.nodeName == 'mobileweb':
					for subnode in node.childNodes:
						if subnode.nodeType == 1:
							self.get_xml_children(mobileweb_settings[subnode.nodeName], subnode.childNodes)
				else:
					self.get_xml_children(global_settings[node.nodeName], node.childNodes)
		
		self.timodule = dict(global_settings.items() + mobileweb_settings.items())
	
	def check_main(self):
		self.main = self.timodule['main'] if 'main' in self.timodule else self.manifest['name']
		if not os.path.exists(os.path.join(self.src_path, self.main + '.js')):
			print '[ERROR] Unable to find main module "%s"' % self.main
			sys.exit(1)
	
	def get_xml_children(self, dest, nodes):
		if len(nodes) > 1:
			dest = {}
			for child in nodes.childNodes:
				if child.nodeType == 1:
					self.get_xml_children(dest[child.nodeName], child.childNodes)
		else:
			dest = getText(child.childNodes)
	
	def compact_path(self, path):
		result = []
		path = path.replace('\\', '/').split('/');
		while len(path):
			segment = path[0]
			path = path[1:]
			if segment == '..' and len(result) and lastSegment != '..':
				result.pop()
				lastSegment = result[-1]
			elif segment != '.':
				lastSegment = segment
				result.append(segment)
		return '/'.join(result);
	
	def resolve(self, it, ref):
		parts = it.split('!')
		it = parts[-1]
		if it.startswith('url:'):
			it = it[4:]
			if it.startswith('/'):
				it = '.' + it
			parts = it.split('/')
			return [self.build_path, it]
		if it.find(':') != -1:
			return []
		if it.startswith('/') or (len(parts) == 1 and it.endswith('.js')):
			return [self.build_path, it]
		if it.startswith('.') and ref is not None:
			it = self.compact_path(ref + it)
		parts = it.split('/')
		return [self.build_path, it]
	
	def parse_module(self, module, ref):
		if module in self.require_cache or module == 'require':
			return
		
		parts = module.split('!')
		
		if len(parts) == 1:
			if module.startswith('.') and ref is not None:
				module = self.compact_path(ref + module)
			self.require_cache[module] = 1
		
		dep = self.resolve(module, ref)
		if not len(dep):
			return
		
		if len(parts) > 1:
			self.require_cache['url:' + parts[1]] = 1
		
		filename = dep[1]
		if not filename.endswith('.js'):
			filename += '.js'
		
		source = os.path.join(dep[0], filename)
		if not os.path.exists(source):
			return
		
		source = codecs.open(source, 'r', 'utf-8').read()
		pattern = re.compile('define\(\s*([\'\"][^\'\"]*[\'\"]\s*)?,?\s*(\[[^\]]+\])\s*?,?\s*(function|\{)')
		results = pattern.search(source)
		if results is None:
			self.modules_map[module] = []
		else:
			groups = results.groups()
			if groups is not None and len(groups):
				if groups[1] is None:
					self.modules_map[module] = []
				else:
					deps = self.parse_deps(groups[1])
					for i in range(0, len(deps)):
						dep = deps[i]
						parts = dep.split('!')
						ref = module.split('/')
						ref.pop()
						ref = '/'.join(ref) + '/'
						if dep.startswith('.'):
							deps[i] = self.compact_path(ref + dep)
						if len(parts) == 1:
							if dep.startswith('./'):
								parts = module.split('/')
								parts.pop()
								parts.append(dep)
								self.parse_module(self.compact_path('/'.join(parts)), ref)
							else:
								self.parse_module(dep, ref)
						else:
							self.modules_map[dep] = parts[0]
							self.parse_module(parts[0], module)
							if parts[0] == 'Ti/_/text':
								if dep.startswith('./'):
									parts = module.split('/')
									parts.pop()
									parts.append(dep)
									self.parse_module(self.compact_path('/'.join(parts)), ref)
								else:
									self.parse_module(dep, ref)
					self.modules_map[module] = deps
	
	def parse_deps(self, deps):
		found = []
		if len(deps) > 2:
			deps = deps[1:-1]
			deps = deps.split(',')
			for dep in deps:
				dep = dep.strip().split(' ')[0].strip()
				if dep.startswith('\'') or dep.startswith('"'):
					found.append(simplejson.loads(dep))
		return found
	
	def copy(self, src_path, dest_path):
		print '[INFO] Copying %s...' % src_path
		for root, dirs, files in os.walk(src_path):
			for name in ignoreDirs:
				if name in dirs:
					dirs.remove(name)
			for file in files:
				if file in ignoreFiles or file.startswith('._'):
					continue
				source = os.path.join(root, file)
				dest = os.path.expanduser(source.replace(src_path, dest_path, 1))
				dest_dir = os.path.expanduser(os.path.split(dest)[0])
				if not os.path.exists(dest_dir):
					os.makedirs(dest_dir)
				shutil.copy(source, dest)
	
	def build_js(self):
		main_file = os.path.join(self.build_path, self.main + '.js')
		tmp = main_file + '.tmp'
		js = codecs.open(tmp, 'w', encoding='utf-8')
		if len(self.modules_to_cache) > 0 or len(self.precache_images) > 0:
			js.write('require.cache({\n')
			first = True
			for x in self.modules_to_cache:
				if x == self.main:
					continue
				is_cjs = False
				if x.startswith('commonjs:'):
					is_cjs = True
					x = x[9:]
				dep = self.resolve(x, None)
				if not len(dep):
					continue
				if not first:
					js.write(',\n')
				first = False
				filename = dep[1]
				if not filename.endswith('.js'):
					filename += '.js'
				file_path = os.path.join(dep[0], filename)
				if x.startswith('url:'):
					source = file_path + '.uncompressed.js'
					if self.minify:
						os.rename(file_path, source)
						print '[INFO] Minifying include %s' % file_path
						p = subprocess.Popen('java -Xms256m -Xmx256m -jar "%s" --compilation_level SIMPLE_OPTIMIZATIONS --js "%s" --js_output_file "%s"' % (os.path.join(sdk_path, 'mobileweb', 'closureCompiler', 'compiler.jar'), source, file_path), shell=True, stdout = subprocess.PIPE, stderr = subprocess.PIPE)
						stdout, stderr = p.communicate()
						if p.returncode != 0:
							print '[ERROR] Failed to minify "%s"' % file_path
							for line in stderr.split('\n'):
								if len(line):
									print '[ERROR]    %s' % line
							print '[WARN] Leaving %s un-minified' % file_path
							os.remove(file_path)
							shutil.copy(source, file_path)
					js.write('"%s":"%s"' % (x, codecs.open(file_path, 'r', 'utf-8').read().strip().replace('\\', '\\\\').replace('\n', '\\n\\\n').replace('\"', '\\\"')))
				elif is_cjs:
					js.write('"%s":function(){\n/* %s */\ndefine(function(require, exports, module){\n%s\n});\n}' % (x, file_path.replace(self.build_path, ''), codecs.open(file_path, 'r', 'utf-8').read()))
				else:
					js.write('"%s":function(){\n/* %s */\n\n%s\n}' % (x, file_path.replace(self.build_path, ''), codecs.open(file_path, 'r', 'utf-8').read()))
			
			image_mime_types = {
				'.png': 'image/png',
				'.gif': 'image/gif',
				'.jpg': 'image/jpg',
				'.jpeg': 'image/jpg'
			}
			for x in self.precache_images:
				x = x.replace('\\', '/')
				y = x
				if y.startswith(os.sep):
					y = '.' + y
				img = os.path.join(self.module_path, os.sep.join(y.split('/')))
				if os.path.exists(img):
					fname, ext = os.path.splitext(img.lower())
					if ext in image_mime_types:
						if not first:
							js.write(',\n')
						first = False
						js.write('"url:%s":"data:%s;base64,%s"' % (x, image_mime_types[ext], base64.b64encode(open(img,'rb').read())))
			
			js.write('});\n')
		
		js.write(codecs.open(main_file, 'r', 'utf-8').read())
		js.close()
		
		os.remove(main_file)
		os.rename(tmp, main_file)
	
	def minify_js(self):
		subprocess.call('java -Xms256m -Xmx256m -cp "%s%s%s" -Djava.awt.headless=true minify "%s"' % (
			os.path.join(sdk_path, 'mobileweb', 'minify'),
			os.pathsep,
			os.path.join(sdk_path, 'mobileweb', 'closureCompiler', 'compiler.jar'),
			self.build_path
		), shell=True)
	
	def generate_doc(self):
		docdir = os.path.join(self.module_path, 'documentation')
		if not os.path.exists(docdir):
			print '[WARN] Couldn\'t find documentation file at: %s' % docdir
			return None
		documentation = []
		for file in os.listdir(docdir):
			if file in ignoreFiles or file.startswith('._') or os.path.isdir(os.path.join(docdir, file)):
				continue
			md = open(os.path.join(docdir, file)).read()
			html = markdown.markdown(md)
			documentation.append({file:html});
		return documentation

	def zip_dir(self, zf, dir, basepath):
		for root, dirs, files in os.walk(dir):
			for name in ignoreDirs:
				if name in dirs:
					dirs.remove(name)
			for file in files:
				if file in ignoreFiles or file.startswith('._') or file.endswith('.uncompressed.js'):
					continue
				e = os.path.splitext(file)
				if len(e) == 2 and e[1] == '.pyc':
					continue
				from_ = os.path.join(root, file)	
				to_ = from_.replace(dir, basepath, 1)
				zf.write(from_, to_)
	
	def package(self):
		name = self.manifest['name'].lower()
		moduleid = self.manifest['moduleid'].lower()
		version = self.manifest['version']
		install_path = 'modules/mobileweb/%s/%s' % (moduleid, version)
		
		zip_file = os.path.join(self.module_path, '%s-mobileweb-%s.zip' % (moduleid,version))
		if os.path.exists(zip_file):
			os.remove(zip_file)
		
		zf = zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED)
		zf.write(os.path.join(self.module_path, 'manifest'), '%s/manifest' % install_path)
		zf.write(os.path.join(self.module_path, 'LICENSE'), '%s/LICENSE' % install_path)
		
		zf.writestr('%s/package.json' % install_path, simplejson.dumps({
			'name': self.manifest['name'],
			'description': self.manifest['description'],
			'version': self.manifest['version'],
			'directories': {
				'lib': './src'
			},
			'main': self.main
		}, indent=4, sort_keys=True))
		
		self.zip_dir(zf, 'build', '%s/src' % install_path)
		self.zip_dir(zf, 'example', '%s/example' % install_path)
		
		docs = self.generate_doc()
		if docs != None:
			for doc in docs:
				for file, html in doc.iteritems():
					filename = string.replace(file, '.md', '.html')
					zf.writestr('%s/documentation/%s' % (install_path, filename), html)
		
		zf.close()

if __name__ == '__main__':
	if len(sys.argv) > 1 and sys.argv[1].lower() in ['help', '--help', '-h']:
		print 'Usage: %s [<deploytype>]' % os.path.basename(sys.argv[0])
		sys.exit(1)
	Compiler('production' if len(sys.argv) <= 1 else sys.argv[1].lower())
	sys.exit(0)
