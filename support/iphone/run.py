import os,subprocess,types,sys

def run(args,ignore_error=False,debug=False):
	if debug:
		print " ".join(args)
	(so,se) = subprocess.Popen(args, stderr=subprocess.PIPE, stdout=subprocess.PIPE).communicate()
	if type(se)!=types.NoneType and len(se)>0:
		if not ignore_error:
			sys.stderr.write("[ERROR] %s" % str(se))
	return so
