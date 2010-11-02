#!/usr/bin/env python

import os, sys, shutil, platform, subprocess


def run(args,env=None,cwd=None):
	return subprocess.call(args, cwd=cwd)
	#args = [arg.replace(" ", "\\ ") for arg in args]
	#p = subprocess.Popen(" ".join(args), cwd=cwd, shell=True)
	#return os.waitpid(p.pid, 0)

contents_dir = os.path.dirname(os.path.abspath(__file__))

manifest = os.path.join(contents_dir,'manifest')
manifest_cmdline = os.path.join(contents_dir,'manifest_cmdline')
manifest_backup = os.path.join(contents_dir,'manifest_backup')

shutil.copy(manifest, manifest_backup)
shutil.copy(manifest_cmdline, manifest)

open(os.path.join(contents_dir, '.installed'),'w').write('#')

exe = None
if platform.system() == "Windows":
	exe = os.path.join(contents_dir, 'Drillbit.exe')
elif platform.system() == "Darwin":
	exe = os.path.join(contents_dir, 'MacOS', 'Drillbit')
else:
	exe = os.path.join(contents_dir, 'Drillbit')

args = [exe]
args.extend(sys.argv[1:])
run(args, cwd=os.getcwd())

shutil.copy(manifest_backup, manifest)
