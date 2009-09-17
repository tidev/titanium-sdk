import os,subprocess,types,sys

def run(args,ignore_error=False):
	(stdout,stderr) = subprocess.Popen(args, stderr=subprocess.PIPE, stdout=subprocess.PIPE).communicate()
	if type(stderr)!=types.NoneType and len(stderr)>0:
		if not ignore_error:
			sys.stderr.write("[ERROR] %s" % stderr)
	return stdout
