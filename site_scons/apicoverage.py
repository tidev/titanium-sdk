#
# Titanium API Coverage Generator
#
# Initial Author: Jeff Haynie, 3/30/09
#
import glob, re, os.path as path
import fnmatch, os, sys
import simplejson as json
import traceback

class GlobDirectoryWalker:
	# a forward iterator that traverses a directory tree

	def __init__(self, directory, patterns=['*']):
		self.stack = [directory]
		self.patterns = patterns
		self.files = []
		self.index = 0

	def __getitem__(self, index):
		while 1:
			try:
				file = self.files[self.index]
				self.index = self.index + 1
			except IndexError:
				# pop next directory from stack
				self.directory = self.stack.pop()
				self.files = os.listdir(self.directory)
				self.index = 0
			else:
				# got a filename
				fullname = os.path.join(self.directory, file)
				if os.path.isdir(fullname) and not os.path.islink(fullname):
					self.stack.append(fullname)
				for pattern in self.patterns:
					if fnmatch.fnmatch(file, pattern):
						return fullname

def convert_type(value):
	# trivial type conversions
	if type(value)!=str:
		return value
	if value == 'True' or value == 'true':
		return True
	elif value == 'False' or value == 'false':
		return False
	elif re.match('^[0-9]+$',value):
		return int(value)
	elif re.match('^[0-9\.]+$',value):
		return float(value)
	return value

def parse_pattern(m,ignoreDescription=False):
	description = None
	if not ignoreDescription:
		description = m.group(2).strip()
	metadata = {}
	for value in m.group(1).strip().split(','):
		key,value = value.split('=')
		metadata[key]=value
	return description,metadata

def get_property(h,name,default,convert=True):
	try:
		if convert:
			return convert_type(h[name])
		else:
			return h[name]
	except:
		return default
		
class API(dict):
	def __init__(self, params, name, description):
		self['description'] = description
		self.name = name
		self.deprecated = False
		if get_property(params,'method',False):
			self['method'] = True
			self['returns'] = None
			self['arguments'] = []
		if get_property(params,'property',False):
			self['property'] = True
		self['since'] = get_property(params,'since','0.30',False)
	
	def __str__(self):
		return 'API<%s>' % self.name
		
	def add_argument(self,arg):
		try:
			self['arguments'].append(arg)
		except:
			print "Invalid type: %s" % self
		
	def set_return_type(self,return_type):
		self['returns'] = return_type
		
	def set_deprecated(self,msg,version):
		self.deprecated = True
		self['deprecated'] = msg
		self['deprecated_on'] = version

class APIArgument(dict):
	def __init__(self, params, description):
		self['description'] = description
		self['name'] = params['name']
		self.forname = params['for']
		self['type'] = get_property(params,'type','object')
		self['optional'] = get_property(params,'optional',False)

	def __str__(self):
		return 'APIArgument<%s>' % self['name']

class APIReturnType(dict):
	def __init__(self, params, description):
		self.forname = params['for']
		self['description'] = description
		self['type'] = get_property(params,'type','void')

	def __str__(self):
		return 'APIReturnType<%s>' % self['name']

def get_api_names(name):
	tok = name.split('.')
	module = tok[0]
	tok.pop(0)
	return module,'.'.join(tok)

def get_last_method_before(method_index, start):
	current_start = None

	method_starts = method_index.keys()
	method_starts.sort()
	for method_start in method_starts:
		if method_start > start:
			break
		else:
			current_start = method_start

	if current_start:
		return method_index[current_start]
	else:
		return None

