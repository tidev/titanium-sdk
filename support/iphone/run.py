import os,subprocess,types,sys

def run(args,ignore_error=False,debug=True):
	if debug:
		print "[DEBUG] executing command: %s" % " ".join(args)
		sys.stdout.flush()
	proc = subprocess.Popen(args, stderr=subprocess.STDOUT, stdout=subprocess.PIPE)
	results = ''
	while proc.poll()==None:
		line = proc.stdout.readline()
		if line:
			if debug:
				s = line.strip()
				if s!='': 	
					print "[DEBUG] %s" % s
					sys.stdout.flush()
			results+=line
	return results	
