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
	return this.proxy.isFile();
};
/**
 * @tiapi(method = true,name=Filesystem.File.isDirectory,since=0.4) Checks whether a file object references a directory
 * @tiresult[boolean] true if the File object references a directory; otherwise, false.
 *
 */TitaniumFile.prototype.isDirectory = function()
{
	return this.proxy.isDirectory();
};
/**
 * @tiapi(method=true,name=Filesystem.File.isHidden,since=0.4) Checks whether a file or directory is hidden
 * @tiresult[boolean] true if the file or directory is hidden, false if otherwise
 */
TitaniumFile.prototype.isHidden = function()
{
	return this.proxy.isHidden();
};
/**
 * @tiapi(method=true,name=Filesystem.File.isSymbolicLink,since=0.4) Checks whether the File object references a symbolic link
 * @tiresult[boolean] true if the File object references a symbolic link, false if otherwise
 */
TitaniumFile.prototype.isSymbolicLink = function()
{
	return this.proxy.isSymbolicLink();
};
/**
 * @tiapi(method=true,name=Filesystem.File.isExecutable,since=0.4) Checks whether a file is an executable file
 * @tiresult[boolean] true if the file is an executable file, false if otherwise
 */
TitaniumFile.prototype.isExecutable = function()
{
	return this.proxy.isExecutable();
};
/**
 * @tiapi(method=true,name=Filesystem.File.isReadonly,since=0.4) Checks whether a file or directory is read-only
 * @tiresult[boolean] true if the file or directory is read-only, false if otherwise
 */
TitaniumFile.prototype.isReadonly = function()
{
	return this.proxy.isReadonly();
};
/**
 * @tiapi(method=true,name=Filesystem.File.isWritable,since=0.4) Checks whether a file or directory is writeable
 * @tiresult[boolean] true if the file or directory is writeable, false if otherwise
 */
TitaniumFile.prototype.isWriteable = function()
{
	return this.proxy.isWriteable();
};
/**
 * @tiapi(method=True,name=Filesystem.File.resolve,since=0.4) Resolves a File object to a file path
 * @tiarg[string,path] path to resolve
 * @tiresult[File] a file object referencing a path. (Not implemented in Android, beta)
 */
TitaniumFile.prototype.resolve = function()
{
	return this.proxy.resolve();
};
/**
 * @tiapi(method=true,name=Filesystem.File.read,since=0.4) Returns one line (separated by line ending) from a file
 * @tiresult[string] a string of data from the file
 */
TitaniumFile.prototype.read = function()
{
	return this.proxy.read();
};
/**
 * @tiapi (method=True,name=Filesystem.File.write,since=0.4) Writes data to the file
 * @tiarg [string, data] data to write to file
 * @tiarg [boolean, append] true if write should append to file.
 */
TitaniumFile.prototype.write = function(data,append)
{
	append = typeof(append)=='undefined' ? false : append;
	return this.proxy.write(data,append);
};
/**
 * @tiapi(method=true,name=Filesystem.File.readline,since=0.4) Returns one line (separated by line ending) from a file
 * @tiresult[string] A string of data from the file
 */
TitaniumFile.prototype.readLine = function()
{
	return this.proxy.readLine();
};
/**
 * @tiapi(method=true,name=Filesystem.File.copy,since=0.4) Copies a file to a specified location
 * @tiarg[string,destination] destination to copy to
 * @tiresult[boolean] true if the file was successfully copied; otherwise false.
 */
TitaniumFile.prototype.copy = function(destination)
{
	return this.proxy.copy(destination);
};
/**
 * @tiapi(method=True,name=Filesystem.File.move,since=0.4) Moves a file to a specified location
 * @tiarg[string,destination]destination to move to.
 * @tiresult[boolean] true if the file was successfully moved; otherwise, false.
 */
TitaniumFile.prototype.move = function(destination)
{
	return this.proxy.move(destination);
};
/**
 * @tiapi(method=True,name=Filesystem.File.rename,since=0.4) Renames a file
 * @tiarg[string,destination] new name
 * @tiresult[boolean] true if the file was successfully renamed; otherwise, false.
 */
TitaniumFile.prototype.rename = function(destination)
{
	return this.proxy.rename(destination);
};
/**
 * @tiapi(method=True,name=Filesystem.File.createDirectory,since=0.4) Creates a new directory
 * @tiresuls[boolean] true if the directory was successfully created; otherwise, false.
 */
TitaniumFile.prototype.createDirectory = function(recursive)
{
	recursive = typeof(recursive)=='undefined' ? false : recursive;
	return this.proxy.createDirectory(recursive);
};
/**
 * @tiapi(method=true,name=Filesystem.File.deleteDirectory,since=0.4) Deletes a directory
 * @tiresult[boolean] true if the file was successfully deleted; otherwise, false.
 */
TitaniumFile.prototype.deleteDirectory = function(recursive)
{
	recursive = typeof(recursive)=='undefined' ? false : recursive;
	return this.proxy.deleteDirectory(recursive);
};
/**
 * @tiapi(method=true,name=Filesystem.File.deleteFile,since=0.4) Deletes a file
 * @tiresult[boolean] true if the file was successfully deleted; otherwise, false
 */
TitaniumFile.prototype.deleteFile = function()
{
	return this.proxy.deleteFile();
};
/**
 * @tiapi(method=true,name=Filesystem.File.getDirectoryListing,since=0.4) Returns a list containing the names of items in a directory.
 * @tiresult[list] a list of File items inside the directory. (Not implemented in Android beta)
 */