def generate_api_coverage(dirs,fs):
	api_pattern = '@tiapi\(([^\)]*)\)(.*)\n'
	arg_pattern = '@tiarg\(([^\)]*)\)(.*)\n'
	res_pattern = '@tiresult\(([^\)]*)\)(.*)\n'
	dep_pattern = '@tideprecated\(([^\)]*)\)(.*)\n'

	context_sensitive_api_description = '@tiapi (.*)\n'
	context_sensitive_arg_pattern = '@tiarg\[([^]]+)\](.*)\n'
	context_sensitive_result_pattern = '@tiresult\[([^]]+)\](.*)\n'

	files = set()
	apis = {}
	api_count = 0
	file_count = 0
	module_count = 0

	extensions = ['h','cc','c','cpp','m','mm','js','py','rb']
	extensions = ['*.' + x for x in extensions]
	for dirname in dirs:
		print dirname
		for i in GlobDirectoryWalker(dirname, extensions):
			files.add(i)

	for f in files:
		fh = open(str(f),'r')
		content = fh.read()
		found = False
		match = None

		start_index_to_method = {}

		try:
			for m in re.finditer(api_pattern,content):
				match = m
				description,metadata = parse_pattern(m)
				module_name,fn_name = get_api_names(metadata['name'])
				print "adding %s -- %s" % (module_name, fn_name)
				if not apis.has_key(module_name):
					apis[module_name] = {}
					module_count+=1
				if not apis[module_name].has_key(fn_name):
					api = API(metadata,fn_name,description)
					apis[module_name][fn_name]=api
					api_count+=1
					found = True

					# Record the index of the start of this match so we can
					# use context sensitive arguments, etc later.
					start_index_to_method[m.start()] = api

			for m in re.finditer(context_sensitive_arg_pattern, content):
				match = m
				api = get_last_method_before(start_index_to_method, m.start())
				if not api: continue

				bits = m.group(1).split(',', 2)
				metadata = {}
				metadata['for'] = api.name
				metadata['type'] = bits[0].strip()
				metadata['name'] = bits[1].strip()
				metadata['description'] = m.group(2).strip()
				if len(bits) > 2: metadata['optional'] = True
				api.add_argument(APIArgument(metadata, metadata['description']))

			for m in re.finditer(context_sensitive_result_pattern, content):
				match = m
				api = get_last_method_before(start_index_to_method, m.start())
				if not(api): continue

				metadata = {}
				metadata['type'] = m.group(1).strip()
				metadata['description'] = m.group(2).strip()
				metadata['for'] = api.name
				api.set_return_type(APIReturnType(metadata, metadata['description']))

			for m in re.finditer(context_sensitive_api_description, content):
				match = m
				description = m.group(1)
				api = get_last_method_before(start_index_to_method, m.start())
				if api:
					description = api['description'] + ' ' + description.strip()
					api['description'] = description.strip()

			for m in re.finditer(arg_pattern,content):
				match = m
				description,metadata = parse_pattern(m)
				module_name,fn_name = get_api_names(metadata['for'])
				api = apis[module_name][fn_name]
				api.add_argument(APIArgument(metadata,description))
			for m in re.finditer(res_pattern,content):
				match = m
				description,metadata = parse_pattern(m)
				module_name,fn_name = get_api_names(metadata['for'])
				api = apis[module_name][fn_name]
				api.set_return_type(APIReturnType(metadata,description))
			for m in re.finditer(dep_pattern,content):
				match = m
				description,metadata = parse_pattern(m)
				module_name,fn_name = get_api_names(metadata['for'])
				api = apis[module_name][fn_name]
				api.set_deprecated(description,metadata['version'])
			if found:
				file_count+=1
		except Exception, e:
			print "Exception parsing API metadata in file: %s" % str(f)
			if match:
				print "Error was for: %s" % str(match.group(0))
			raise

	fs.write(json.dumps(apis, sort_keys=True, indent=4))

	print "Found %i APIs for %i modules in %i files" % (api_count,module_count,file_count)

if __name__ == '__main__':
	if len(sys.argv)!=3:
		print "Usage: %s <dir> <outfile>" % os.path.basename(sys.argv[0])
		sys.exit(1)
	f = open(os.path.expanduser(sys.argv[2]), 'w')
	dirs = []
	dirs.append(os.path.abspath(os.path.expanduser(sys.argv[1])))
	generate_api_coverage(dirs,f)	
	
