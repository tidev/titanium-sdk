
import os, sys, codecs, shutil, filecmp, subprocess

# the template_dir is the path where this file lives on disk
template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))

def ensure_dev_path(debug=True):
	rc = subprocess.call(["xcode-select", "-print-path"], stdout=open(os.devnull, 'w'), stderr=open(os.devnull, 'w'))
	if rc == 0 :
		return
	if debug:
		print '[INFO] XCode 4.3+ likely. Searching for developer folders.'
	trypath = '/Developer'
	if os.path.isdir(trypath):
		os.putenv('DEVELOPER_DIR',trypath)
		return
	trypath = '/Applications/Xcode.app/Contents/Developer'
	if os.path.isdir(trypath):
		os.putenv('DEVELOPER_DIR',trypath)
		return
	spotlight_args = ['mdfind','kMDItemDisplayName==Xcode&&kMDItemKind==Application']
	spotlight = subprocess.Popen(spotlight_args, stderr=subprocess.STDOUT, stdout=subprocess.PIPE)
	for line in spotlight.stdout.readlines():
		trypath = line.rstrip()+'/Contents/Developer'
		if os.path.isdir(trypath):
			os.putenv('DEVELOPER_DIR',trypath)
			return

def read_config(f):
	props = {}
	if os.path.exists(f):
		contents = open(f).read()
		for line in contents.splitlines(False):
			if line[0:1]=='#': continue
			(k,v) = line.split("=")
			props[k]=v
	return props

def locate_modules(modules, project_dir, assets_dest_dir, log):
	module_lib_search_path = []
	module_asset_dirs = []

	for module in modules:
		if module.js:
			# Skip CommonJS modules. These will be processed in a later pass.
			continue
		module_id = module.manifest.moduleid.lower()
		module_version = module.manifest.version
		module_lib_name = ('lib%s.a' % module_id).lower()
		# check first in the local project
		local_module_lib = os.path.join(project_dir, 'modules', 'iphone', module_lib_name)
		local = False
		if os.path.exists(local_module_lib):
			module_lib_search_path.append([module_lib_name, local_module_lib])
			local = True
			log("[INFO] Detected (local) third-party module: %s" % (local_module_lib))
		else:
			if module.lib is None:
				module_lib_path = module.get_resource(module_lib_name)
				log("[ERROR] Third-party module: %s/%s missing library at %s" % (module_id, module_version, module_lib_path))
				sys.exit(1)
			module_lib_search_path.append([module_lib_name, os.path.abspath(module.lib).rsplit('/',1)[0]])
			log("[INFO] Detected third-party module: %s/%s" % (module_id, module_version))

		if not local:
			# copy module resources
			img_dir = module.get_resource('assets', 'images')
			if os.path.exists(img_dir):
				dest_img_dir = os.path.join(assets_dest_dir, 'modules', module_id, 'images')
				if not os.path.exists(dest_img_dir):
					os.makedirs(dest_img_dir)
				module_asset_dirs.append([img_dir, dest_img_dir])

			# copy in any module assets
			module_assets_dir = module.get_resource('assets')
			if os.path.exists(module_assets_dir):
				module_dir = os.path.join(assets_dest_dir, 'modules', module_id)
				module_asset_dirs.append([module_assets_dir, module_dir])

	return module_lib_search_path, module_asset_dirs

def link_modules(modules, name, proj_dir, relative=False):
	if len(modules)>0:
		from pbxproj import PBXProj
		proj = PBXProj()
		xcode_proj = os.path.join(proj_dir,'%s.xcodeproj'%name,'project.pbxproj')
		current_xcode = open(xcode_proj).read()
		for tp in modules:
			proj.add_static_library(tp[0], tp[1], relative)
		out = proj.parse(xcode_proj)
		# since xcode changes can be destructive, only write as necessary (if changed)
		if current_xcode!=out:
			xo = open(xcode_proj, 'w')
			xo.write(out)
			xo.close()

