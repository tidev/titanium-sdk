var harnessGlobal = new Object();

harnessGlobal.common = require("common");
harnessGlobal.common.init(harnessGlobal);

harnessGlobal.util = require("util");
harnessGlobal.util.init(harnessGlobal);

harnessGlobal.suites = [
	//{name: "analytics"},
	{name: "blob"},
	{name: "buffer"},
	{name: "codec"},
	//{name: "console"},
	//{name: "database"},
	//{name: "facebook"},
	//{name: "filesystem/filesystem"},
	//{name: "media/media"},
	//{name: "json"},
	//{name: "jss/jss"},
	{name: "kroll"},
	{name: "locale"},
	//{name: "network_httpclient"},
	//{name: "network"},
	//{name: "network_socket"},
	//{name: "network_socket_tcp"},
	{name: "platform"},
	{name: "properties"},
	//{name: "stream"},
	{name: "titanium"}
	//{name: "ui/ui"}
	//{name: "ui_2dMatrix"},
	//{name: "ui_clipboard"},
	//{name: "ui_controls"},
	//{name: "yahoo"}
]

harnessGlobal.socketPort = 40404;
harnessGlobal.common.connectToDriver();
