#
# BaseServer and TCPServer copied from Python 2.6 to be compatible w/ Python 2.5
#
import os, sys, socket
import select, threading, urllib

class BaseServer:

	"""Base class for server classes.

	Methods for the caller:

	- __init__(server_address, RequestHandlerClass)
	- serve_forever(poll_interval=0.5)
	- shutdown()
	- handle_request()  # if you do not use serve_forever()
	- fileno() -> int   # for select()

	Methods that may be overridden:

	- server_bind()
	- server_activate()
	- get_request() -> request, client_address
	- handle_timeout()
	- verify_request(request, client_address)
	- server_close()
	- process_request(request, client_address)
	- close_request(request)
	- handle_error()

	Methods for derived classes:

	- finish_request(request, client_address)

	Class variables that may be overridden by derived classes or
	instances:

	- timeout
	- address_family
	- socket_type
	- allow_reuse_address

	Instance variables:

	- RequestHandlerClass
	- socket

	"""

	timeout = None

	def __init__(self, server_address, RequestHandlerClass):
		"""Constructor.  May be extended, do not override."""
		self.server_address = server_address
		self.RequestHandlerClass = RequestHandlerClass
		self.__is_shut_down = threading.Event()
		self.__serving = False

	def server_activate(self):
		"""Called by constructor to activate the server.

		May be overridden.

		"""
		pass

	def serve_forever(self, poll_interval=0.5):
		"""Handle one request at a time until shutdown.

		Polls for shutdown every poll_interval seconds. Ignores
		self.timeout. If you need to do periodic tasks, do them in
		another thread.
		"""
		self.__serving = True
		self.__is_shut_down.clear()
		while self.__serving:
			# XXX: Consider using another file descriptor or
			# connecting to the socket to wake this up instead of
			# polling. Polling reduces our responsiveness to a
			# shutdown request and wastes cpu at all other times.
			r, w, e = select.select([self], [], [], poll_interval)
			if r:
				self._handle_request_noblock()
		self.__is_shut_down.set()

	def shutdown(self):
		"""Stops the serve_forever loop.

		Blocks until the loop has finished. This must be called while
		serve_forever() is running in another thread, or it will
		deadlock.
		"""
		self.__serving = False
		self.__is_shut_down.wait()

	def shutdown_noblock(self):
		""" Stops the server_forever loop but without blocking """
		self.__serving = False

	def is_serving(self):
		return self.__serving

	# The distinction between handling, getting, processing and
	# finishing a request is fairly arbitrary.  Remember:
	#
	# - handle_request() is the top-level call.  It calls
	#   select, get_request(), verify_request() and process_request()
	# - get_request() is different for stream or datagram sockets
	# - process_request() is the place that may fork a new process
	#   or create a new thread to finish the request
	# - finish_request() instantiates the request handler class;
	#   this constructor will handle the request all by itself

	def handle_request(self):
		"""Handle one request, possibly blocking.

		Respects self.timeout.
		"""
		# Support people who used socket.settimeout() to escape
		# handle_request before self.timeout was available.
		timeout = self.socket.gettimeout()
		if timeout is None:
			timeout = self.timeout
		elif self.timeout is not None:
			timeout = min(timeout, self.timeout)
		fd_sets = select.select([self], [], [], timeout)
		if not fd_sets[0]:
			self.handle_timeout()
			return
		self._handle_request_noblock()

	def _handle_request_noblock(self):
		"""Handle one request, without blocking.

		I assume that select.select has returned that the socket is
		readable before this function was called, so there should be
		no risk of blocking in get_request().
		"""
		try:
			request, client_address = self.get_request()
		except socket.error:
			return
		if self.verify_request(request, client_address):
			try:
				self.process_request(request, client_address)
			except:
				self.handle_error(request, client_address)
				self.close_request(request)

	def handle_timeout(self):
		"""Called if no new request arrives within self.timeout.

		Overridden by ForkingMixIn.
		"""
		pass

	def verify_request(self, request, client_address):
		"""Verify the request.  May be overridden.

		Return True if we should proceed with this request.

		"""
		return True

	def process_request(self, request, client_address):
		"""Call finish_request.

		Overridden by ForkingMixIn and ThreadingMixIn.

		"""
		self.finish_request(request, client_address)
		self.close_request(request)

	def server_close(self):
		"""Called to clean-up the server.

		May be overridden.

		"""
		pass

	def finish_request(self, request, client_address):
		"""Finish one request by instantiating RequestHandlerClass."""
		self.RequestHandlerClass(request, client_address, self)

	def close_request(self, request):
		"""Called to clean up an individual request."""
		pass

	def handle_error(self, request, client_address):
		"""Handle an error gracefully.  May be overridden.

		The default is to print a traceback and continue.

		"""
		print '-'*40
		print 'Exception happened during processing of request from',
		print client_address
		import traceback
		traceback.print_exc() # XXX But this goes to stderr!
		print '-'*40

class TCPServer(BaseServer):

	"""Base class for various socket-based server classes.

	Defaults to synchronous IP stream (i.e., TCP).

	Methods for the caller:

	- __init__(server_address, RequestHandlerClass, bind_and_activate=True)
	- serve_forever(poll_interval=0.5)
	- shutdown()
	- handle_request()  # if you don't use serve_forever()
	- fileno() -> int   # for select()

	Methods that may be overridden:

	- server_bind()
	- server_activate()
	- get_request() -> request, client_address
	- handle_timeout()
	- verify_request(request, client_address)
	- process_request(request, client_address)
	- close_request(request)
	- handle_error()

	Methods for derived classes:

	- finish_request(request, client_address)

	Class variables that may be overridden by derived classes or
	instances:

	- timeout
	- address_family
	- socket_type
	- request_queue_size (only for stream sockets)
	- allow_reuse_address

	Instance variables:

	- server_address
	- RequestHandlerClass
	- socket

	"""

	address_family = socket.AF_INET

	socket_type = socket.SOCK_STREAM

	request_queue_size = 5

	allow_reuse_address = False

	def __init__(self, server_address, RequestHandlerClass, bind_and_activate=True):
		"""Constructor.  May be extended, do not override."""
		BaseServer.__init__(self, server_address, RequestHandlerClass)
		self.socket = socket.socket(self.address_family,
									self.socket_type)
		if bind_and_activate:
			self.server_bind()
			self.server_activate()

	def server_bind(self):
		"""Called by constructor to bind the socket.

		May be overridden.

		"""
		if self.allow_reuse_address:
			self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
		self.socket.bind(self.server_address)
		self.server_address = self.socket.getsockname()

	def server_activate(self):
		"""Called by constructor to activate the server.

		May be overridden.

		"""
		self.socket.listen(self.request_queue_size)

	def server_close(self):
		"""Called to clean-up the server.

		May be overridden.

		"""
		self.socket.close()

	def fileno(self):
		"""Return socket file number.

		Interface required by select().

		"""
		return self.socket.fileno()

	def get_request(self):
		"""Get the request and client address from the socket.

		May be overridden.

		"""
		return self.socket.accept()

	def close_request(self, request):
		"""Called to clean up an individual request."""
		request.close()

	def finish(self):
		pass