import os,subprocess,types,sys

def run(args,ignore_error=False,debug=True, ignore_output=False):
	if debug:
		print "[DEBUG] %s"%(" ".join(args))
		sys.stdout.flush()
	if ignore_output:
		subprocess.Popen(args, stderr=subprocess.PIPE, stdout=subprocess.PIPE).wait()
		return None
	(so,se) = subprocess.Popen(args, stderr=subprocess.PIPE, stdout=subprocess.PIPE).communicate()
	if type(se)!=types.NoneType and len(se)>0:
		if not ignore_error:
			if args[0].find('adb')!=-1 and str(se).find(' bytes in ')!=-1:
				# adb emits data about compile into stderr so we ignore it in special case
				pass
			else:
				sys.stderr.write("[ERROR] %s %s" % (args[0],str(se)))
				sys.stderr.flush()
				return None
	return so