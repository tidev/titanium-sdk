#!/usr/bin/env python
# This server acts as an intermediary between
# an ADB forwarded Titanium application w/ debugging
# and a local debug server that is listening for a connection
# TODO: this will work for on-device debugging

import asyncore
import socket
import sys
import time

def debug(msg):
	print "[DEBUG] "+msg
	sys.stdout.flush()

class AsyncStream(asyncore.dispatcher_with_send):
	def __init__(self, host, attach_host=None, stream=None, retries=10):
		asyncore.dispatcher_with_send.__init__(self)
		self.stream = stream
		self.host = host
		self.attach_host = attach_host
		self.retries = retries
		self.rcvd_handshake = False
		self.create_connection()

	def create_connection(self):
		self.create_socket(socket.AF_INET, socket.SOCK_STREAM)
		self.connect(self.host)

	def attach_local(self):
		if self.attach_host != None and self.stream is None:
			debug('Attaching to local %s port %d' % (self.attach_host[0], self.attach_host[1]))
			self.stream = AsyncStream(self.attach_host, stream=self, retries=0)

	def handle_connect(self):
		debug("Connected to %s port %d" % (self.host[0], self.host[1]))

	def handle_close(self):
		self.close()
		if self.retries > 0 and not self.rcvd_handshake:
			time.sleep(0.5)
			self.retries -= 1
			debug('retrying debugger connection (#%d)' % self.retries)
			self.create_connection()
		else:
			debug('closed from %s port %d' % (self.host[0], self.host[1]))
			self.stream.close()

	def handle_read(self):
		data = self.recv(4096)
		if not data: pass

		if data == 'ti.debugger.handshake':
			self.rcvd_handshake = True
			self.attach_local()
		elif data != '':
			debug('read data: %s' % data)
			self.stream.send(data)

def to_addr(hostport):
	tokens = hostport.split(":")
	return (tokens[0], int(tokens[1]))

def run(local, remote):
	local_addr = to_addr(local)
	remote_addr = to_addr(remote)
	debug("Connecting to remote %s port %d..." % (remote_addr[0], remote_addr[1]))
	AsyncStream(remote_addr, attach_host=local_addr)
	asyncore.loop()

if __name__ == "__main__":
	if len(sys.argv) != 3:
		print "Usage: %s <local host:local port> <remote host:remote port>" % sys.argv[0]
		sys.exit(1)
	run(sys.argv[1], sys.argv[2])