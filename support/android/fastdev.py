#
# A custom server that speeds up development time in Android significantly
#
import os, sys, optparse
import tcpserver, urllib
import simplejson, threading
import SocketServer, socket, struct, codecs

support_android_dir = os.path.dirname(os.path.abspath(__file__))
support_dir = os.path.dirname(support_android_dir)
sys.path.append(support_dir)

import tiapp

server = None

def pack_int(i):
	return struct.pack("!i", i)

def send_tokens(socket, *tokens):
	buffer = pack_int(len(tokens))
	for token in tokens:
		buffer += pack_int(len(token))
		buffer += token
	socket.send(buffer)

utf8_codec = codecs.lookup("utf-8")

"""
A handler for fastdev requests.

The fastdev server uses a simple binary protocol comprised of messages and tokens.

Without a valid handshake, no requests will be processed.
Currently supported commands are:
	- "handshake" <guid> : Application handshake
	- "script-handshake" <guid> : Script control handshake
	- "get" <Resources relative path> : Get the contents of a file from the Resources folder
	- "kill-app" : Kills the connected app's process
	-"shutdown" : Shuts down the server

Right now the VFS rules for "get" are:
- Anything under "Resources" is served as is
- Anything under "Resources/android" overwrites anything under "Resources" (and is mapped to the root)
"""
class FastDevHandler(SocketServer.BaseRequestHandler):
	resources_dir = None
	handshake = None
	app_handler = None

	def recv_int(self):
		data = self.request.recv(4)
		if not data: return None
		return struct.unpack("!i", data)[0]

	def handle(self):
		self.valid_handshake = False
		while True:
			token_count = self.recv_int()
			if token_count == None: break
			tokens = []
			for i in range(0, token_count):
				length = self.recv_int()
				data = self.request.recv(length)
				tokens.append(data)

			command = tokens[0]
			if command == "handshake":
				FastDevHandler.app_handler = self
				self.handle_handshake(tokens[1])
			elif command == "script-handshake":
				self.handle_handshake(tokens[1])
			else:
				if not self.valid_handshake:
					self.send_tokens("Invalid Handshake")
					break
				if command == "get":
					self.handle_get(tokens[1])
				elif command == "kill-app":
					self.handle_kill_app()
					break
				elif command == "shutdown":
					self.handle_shutdown()
					break

	def handle_handshake(self, handshake):
		if handshake == self.handshake:
			self.send_tokens("OK")
			self.valid_handshake = True
		else:
			self.send_tokens("Invalid Handshake")

	def handle_get(self, relative_path):
		android_path = os.path.join(self.resources_dir, 'android', relative_path)
		path = os.path.join(self.resources_dir, relative_path)
		if os.path.exists(android_path):
			self.send_file(android_path)
		elif os.path.exists(path):
			self.send_file(path)
		else:
			self.send_tokens("NOT_FOUND")

	def send_tokens(self, *tokens):
		send_tokens(self.request, *tokens)

	def send_file(self, path):
		buffer = open(path, 'r').read()
		self.send_tokens(buffer)

	def handle_kill_app(self):
		if FastDevHandler.app_handler != None:
			FastDevHandler.app_handler.send_tokens("kill")
			self.send_tokens("OK")
		else:
			self.send_tokens("App not connected")

	def handle_shutdown(self):
		self.send_tokens("OK")
		server.shutdown()

class ThreadingTCPServer(SocketServer.ThreadingMixIn, tcpserver.TCPServer): pass

class FastDevRequest(object):
	def __init__(self, dir, options):
		self.lock_file = get_lock_file(dir, options)
		if not os.path.exists(self.lock_file):
			print >>sys.stderr, "Error: No Fastdev Servers found. " \
				"The lock file at %s does not exist, you either need to run \"stop\" " \
				"within your Titanium project or specify the lock file with -l <lock file>" \
				% self.lock_file
			sys.exit(1)
	
		f = open(self.lock_file, 'r')
		self.data = simplejson.loads(f.read())
		f.close()

		self.port = self.data["port"]
		self.app_guid = self.data["app_guid"]

		self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		self.socket.connect(("", self.port))
		send_tokens(self.socket, "script-handshake", self.app_guid)

	def send(self, *tokens):
		send_tokens(self.socket, *tokens)
		response = self.socket.recv(1024)
		return response

	def close(self):
		self.socket.close()

def get_lock_file(dir, options):
	lock_file = options.lock_file
	if lock_file == None:
		lock_file = os.path.join(dir, ".fastdev.lock")
	return lock_file

def start_server(dir, options):
	xml = tiapp.TiAppXML(os.path.join(dir, "tiapp.xml"))
	app_id = xml.properties["id"]
	app_guid = xml.properties["guid"]

	lock_file = get_lock_file(dir, options)
	if os.path.exists(lock_file):
		print "Fastdev server already running for %s" % app_id
		sys.exit(0)

	resources_dir = os.path.join(dir, 'Resources')
	FastDevHandler.resources_dir = resources_dir
	FastDevHandler.handshake = app_guid

	global server
	server = ThreadingTCPServer(("", int(options.port)), FastDevHandler)
	port = server.server_address[1]
	print "Serving up files for %s at 0.0.0.0:%d from %s" % (app_id, port, dir)

	f = open(lock_file, 'w+')
	f.write(simplejson.dumps({
		"ip": "0.0.0.0",
		"port": port,
		"dir": dir,
		"app_id": app_id,
		"app_guid": app_guid
	}))
	f.close()

	try:
		server.serve_forever()
	except KeyboardInterrupt, e:
		print "Terminated"

	print "Fastdev Server Stopped."
	os.unlink(lock_file)

def stop_server(dir, options):
	request = FastDevRequest(dir, options)
	print request.send("shutdown")
	request.close()

	print "Fastdev server for %s stopped." % request.data["app_id"]

def kill_app(dir, options):
	request = FastDevRequest(dir, options)
	print request.send("kill-app")
	request.close()

	print "Killed app %s." % request.data["app_id"]

def main():
	usage = """Usage: %prog [command] [options] [app-dir]

Supported Commands:
	start		start the fastdev server
	kill-app	kill the app connected to this fastdev server
	stop		stop the fastdev server
"""
	parser = optparse.OptionParser(usage)
	parser.add_option('-p', '--port', dest='port',
		help='port to bind the server to [default: first available port]', default=0)
	parser.add_option('-t', '--timeout', dest='timeout',
		help='Timeout in seconds before the Fastdev server shuts itself down when it hasn\'t received a request [default: %default]',
		default=15*60)
	parser.add_option('-l', '--lock-file', dest='lock_file',
		help='Path to the server lock file [default: app-dir/.fastdev.lock]',
		default=None)
	(options, args) = parser.parse_args()

	if len(args) == 0:
		parser.error("Required command missing (\"start\" or \"stop\")")
		sys.exit(1)

	command = args[0]

	dir = os.getcwd()
	if len(args) > 1:
		dir = os.path.expanduser(args[1])

	dir = os.path.abspath(dir)

	if command == "start":
		if not os.path.exists(os.path.join(dir, "tiapp.xml")):
			parser.error("Directory is not a Titanium Project: %s" % dir)
			sys.exit(1)
		start_server(dir, options)
	elif command == "stop":
		stop_server(dir, options)
	elif command == "kill-app":
		kill_app(dir, options)

if __name__ == "__main__":
	main()