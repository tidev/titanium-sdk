import os,subprocess,types,sys

def run(args,ignore_error=False,debug=True):
	if debug:
		print "[DEBUG] executing command: %s" % " ".join(args)
		sys.stdout.flush()
	proc = subprocess.Popen(args, stderr=subprocess.PIPE, stdout=subprocess.PIPE)
	results = ''
	while proc.poll()==None:
		line = proc.stdout.readline()
		if debug:
			print "[DEBUG] %s" % line.strip()
		results+=line
	return results	
