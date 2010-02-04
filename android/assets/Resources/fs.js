var log = function(msg) {
	Ti.API.info(msg);
}

var f1 = Ti.Filesystem.getFile("file1.txt");
log("F1 exists: " + f1.exists());
log("Extension: " + f1.extension());

var f2 = Ti.Filesystem.getFile("app://fs.js");
log("F1 exists: " + f2.exists());
log("Extension: " + f2.extension());