def create_info_plist(tiapp, template_dir, project_dir, output):
	def write_info_plist(infoplist_tmpl):
		name = tiapp.properties['name']
		appid = tiapp.properties['id']

		plist = codecs.open(infoplist_tmpl, encoding='utf-8').read()
		plist = plist.replace('__PROJECT_NAME__',name)
		plist = plist.replace('__PROJECT_ID__',appid)
		plist = plist.replace('__URL__',appid)
		urlscheme = name.replace('.','_').replace(' ','').lower()
		plist = plist.replace('__URLSCHEME__',urlscheme)
		if tiapp.has_app_property('ti.facebook.appid'):
			fbid = tiapp.get_app_property('ti.facebook.appid')
			plist = plist.replace('__ADDITIONAL_URL_SCHEMES__', '<string>fb%s</string>' % fbid)
		else:
			plist = plist.replace('__ADDITIONAL_URL_SCHEMES__','')
		pf = codecs.open(output,'w', encoding='utf-8')
		pf.write(plist)
		pf.close()

	# if the user has a Info.plist in their project directory, consider
	# that a custom override
	infoplist_tmpl = os.path.join(project_dir,'Info.plist')
	if os.path.exists(infoplist_tmpl):
		shutil.copy(infoplist_tmpl,output)
	else:
		infoplist_tmpl = os.path.join(template_dir,'Info.plist')
		write_info_plist(infoplist_tmpl)

def write_debugger_plist(debughost, debugport, debugairkey, template_dir, debuggerplist):
	debugger_tmpl = os.path.join(template_dir,'debugger.plist')
	plist = codecs.open(debugger_tmpl, encoding='utf-8').read()
	if debughost:
		plist = plist.replace('__DEBUGGER_HOST__',debughost)
		plist = plist.replace('__DEBUGGER_PORT__',debugport)
	else:
		plist = plist.replace('__DEBUGGER_HOST__','')
		plist = plist.replace('__DEBUGGER_PORT__','')
	if debugairkey:
		plist = plist.replace('__DEBUGGER_AIRKEY__',debugairkey)
	else:
		plist = plist.replace('__DEBUGGER_AIRKEY__','')		

	tempfile = debuggerplist+'.tmp'
	pf = codecs.open(tempfile,'w',encoding='utf-8')
	pf.write(plist)
	pf.close()

	if os.path.exists(debuggerplist):
		changed = not filecmp.cmp(tempfile, debuggerplist, shallow=False)
	else:
		changed = True

	shutil.move(tempfile, debuggerplist)

	return changed

def install_default(image, project_dir, template_dir, dest):
	project_resources = os.path.join(project_dir, 'Resources')
	platform_resources = os.path.join(project_resources, 'iphone')
	template_resources = os.path.join(template_dir, 'resources')

	if image is not None:
		graphic_path = os.path.join(platform_resources,image)
	else:
		graphic_path = os.path.join(template_resources, image)

	if not os.path.exists(graphic_path):
		graphic_path = os.path.join(project_resources,image)
		if not os.path.exists(graphic_path):
			graphic_path = os.path.join(template_resources,image)
	if os.path.exists(graphic_path):
		dest_graphic_path = os.path.join(dest,image)
		if os.path.exists(dest_graphic_path):
			os.remove(dest_graphic_path)
		shutil.copy(graphic_path, dest)

def install_logo(tiapp, applogo, project_dir, template_dir, dest):
	# copy over the appicon
	if applogo==None and tiapp.properties.has_key('icon'):
		applogo = tiapp.properties['icon']

	install_default(applogo, project_dir, template_dir, dest)

def install_defaults(project_dir, template_dir, dest):
	for graphic in os.listdir(os.path.join(template_dir, 'resources')):
		install_default(graphic, project_dir, template_dir, dest)

def fix_xcode_script(content,script_name,script_contents):
	# fix up xcode compile scripts in build phase
	start = 0
	while start >= 0:
		start = content.find("name = \"%s\";" % script_name, start)
		if start > 0:
			begin = content.find("shellScript = ",start)
			if begin > 0:
				end = content.find("};",begin+1)
				if end > 0:
					before = content[0:begin+15]
					after = content[end:]
					script = "%s\";\n                " % script_contents
					content = before + script + after
					start = begin
	return content

SPLICE_START_MARKER="TI_AUTOGEN_BEGIN"
SPLICE_END_MARKER="TI_AUTOGEN_END"

def splice_code(file, section, replacement):
	if not os.path.exists(file):
		return False

	with open(file, 'r') as fd:
		contents = fd.read()

		# want to preserve this as part of the preamble
		start_search = "//##%s %s" % (SPLICE_START_MARKER, section)
		start_marker = contents.find(start_search)
		if start_marker == -1:
			return False

		end_marker = contents.find("//##%s %s" % (SPLICE_END_MARKER, section), start_marker)
		if end_marker == -1:
			print "[ERROR] Couldn't splice section %s in %s: No end marker" % (section, file)
			return False

		preamble = contents[0:start_marker+len(start_search)] + "\n"
		appendix = contents[end_marker:]

		new_contents = preamble + replacement + appendix

	if contents != new_contents:
		with open(file, 'w') as fd:
			fd.write(new_contents)
			return True

	return False
