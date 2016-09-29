#!/usr/bin/env python
# deltafy
# - a simple library that keeps track of modified/created/removed files and directories in a file tree
# 
# Author: Marshall Culpepper
# Licensed under the Apache Public License v2 (see LICENSE.txt)

import os, sys, platform, sqlite3, time, stat
from datetime import datetime, timedelta

class DeltaList(list):
	def has_path(self, path):
		for delta in self:
			if delta.get_path() == path: return True
		return False

	def is_updated(self, path):
		for delta in self:
			if delta.get_path() == path:
				return delta.get_status() == Delta.MODIFIED or \
					delta.get_status() == Delta.CREATED
		return False

class Delta:
	CREATED = 0
	MODIFIED = 1
	DELETED = 2

	def __init__(self, path, timestamp, status):
		self.path = path
		self.timestamp = timestamp
		self.status = status
	
	def __str__(self):
		return "%s [%s] @ %s" % (self.get_status_str(), self.get_path(), self.get_timestamp())
	
	def get_path(self):
		return self.path

	def get_status(self):
		return self.status

	def get_status_str(self):
		if self.status == self.CREATED: return "CREATED"
		elif self.status == self.MODIFIED: return "MODIFIED"
		else: return "DELETED"

	def get_timestamp(self):
		return self.timestamp

home = os.path.expanduser('~')
if platform.system() == 'Windows':
	home = os.environ['USERPROFILE']

class Deltafy:
	db_home = os.path.join(home, '.deltafy')
	db_path = os.path.join(db_home, 'deltas')

	@classmethod
	def get_database_path(cls):
		return cls.db_path

	@classmethod
	def set_database_path(cls, path):
		cls.db_path = path

	@classmethod
	def get_modified_datetime(cls, path):
		return datetime.fromtimestamp(os.stat(path).st_mtime)

	@classmethod
	def compare_datetime(cls, dt1, dt2, mindelta=None):
		delta = dt1 - dt2
		if mindelta is None:
			mindelta = timedelta(microseconds=0)
		if delta < mindelta: return -1
		elif delta > mindelta: return 1
		else: return 0

	@classmethod
	def compare_paths(cls, path1, path2, mindelta=None):
		time1 = datetime.fromtimestamp(os.stat(path1).st_mtime)
		time2 = datetime.fromtimestamp(os.stat(path2).st_mtime)
		return cls.compare_datetime(time1, time2, mindelta)

	@classmethod
	def needs_update(cls, src_path, dest_path, mindelta=None):
		"checks if dest_path needs to be updated by src_path with a default minimum delta of 1 second"
		if mindelta is None:
			mindelta = timedelta(seconds=1)
		return not os.path.exists(dest_path) or \
			(os.path.exists(src_path) and \
				Deltafy.compare_paths(src_path, dest_path, mindelta) > 0)

	@classmethod
	def needs_update_timestamp(cls, src_path, dest_ts, mindelta=None):
		"checks if dest_ts needs to be updated by src_path with a default minimum delta of 1 second"
		return os.path.exists(src_path) and \
			cls.compare_datetime(cls.get_modified_datetime(src_path), dest_ts, mindelta) > 0

	def __init__(self, dir, include_callback=None):
		self.dir = dir
		self.include_callback = include_callback
		if not os.path.exists(self.db_home):
			os.makedirs(self.db_home)
	
		self.conn = sqlite3.connect(self.db_path, detect_types=sqlite3.PARSE_DECLTYPES)
		self.conn.execute('create table if not exists timestamps (path text, modified timestamp)')
	
	def clear_state(self):
		self.conn.execute('delete from timestamps')
		self.conn.commit()
	
	def get_timestamp(self, path):
		c = self.conn.cursor()
		c.execute('select modified from timestamps where path = ?', (path,))
		row = c.fetchone()
		timestamp = None
		if row is not None and len(row) == 1:
			timestamp = row[0]
		c.close()
		return timestamp
	
	def insert_timestamp(self, path, path_stat):
		timestamp = datetime.fromtimestamp(path_stat.st_mtime)
		self.conn.execute('insert into timestamps(path, modified) values (?, ?)', (path, timestamp))
		self.conn.commit()
		return timestamp

	def update_timestamp(self, path, timestamp):
		self.conn.execute('update timestamps set modified = ? where path = ?', (timestamp, path))
		self.conn.commit()

	def delete_timestamp(self, path):
		self.conn.execute('delete from timestamps where path = ?', (path,))
		self.conn.commit()

	def get_paths(self):
		c = self.conn.cursor()
		c.execute('select path from timestamps')
		rows = c.fetchall()
		paths = [row[0] for row in rows]
		c.close()
		return paths

	def check_delta(self, path, path_stat):
		timestamp = self.get_timestamp(path)
		modified_time = datetime.fromtimestamp(path_stat.st_mtime)
		if timestamp is None:
			timestamp = self.insert_timestamp(path, path_stat)
			return Delta(path, timestamp, Delta.CREATED)
		elif modified_time - timestamp >= timedelta(seconds=1):
			# this needs to be a little fuzzy.
			# windows loses a few microseconds in precision
			self.update_timestamp(path, modified_time)
			return Delta(path, modified_time, Delta.MODIFIED)
		return None

	def scan(self):
		deltas = DeltaList()
		
		# first pass against the filesystem
		self.scan_path(self.dir, deltas)
		
		# second pass check again paths in db
		# to find deleted paths in the filesystem
		for path in self.get_paths():
			if path.startswith(self.dir):
				include_path = True
				if self.include_callback is not None:
					include_path = self.include_callback(path, True)
				if not include_path:
					continue
				
				if not os.path.exists(path):
					self.delete_timestamp(path)
					deltas.append(Delta(path, 0, Delta.DELETED))
		return deltas

	def scan_single_file(self, file):
		return self.check_delta(file, os.stat(file))
	
	def scan_path(self, path, deltas):
		for file in os.listdir(path):
			absolute_path = os.path.join(path, file)
			# reduce to just one stat, major speed up in windows
			path_stat = os.stat(absolute_path)
			if stat.S_ISDIR(path_stat.st_mode):
				include_dir = True
				if self.include_callback is not None:
					include_dir = self.include_callback(absolute_path, False)
				if not include_dir:
					continue
				
				self.scan_path(absolute_path, deltas)
			else:
				include_file = True
				if self.include_callback is not None:
					include_file = self.include_callback(absolute_path, True)
				if not include_file:
					continue
				
				file_delta = self.check_delta(absolute_path, path_stat)
				if file_delta is not None:
					deltas.append(file_delta)
	
if __name__ == "__main__":
	if len(sys.argv) == 1:
		print "Usage: %s <dir>" % sys.argv[0]
		sys.exit(-1)
	
	deltafy = Deltafy(sys.argv[1])
	sys.stdout.write("Initial scan...")
	deltafy.scan()
	print "done\nScanning for changes (Ctrl+C to stop)..."
	while True:
		try:
			time.sleep(1)
			deltas = deltafy.scan()
			for delta in deltas:
				print str(delta)
		except KeyboardInterrupt:
			print "Killed."
			break
