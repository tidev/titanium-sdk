/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

Titanium.fileSystemProxy = window.TitaniumFilesystem;

// we have to wrap the returned file object from Filesystem
// since he has optional parameters on some of his methods
// and the JNI bridge requires exact parameters or it will no-op
TitaniumFile = function(f) //Note: Not implemented on iPhone yet
{
	this.proxy = f;
};
/**
 * @tiapi(method = true,name=Filesystem.File.isFile,since=0.4) Checks whether a file object references a file
 * @tiresult[boolean] true if the File object references a file; otherwise, false.
 *
 */
TitaniumFile.prototype.isFile = function()
{
	return Titanium.checked(this.proxy.call("isFile"));
};
/**
 * @tiapi(method = true,name=Filesystem.File.isDirectory,since=0.4) Checks whether a file object references a directory
 * @tiresult[boolean] true if the File object references a directory; otherwise, false.
 *
 */TitaniumFile.prototype.isDirectory = function()
{
	return Titanium.checked(this.proxy.call("isDirectory"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.isHidden,since=0.4) Checks whether a file or directory is hidden
 * @tiresult[boolean] true if the file or directory is hidden, false if otherwise
 */
TitaniumFile.prototype.isHidden = function()
{
	return Titanium.checked(this.proxy.call("isHidden"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.isSymbolicLink,since=0.4) Checks whether the File object references a symbolic link
 * @tiresult[boolean] true if the File object references a symbolic link, false if otherwise
 */
TitaniumFile.prototype.isSymbolicLink = function()
{
	return Titanium.checked(this.proxy.call("isSymbolicLink"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.isExecutable,since=0.4) Checks whether a file is an executable file
 * @tiresult[boolean] true if the file is an executable file, false if otherwise
 */
TitaniumFile.prototype.isExecutable = function()
{
	return Titanium.checked(this.proxy.call("isExecutable"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.isReadonly,since=0.4) Checks whether a file or directory is read-only
 * @tiresult[boolean] true if the file or directory is read-only, false if otherwise
 */
TitaniumFile.prototype.isReadonly = function()
{
	return Titanium.checked(this.proxy.call("isReadonly"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.isWritable,since=0.4) Checks whether a file or directory is writeable
 * @tiresult[boolean] true if the file or directory is writeable, false if otherwise
 */
TitaniumFile.prototype.isWriteable = function()
{
	return Titanium.checked(this.proxy.call("isWriteable"));
};
/**
 * @tiapi(method=True,name=Filesystem.File.resolve,since=0.4) Resolves a File object to a file path
 * @tiarg[string,path] path to resolve
 * @tiresult[File] a file object referencing a path. (Not implemented in Android, beta)
 */
TitaniumFile.prototype.resolve = function()
{
	return Titanium.checked(this.proxy.call("resolve"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.read,since=0.4) Returns one line (separated by line ending) from a file
 * @tiresult[string] a string of data from the file
 */
TitaniumFile.prototype.read = function()
{
	return Titanium.checked(this.proxy.call("read"));
};
/**
 * @tiapi (method=True,name=Filesystem.File.write,since=0.4) Writes data to the file
 * @tiarg [string, data] data to write to file
 * @tiarg [boolean, append] true if write should append to file.
 */
TitaniumFile.prototype.write = function(data,append)
{
	append = typeof(append)=='undefined' ? false : append;
	var p = this.proxy;
	p.pushString(data);
	p.pushBoolean(append);
	return Titanium.checked(p.call("write"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.readline,since=0.4) Returns one line (separated by line ending) from a file
 * @tiresult[string] A string of data from the file
 */
TitaniumFile.prototype.readLine = function()
{
	return Titanium.checked(this.proxy.call("readLine"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.copy,since=0.4) Copies a file to a specified location
 * @tiarg[string,destination] destination to copy to
 * @tiresult[boolean] true if the file was successfully copied; otherwise false.
 */
TitaniumFile.prototype.copy = function(destination)
{
	var p = this.proxy;
	p.pushString(destination);
	return Titanium.checked(p.call("copy"));
};
/**
 * @tiapi(method=True,name=Filesystem.File.move,since=0.4) Moves a file to a specified location
 * @tiarg[string,destination]destination to move to.
 * @tiresult[boolean] true if the file was successfully moved; otherwise, false.
 */
TitaniumFile.prototype.move = function(destination)
{
	var p = this.proxy;
	p.pushString(destination);
	return Titanium.checked(p.call("move"));
};
/**
 * @tiapi(method=True,name=Filesystem.File.rename,since=0.4) Renames a file
 * @tiarg[string,destination] new name
 * @tiresult[boolean] true if the file was successfully renamed; otherwise, false.
 */
TitaniumFile.prototype.rename = function(destination)
{
	var p = this.proxy;
	p.pushString(destination);
	return Titanium.checked(p.call("rename"));
};
/**
 * @tiapi(method=True,name=Filesystem.File.createDirectory,since=0.4) Creates a new directory
 * @tiresuls[boolean] true if the directory was successfully created; otherwise, false.
 */
TitaniumFile.prototype.createDirectory = function(recursive)
{
	recursive = typeof(recursive)=='undefined' ? false : recursive;
	var p = this.proxy;
	p.pushBoolean(recursive);
	return Titanium.checked(p.call("createDirectory"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.deleteDirectory,since=0.4) Deletes a directory
 * @tiresult[boolean] true if the file was successfully deleted; otherwise, false.
 */
TitaniumFile.prototype.deleteDirectory = function(recursive)
{
	recursive = typeof(recursive)=='undefined' ? false : recursive;
	var p = this.proxy;
	p.pushBoolean(recursive);
	return Titanium.checked(p.call("deleteDirectory"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.deleteFile,since=0.4) Deletes a file
 * @tiresult[boolean] true if the file was successfully deleted; otherwise, false
 */
TitaniumFile.prototype.deleteFile = function()
{
	return Titanium.checked(this.proxy.call("deleteFile"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.getDirectoryListing,since=0.4) Returns a list containing the names of items in a directory.
 * @tiresult[list] a list of File items inside the directory. (Not implemented in Android beta)
 */
TitaniumFile.prototype.getDirectoryListing = function()
{
	return Titanium.checked(this.proxy.call("getDirectoryListing"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.getParent,since=0.4) Returns the parent directory of a file or directory
 * @tiresult[File] the parent directory
 */
TitaniumFile.prototype.getParent = function()
{
	return Titanium.checked(this.proxy.call("getParent"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.exists,since=0.4) Checks whether a file or directory exists in the users system
 * @tiresult[boolean] true if the file or directory exists; otherwise false.
 */
TitaniumFile.prototype.exists = function()
{
	return Titanium.checked(this.proxy.call("exists"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.createTimestamp,since=0.4) Returns the created timestamp of a file or directory
 * @tiresult[double] the creation time of the file or directory.
 */
TitaniumFile.prototype.createTimestamp = function()
{
	return Titanium.checked(this.proxy.call("createTimestamp"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.modificationTimestamp,since=0.4) Returns the last modified timestamp of a file or directory
 * @tiresult[double] the modification time of the file or directory.
 */
TitaniumFile.prototype.modificationTimestamp = function()
{
	return Titanium.checked(this.proxy.call("modificationTimestamp"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.name,since=0.4) Returns the name of a file or directory
 * @tiresult[string] the name of the file or directory
 */
TitaniumFile.prototype.name = function()
{
	return Titanium.checked(this.proxy.call("name"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.extension,since=0.4) Returns the extension of a file
 * @tiresult[string] extension of the file
 */
TitaniumFile.prototype.extension = function()
{
	return Titanium.checked(this.proxy.call("extension"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.size,since=0.4) Returns the size of the file in bytes
 * @tiresult[double] the size of a file or directory in bytes
 */
TitaniumFile.prototype.size = function()
{
	return Titanium.checked(this.proxy.call("size"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.nativePath,since=0.4) Returns the full native path of a file or directory
 * @tiresult[string] full native path of the file or directory
 */
TitaniumFile.prototype.nativePath = function()
{
	return Titanium.checked(this.proxy.call("nativePath"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.spaceAvailable,since=0.4) Returns the space available on the filesystem
 * @tiresult[double] the space available on the filesystem (Not implemented in Android beta)
 */
TitaniumFile.prototype.spaceAvailable = function()
{
	return Titanium.checked(this.proxy.call("spaceAvailable"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.setExecutable,since=0.4) Makes the file or directory executable
 * @tiresult[boolean] returns true if the operation was successful; otherwise, false
 */
TitaniumFile.prototype.setExecutable = function()
{
	return Titanium.checked(this.proxy.call("setExecutable"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.setReadonly,since=0.4) Makes the file or directory readonly
 * @tiresult[boolean] returns true if the operation was successful; otherwise, false
 */
TitaniumFile.prototype.setReadonly = function()
{
	return Titanium.checked(this.proxy.call("setReadonly"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.setWriteable,since=0.4) Makes the file or directory writeable
 * @tiresult[boolean] returns true if the operation was successful; otherwise, false
 */
TitaniumFile.prototype.setWriteable = function()
{
	return Titanium.checked(this.proxy.call("setWriteable"));
};
/**
 * @tiapi(method=true,name=Filesystem.File.toString,since=0.4) Get the string representation
 * @tiresult[string] returns string representation of the file or directory
 */
TitaniumFile.prototype.toString = function()
{
	return String(Titanium.checked(this.proxy.call("toString")));
};

TitaniumFile.createBlob = function(native) {
	var f = new TitaniumFile(native);
	function TitaniumBlob(f) {this.obj = f;}
	TitaniumBlob.prototype = f;

	var b = new TitaniumBlob(f);
	b.__defineGetter__("url", function() {
		return this.nativePath();
	});

	return b;
};

//TODO Doc
Filestream = function(proxy) {
	this.proxy = proxy;
};

// close, isOpen, open, read, readLine, ready, write, writeLine

Filestream.prototype.close = function() {
	Titanium.checked(this.proxy.call("close"));
};

Filestream.prototype.isOpen = function() {
	return Titanium.checked(this.proxy.call("isOpen"));
};

Filestream.prototype.open = function(mode,binary) {
	var p = this.proxy;
	p.pushInteger(mode);
	p.pushBoolean(binary);
	Titanium.checked(p.call("open"));
};

Filestream.prototype.read = function() {
	return Titanium.checked(this.proxy.call("read"));
};

Filestream.prototype.readLine = function() {
	return Titanium.checked(this.proxy.call("readLine"));
};

Filestream.prototype.write = function(value, append) {
	var p = this.proxy;
	if (isUndefined(append)) {
		append = false;
	}
	if(value instanceof TitaniumMemoryBlob) {
		Titanium.API.debug("Write As Blob");
		p.pushInteger(value.getKey());
		p.pushBoolean(append);
		Titanium.checked(p.call("write"));
	} else {
		Titanium.API.debug("Write As String");
		p.pushString(value);
		p.pushBoolean(append);
		Titanium.checked(p.call("write"));
	}
};

Filestream.prototype.writeLine = function(value) {
	var p = this.proxy;
	p.pushString(value);
	Titanium.checked(this.proxy.call("writeLine"));
};

Titanium.Filesystem = {
	/**
	 * @tiapi(method=true,name=Filesystem.createTempFile, since=0.4) Creates a temporary file
	 * @tiresult[File] a File object referencing a temporary file.
	 */
	createTempFile : function() {
		return new TitaniumFile(Titanium.fileSystemProxy.createTempFile());
	},
	/**
	 * @tiapi(method=true,name=Filesystem.createTempDirectory, since=0.4) Creates a temporary directory
	 * @tiresult[File] a File object referencing a temporary directory.
	 */
	createTempDirectory : function() {
		return new TitaniumFile(Titanium.fileSystemProxy.createTempDirectory());
	},
	/**
	 * @tiapi(method=true,name=Filesystem.getFile,since=0.4) Returns a file path, optionally joining multiple arguments together in an OS specific way
	 * @tiarg[string,arguments] one or more path segments to join.
	 * @tiresult[File] a File reference the file
	 */
	getFile : function() {
		var parts = [];
		for(i=0; i < arguments.length; i++) {
			parts.push(String(arguments[i]));
		}
		return new TitaniumFile(Titanium.fileSystemProxy.getFile(parts));
	},
	/**
	 * @tiapi(method=true,name=Filesystem.getFileStream,since=0.4) Returns a file stream, optionally joining multiple arguments together in an OS specific way
	 * @tiarg[string,arguments] one or more path segments to join.
	 * @tiresult[FileStream] a FileStream reference the file
	 */
	getFileStream : function() {
		var parts = [];

		for(i=0; i < arguments.length; i++) {
			parts.push(String(arguments[i]));
		}
		return new Filestream(Titanium.fileSystemProxy.getFileStream(parts));
	},
	/**
	 * @tiapi(method=true,name=Filesystem.getApplicationDirectory,since=0.4) Returns file object pointing to the applications installation directory
	 * @tiresult[File] a file object pointing to the application's directory.
	 */
	getApplicationDirectory : function() {
		return new TitaniumFile(Titanium.fileSystemProxy.getApplicationDirectory());
	},
	/**
	 * @tiapi(method=true,name=Filesystem.getApplicationDataDirectory,since=0.4) Returns a file object pointing to the application's data directory.
	 * @tiresult[File] the file object to the application data directory.
	 */
	getApplicationDataDirectory : function(priv) {
		priv = typeof(priv)=='undefined' ? false : priv;
		return new TitaniumFile(Titanium.fileSystemProxy.getApplicationDataDirectory(priv));
	},
	/**
	 * @tiapi(method=true,name=Filesystem.getResourcesDirectory,since=0.4) Returns a file object pointing to the application's Resources.
	 * @tiresult[File] the file object to the application Resources directory.
	 */
	getResourcesDirectory : function() {
		return new TitaniumFile(Titanium.fileSystemProxy.getResourcesDirectory());
	},
	getUserDirectory : function() {
		return new TitaniumFile(Titanium.fileSystemProxy.getUserDirectory());
	},
	/**
	 * @tiapi(method=true,name=Filesystem.getLineEnding,since=0.4) Returns the line ending for this system.
	 * @tiresult[string] the end of line character(s).
	 */
	getLineEnding : function() {
		return "\n";
	},
	/**
	 * @tiapi(method=true,name=Filesystem.getSeparator,since=0.4) Returns the PATH separator for this system.
	 * @tiresult[string] the PATH separator.
	 */
	getSeparator : function() {
		return ";";
	},
	getRootDirectories : function() {
		var results = Titanium.fileSystemProxy.getRootDirectories();
		if (results)
		{
			var files = [];
			for (var c=0;c<results.length;c++)
			{
				files[c].push(new TitaniumFile(results[c]));
			}
			return files;
		}
		return [];
	},
	asyncCopy : function() {
		return Titanium.fileSystemProxy.asyncCopy(arguments);
	},

	// mobile specific APIS
	/**
	 * @tiapi(method=true,name=Filesystem.isExternalStoragePresent,since=0.4) Check to see if external media storage exists
	 * @tiresult[boolean] true if external storage is present; otherwise, false.
	 */
	isExternalStoragePresent: function() {
		return Titanium.fileSystemProxy.isExternalStoragePresent();
	},

	/**
	 * @tiapi(property=true,name=Filesystem.MODE_READ,since=0.7.0) Flag for opening in read mode.
	 */
	MODE_READ : 0,
	/**
	 * @tiapi(property=true,name=Filesystem.MODE_WRITE,since=0.7.0) Flag for opening in write mode.
	 */
	MODE_WRITE : 1,
	/**
	 * @tiapi(property=true,name=Filesystem.MODE_APPEND,since=0.7.0) Flag for opening in append mode.
	 */
	MODE_APPEND : 2
};

Filestream.prototype.MODE_READ = Titanium.Filesystem.MODE_READ;
Filestream.prototype.MODE_WRITE = Titanium.Filesystem.MODE_WRITE;
Filestream.prototype.MODE_APPEND = Titanium.Filesystem.MODE_APPEND;