TitaniumFile.prototype.getDirectoryListing = function()
{
	return this.proxy.getDirectoryListing();
};
/**
 * @tiapi(method=true,name=Filesystem.File.getParent,since=0.4) Returns the parent directory of a file or directory
 * @tiresult[File] the parent directory
 */
TitaniumFile.prototype.getParent = function()
{
	return this.proxy.getParent();
};
/**
 * @tiapi(method=true,name=Filesystem.File.exists,since=0.4) Checks whether a file or directory exists in the users system
 * @tiresult[boolean] true if the file or directory exists; otherwise false.
 */
TitaniumFile.prototype.exists = function()
{
	return this.proxy.exists();
};
/**
 * @tiapi(method=true,name=Filesystem.File.createTimestamp,since=0.4) Returns the created timestamp of a file or directory
 * @tiresult[double] the creation time of the file or directory.
 */
TitaniumFile.prototype.createTimestamp = function()
{
	return this.proxy.createTimestamp();
};
/**
 * @tiapi(method=true,name=Filesystem.File.modificationTimestamp,since=0.4) Returns the last modified timestamp of a file or directory
 * @tiresult[double] the modification time of the file or directory.
 */
TitaniumFile.prototype.modificationTimestamp = function()
{
	return this.proxy.modificationTimestamp();
};
/**
 * @tiapi(method=true,name=Filesystem.File.name,since=0.4) Returns the name of a file or directory
 * @tiresult[string] the name of the file or directory
 */
TitaniumFile.prototype.name = function()
{
	return this.proxy.name();
};
/**
 * @tiapi(method=true,name=Filesystem.File.extension,since=0.4) Returns the extension of a file
 * @tiresult[string] extension of the file
 */
TitaniumFile.prototype.extension = function()
{
	return this.proxy.extension();
};
/**
 * @tiapi(method=true,name=Filesystem.File.size,since=0.4) Returns the size of the file in bytes
 * @tiresult[double] the size of a file or directory in bytes
 */
TitaniumFile.prototype.size = function()
{
	return this.proxy.size();
};
/**
 * @tiapi(method=true,name=Filesystem.File.nativePath,since=0.4) Returns the full native path of a file or directory
 * @tiresult[string] full native path of the file or directory
 */
TitaniumFile.prototype.nativePath = function()
{
	return this.proxy.nativePath();
};
/**
 * @tiapi(method=true,name=Filesystem.File.spaceAvailable,since=0.4) Returns the space available on the filesystem
 * @tiresult[double] the space available on the filesystem (Not implemented in Android beta)
 */
TitaniumFile.prototype.spaceAvailable = function()
{
	return this.proxy.spaceAvailable();
};
/**
 * @tiapi(method=true,name=Filesystem.File.setExecutable,since=0.4) Makes the file or directory executable
 * @tiresult[boolean] returns true if the operation was successful; otherwise, false
 */
TitaniumFile.prototype.setExecutable = function()
{
	return this.proxy.setExecutable();
};
/**
 * @tiapi(method=true,name=Filesystem.File.setReadonly,since=0.4) Makes the file or directory readonly
 * @tiresult[boolean] returns true if the operation was successful; otherwise, false
 */
TitaniumFile.prototype.setReadonly = function()
{
	return this.proxy.setReadonly();
};
/**
 * @tiapi(method=true,name=Filesystem.File.setWriteable,since=0.4) Makes the file or directory writeable
 * @tiresult[boolean] returns true if the operation was successful; otherwise, false
 */
TitaniumFile.prototype.setWriteable = function()
{
	return this.proxy.setWriteable();
};
/**
 * @tiapi(method=true,name=Filesystem.File.toString,since=0.4) Makes the file or directory readonly
 * @tiresult[string] returns string representation of the file or directory
 */
TitaniumFile.prototype.toString = function()
{
	return String(this.proxy.toString());
};

TitaniumFile.createBlob = function(native) {
	var f = new TitaniumFile(native);
	function TitaniumBlob(f) {this.obj = f;};
	TitaniumBlob.prototype = f;

	var b = new TitaniumBlob(f);
	b.__defineGetter__("url", function() {
		return this.nativePath();
	});

	return b;
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
	getFile : function(a,b,c,d,e,f,g) {
		var parts = [];
		if (arguments.length>0) parts.push(String(a));
		if (arguments.length>1) parts.push(String(b));
		if (arguments.length>2) parts.push(String(c));
		if (arguments.length>3) parts.push(String(d));
		if (arguments.length>4) parts.push(String(e));
		if (arguments.length>5) parts.push(String(f));
		if (arguments.length>6) parts.push(String(g));
		return new TitaniumFile(Titanium.fileSystemProxy.getFile(parts));
	},
	/**
	 * @tiapi(method=true,name=Filesystem.getFileStream,since=0.4) Returns a file stream, optionally joining multiple arguments together in an OS specific way
	 * @tiarg[string,arguments] one or more path segments to join.
	 * @tiresult[FileStream] a FileStream reference the file
	 */
	getFileStream : function(a,b,c,d,e,f,g) {
		var parts = [];
		if (arguments.length>0) parts.push(String(a));
		if (arguments.length>1) parts.push(String(b));
		if (arguments.length>2) parts.push(String(c));
		if (arguments.length>3) parts.push(String(d));
		if (arguments.length>4) parts.push(String(e));
		if (arguments.length>5) parts.push(String(f));
		if (arguments.length>6) parts.push(String(g));
		return TitaniumFile(Titanium.fileSystemProxy.getFileStream(parts));
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
	getApplicationDataDirectory : function(private) {
		private = typeof(private)=='undefined' ? false : private;
		return new TitaniumFile(Titanium.fileSystemProxy.getApplicationDataDirectory(private));
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
	}
};
