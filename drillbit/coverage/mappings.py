""" A map that normalizes type names that are slightly different
between the different sources """
types = {
	"Titanium.Activity": "Titanium.Android.Activity",
	"Titanium.Intent": "Titanium.Android.Intent",
	"Titanium.Service": "Titanium.Android.Service",
	"Titanium.Menu": "Titanium.Android.Menu",
	"Titanium.MenuItem": "Titanium.Android.MenuItem",
	"Titanium.R": "Titanium.Android.R",
	"Android.Notification": "Titanium.Android.Notification",
	"Analytics": "Titanium.Analytics",
	"Titanium.Database.TiDatabase": "Titanium.Database.DB",
	"Titanium.TiDatabase": "Titanium.Database.DB",
	"Titanium.Database.TiResultSet": "Titanium.Database.ResultSet",
	"Titanium.TiResultSet": "Titanium.Database.ResultSet",
	"Titanium.File": "Titanium.Filesystem.File",
	"Titanium.TiFile": "Titanium.Filesystem.File",
	"Titanium.Stream.FileStream": "Titanium.Filesystem.FileStream",
	"Titanium.Socket.TCP": "Titanium.Network.Socket.TCP",
	"Titanium.TiBlob": "Titanium.Blob",
	"Titanium.BlobStream": "Titanium.Stream.BlobStream",
	"Titanium.BufferStream": "Titanium.Stream.BufferStream",
	"Titanium.TiView": "Titanium.UI.View",
	"Titanium.TiWindow": "Titanium.UI.Window",
	"Titanium.Ti2DMatrix": "Titanium.UI.2DMatrix",
	"Titanium.Attr": "Titanium.XML.Attr",
	"Titanium.CharacterData": "Titanium.XML.CharacterData",
	"Titanium.CDATASection": "Titanium.XML.CDATASection",
	"Titanium.Document": "Titanium.XML.Document",
	"Titanium.Element": "Titanium.XML.Element",
	"Titanium.NamedNodeMap": "Titanium.XML.NamedNodeMap",
	"Titanium.Node": "Titanium.XML.Node",
	"Titanium.NodeList": "Titanium.XML.NodeList",
	"Titanium.DOMImplementation": "Titanium.XML.DOMImplementation",
	"Titanium.String": "String",
	"Titanium.Text": "Titanium.XML.Text",
	"Titanium.XPathNodeList": "Titanium.XML.XPathNodeList",
	"Titanium.ProcessingInstruction": "Titanium.XML.ProcessingInstruction",
	"Titanium.Kroll.Kroll": "Titanium.Proxy",
	"Titanium.Map.View": "Titanium.Map.MapView",
	"Titanium.DisplayCaps": "Titanium.Platform.DisplayCaps",
	"Titanium.FileStream": "Titanium.Filesystem.FileStream",
	"Titanium.UI.TiDialog": "Titanium.UI.AlertDialog",

	# iOS mappings
	"Titanium.Appi.OS": "Titanium.App.iOS",
	"Titanium.Appi.OSBackgroundService": "Titanium.App.iOS.BackgroundService",
	"Titanium.Appi.OSLocalNotification": "Titanium.App.iOS.LocalNotification",
	"Titanium.D.OMAttr": "Titanium.XML.Attr",
	"Titanium.D.OMDocument": "Titanium.XML.Document",
	"Titanium.D.OMElement": "Titanium.XML.Element",
	"Titanium.D.OMNamedNodeMap": "Titanium.XML.NamedNodeMap",
	"Titanium.D.OMNode": "Titanium.XML.Node",
	"Titanium.D.OMNodeList": "Titanium.XML.NodeList",
	"Titanium.D.OMTextNode": "Titanium.XML.Text",
	"Titanium.Data.Stream": "Titanium.IOStream",
	"Titanium.Database": "Titanium.Database.DB",
	"Titanium.Network.Socket.": "Titanium.Network.TCPSocket",

	# This type does both buffers and blobs, we're missing part of the coverage
	"Titanium.Data.Stream": "Titanium.Stream.BufferStream",
	"Titanium.": "Titanium.Proxy",
	"Titanium.2.DMatrix": "Titanium.UI.2DMatrix",
	"Titanium.D.Matrix": "Titanium.UI.2DMatrix"
}

def mapType(t):
	if t in types:
		return types[t]
	return t
