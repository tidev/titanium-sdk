import os,subprocess,types,sys

def run(args,ignore_error=False,debug=True):
	if debug:
		print "[DEBUG] executing command: %s" % " ".join(args)
		sys.stdout.flush()
	(so,se) = subprocess.Popen(args, stderr=subprocess.PIPE, stdout=subprocess.PIPE).communicate()
	if type(se)!=types.NoneType and len(se)>0:
		if not ignore_error:
			sys.stderr.write("[ERROR] %s" % str(se))
	return so
