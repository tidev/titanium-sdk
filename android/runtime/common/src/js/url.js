/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * urlParse taken and modified from node.js, Copyright Ryan Dahl
 */

// This file contains a parsing helper and "toFilePath" for Javascript

var protocolPattern = /^([a-z0-9]+:)/,
	portPattern = /:[0-9]+$/,
	nonHostChars = ["/", "?", ";", "#"],
	hostlessProtocol = {
		"file":true,
		"file:":true,
		"appdata":true,
		"appdata:":true,
		"app":true,
		"app:":true,
		"appdata-private":true,
		"appdata-private:":true
	},
	slashedProtocol = {
		"http":true, "https":true, "ftp":true, "gopher":true, "file":true,
		"http:":true, "https:":true, "ftp:":true, "gopher:":true, "file:":true,
		"app":true, "appdata":true, "appdata-private":true,
		"app:":true, "appdata:":true, "appdata-private:":true
	},
	path = require("path"); // internal module, guaranteed to be loaded already.

var tiProtocols = ["app", "app:", "appdata", "appdata:", "appdata-private", "appdata-private:"];
var filePathProtocols = ["appdata", "appdata:", "appdata-private", "appdata-private:", "file", "file:"];
var assetPathProtocols = ["app", "app:"];

function urlParse (url/*, parseQueryString*/) {
	if (url && typeof(url) === "object" && url.href) return url;

	var out = { href : url },
		rest = url;

	var proto = protocolPattern.exec(rest);
	if (proto) {
		proto = proto[0];
		out.protocol = proto;

		rest = rest.substr(proto.length);
	}

	out.filePath = filePathProtocols.indexOf(proto) >= 0;
	out.assetPath = assetPathProtocols.indexOf(proto) >= 0;

	// figure out if it's got a host
	var slashes = rest.substr(0, 2) === "//";

	// hack to normalize titanium URLs that don't follow the spec
	if (slashes && rest.charAt(3) != "/" && tiProtocols.indexOf(proto) >= 0) {
		rest = rest.substr(2);
		out.slashes = true;
	}

	if (slashes && !(proto && hostlessProtocol[proto])) {
		rest = rest.substr(2);
		out.slashes = true;
	}
	if (!hostlessProtocol[proto] && (slashes || (proto && !slashedProtocol[proto]))) {
		// there's a hostname.
		// the first instance of /, ?, ;, or # ends the host.
		// don't enforce full RFC correctness, just be unstupid about it.
		var firstNonHost = -1;
		for (var i = 0, l = nonHostChars.length; i < l; i ++) {
			var index = rest.indexOf(nonHostChars[i]);
			if (index !== -1 && (firstNonHost < 0 || index < firstNonHost)) firstNonHost = index;
		}
		if (firstNonHost !== -1) {
			out.host = rest.substr(0, firstNonHost);
			rest = rest.substr(firstNonHost);
		} else {
			out.host = rest;
			rest = "";
		}

		// pull out the auth and port.
		var p = parseHost(out.host);
		var keys = Object.keys(p);
		for (var i = 0, l = keys.length; i < l; i++) {
			var key = keys[i];
			out[key] = p[key];
		}
		// we've indicated that there is a hostname, so even if it's empty, it has to be present.
		out.hostname = out.hostname || "";
	}

	// now rest is set to the post-host stuff.
	// chop off from the tail first.
	var hash = rest.indexOf("#");
	if (hash !== -1) {
		// got a fragment string.
		out.hash = rest.substr(hash);
		rest = rest.slice(0, hash);
	}
	var qm = rest.indexOf("?");
	if (qm !== -1) {
		out.search = rest.substr(qm);
		out.query = rest.substr(qm+1);
		/* disabled for now if (parseQueryString) {
			out.query = querystring.parse(out.query);
		}*/
		rest = rest.slice(0, qm);
	}
	if (rest) out.pathname = rest;

	return out;
}
exports.parse = urlParse;

var appId, extStorage, privateAppData;

function urlToFilePath(url) {
	var Ti = global.Titanium;

	if (!url) {
		return null;
	}

	var data = url;
	if (typeof(url) === "string" || !("filePath" in url)) {
		data = urlParse(url);
	}

	if (!data.filePath) {
		return null;
	}

	if (!appId) {
		appId = Ti.App.id;
	}

	if (data.protocol === "appdata:") {
		if (!extStorage) {
			extStorage = Ti.Android.Environment.externalStorageDirectory;
		}
		return path.join(extStorage, appId, data.pathname);

	} else if (data.protocol == "appdata-private:") {
		if (!privateAppData) {
			privateAppData = Ti.UI.currentWindow.activity.getDir("appdata", 0);
		}
		return path.join(privateAppData, appId, data.pathname);

	} else if (data.protocol == "file:") {
		return data.pathname;
	}
}
exports.toFilePath = urlToFilePath;

function toAssetPath(url) {
	if (!url) {
		return null;
	}

	var data = url;
	if (typeof(url) === "string" || !("filePath" in url)) {
		data = urlParse(url);
	}

	if (!data.assetPath) {
		return null;
	}

	return path.join("Resources", data.pathname);
}
exports.toAssetPath = toAssetPath;

function isUrl(url) {
	var data = urlParse(url);
	return "protocol" in data;
}
exports.isUrl = isUrl;

function resolve(baseUrl, pathOrUrl) {
	var urlData = urlParse(pathOrUrl);

	if (!("protocol" in urlData)) {
		// this is a path, not a URL
		var callerData = urlParse(baseUrl);
		var parentDir = path.dirname(callerData.pathname);
		var newPath = path.join(parentDir, pathOrUrl);
		if (pathOrUrl.length > 0 && pathOrUrl.charAt(0) === "/") {
			// absolute path
			newPath = pathOrUrl.substring(1);
		}

		return urlParse(callerData.protocol + "//" + newPath);
	}
	return urlData;
}
exports.resolve = resolve;