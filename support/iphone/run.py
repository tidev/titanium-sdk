import os,subprocess,types,sys
from tools import ensure_dev_path

def run(args,ignore_error=False,debug=True,out=None):
	ensure_dev_path(debug)
	if debug:
		print "[DEBUG] executing command: %s" % " ".join(args)
		sys.stdout.flush()
	proc = subprocess.Popen(args, stderr=subprocess.STDOUT, stdout=subprocess.PIPE)
	results = ''
	errors = '';
	rc = None
	while True:
		for line in proc.stdout.readlines():
			line = unicode(line, 'utf-8')
			if out!=None:
				out.write(line)
				out.flush()
			if debug:
				s = line.strip()
				if s!='':
					if s.startswith("["):
						print s
					else:		
						print "[DEBUG] %s" % s
					sys.stdout.flush()
			results+=line
			# Imperfect, but better than nothing.
			if line.count('error:')!=0:
				errors+=line
			# Catch undefined symbol/linker errors
			if line.count('{standard input}')!=0:
				errors+=line
		rc = proc.poll()
		if rc!=None: break
	if rc!=0:
		if out!=None: out.write("EXIT CODE WAS: %d\n" % rc)
		if not ignore_error:
			print '\n'.join(["[ERROR] %s" % line for line in errors.split('\n')])
			if debug: print "[ERROR] exitcode was: %d" % rc
			sys.exit(rc)
		else:
			return None
	return results	
