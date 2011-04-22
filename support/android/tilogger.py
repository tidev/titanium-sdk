from __future__ import with_statement
import os, sys

class TiLogger:
	def __init__(self, logfile):
		global _logfile
		_logfile = logfile
		logfolder = os.path.dirname(_logfile)
		try:
			if not os.path.exists(logfolder):
				os.mkdir(logfolder)
		except:
			print "[ERROR] error creating log folder %s: %s" % (logfolder, sys.exc_info()[0])
		try:
			with open(_logfile, 'w') as f:
				f.write('Logfile initialized\n')
		except:
			print "[ERROR] error initializing (writing to) log file %s: %s" % (_logfile, sys.exc_info()[0])
		
		self.info("logfile = " + logfile)
			
	def info(self, msg):
		global _logfile
		print "[INFO] "+msg
		sys.stdout.flush()
		try:
			with open(_logfile, 'a') as f:
				f.write('[INFO] %s\n' % msg)
		except:
			print "[ERROR] error writing to log %s: %s" % (_logfile, sys.exc_info()[0])

	def debug(self, msg):
		global _logfile
		print "[DEBUG] "+msg
		sys.stdout.flush()
		try:
			with open(_logfile, 'a') as f:
				f.write('[DEBUG] %s\n' % msg)
		except:
			print "[ERROR] error writing to log %s: %s" % (_logfile, sys.exc_info()[0])

	def warn(self, msg):
		global _logfile
		print "[WARN] "+msg
		sys.stdout.flush()
		try:
			with open(_logfile, 'a') as f:
				f.write('[WARN] %s\n' % msg)
		except:
			print "[ERROR] error writing to log %s: %s" % (_logfile, sys.exc_info()[0])

	def trace(self, msg):
		global _logfile
		print "[TRACE] "+msg
		sys.stdout.flush()
		try:
			with open(_logfile, 'a') as f:
				f.write('[TRACE] %s\n' % msg)
		except:
			print "[ERROR] error writing to log %s: %s" % (_logfile, sys.exc_info()[0])

	def error(self, msg):
		global _logfile
		print "[ERROR] "+msg
		sys.stdout.flush()
		try:
			with open(_logfile, 'a') as f:
				f.write('[ERROR] %s\n' % msg)
		except:
			print "[ERROR] error writing to log %s: %s" % (_logfile, sys.exc_info()[0])

# if __name__ == "__main__":
	# _logfile = ''
	# print "[DEBUG] TiLogger initialized"