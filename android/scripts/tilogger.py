from __future__ import with_statement
import os, sys

class TiLogger:
	ERROR = 0
	WARN = 1
	INFO = 2
	DEBUG = 3
	TRACE = 4
	def __init__(self, logfile, level=TRACE, output_stream=sys.stdout):
		self.level = level
		self.output_stream = output_stream
		global _logfile
		_logfile = logfile
		if _logfile is not None:
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

	def _level_prefix(self, level):
		return {
				TiLogger.ERROR: "ERROR",
				TiLogger.WARN: "WARN",
				TiLogger.INFO: "INFO",
				TiLogger.DEBUG: "DEBUG",
				TiLogger.TRACE: "TRACE"
				}[level];

	def _log(self, msg, level):
		global _logfile
		if self.level >= level:
			prefix = self._level_prefix(level)
			line = "[%s] %s" % (prefix, msg)
			print >> self.output_stream, line
			self.output_stream.flush()
			sys.stdout.flush()
			if _logfile is not None:
				try:
					with open(_logfile, 'a') as f:
						f.write("%s\n" % line)
				except:
					print "[ERROR] error writing to log %s: %s" % (_logfile, sys.exc_info()[0])

	def info(self, msg):
		self._log(msg, TiLogger.INFO)

	def debug(self, msg):
		self._log(msg, TiLogger.DEBUG)

	def warn(self, msg):
		self._log(msg, TiLogger.WARN)

	def trace(self, msg):
		self._log(msg, TiLogger.TRACE)

	def error(self, msg):
		self._log(msg, TiLogger.ERROR)

# if __name__ == "__main__":
	# _logfile = ''
	# print "[DEBUG] TiLogger initialized"
