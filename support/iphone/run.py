import os,subprocess,types,sys

def run(args,ignore_error=False,debug=True,out=None):
	if debug:
		print "[DEBUG] executing command: %s" % " ".join(args)
		sys.stdout.flush()
	proc = subprocess.Popen(args, stderr=subprocess.STDOUT, stdout=subprocess.PIPE)
	results = ''
	rc = None
	while True:
		rc = proc.poll()
		if rc!=None: break
		line = proc.stdout.readline()
		if line:
			if out!=None:
				out.write(line)
				out.flush()
			if debug:
				s = line.strip()
				if s!='': 	
					print "[DEBUG] %s" % s
					sys.stdout.flush()
			results+=line
	if rc!=0 and not ignore_error:
		if out!=None: out.write("EXIT CODE WAS: %d\n" % rc)
		if debug: print "[ERROR] exitcode was: %d" % rc
		sys.exit(rc)
	return results	
