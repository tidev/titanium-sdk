using System;
using Microsoft.Win32;

namespace wstool
{
	class wstool
	{
		static int Main(string[] args) {
			if (args.Length == 0) {
				return showHelp();
			}

			string command = args[0];

			if (command == "launch") {
				string appid    = null;
				string version  = null;
				string windowsAppId = null;
				for (var i = 1; i < args.Length; i++)  {
					string option = args[i++];
					if (args.Length <= i || args[i].StartsWith("--")) {
						return showHelp(String.Format("Invalid option for command '{0}'", command));
					}
					switch (option) {
						case "--appid":
							appid = args[i];
							break;
						case "--version":
							version = args[i];
							break;
						case "--windowsAppId":
							windowsAppId = args[i];
							break;
						default:
							return showHelp(String.Format("Invalid option for command '{0}'", command));
					}

				}
				if (appid == null) {
					return showHelp(String.Format("Invalid option for command '{0}'", command));
				}

				return launchApp(appid, version, windowsAppId);
			}

			return showHelp(String.Format("Invalid command '{0}'", command));
		}

		static int launchApp(String appid, String version, String windowsAppId) {
			string appUserModelId = null;
			string windowsAppName = null;
			var appListKey = Registry.CurrentUser.OpenSubKey("Software\\Classes\\ActivatableClasses\\Package");

			// if we have the version, then this should be simple
			if (version != null) {
				foreach (var appKeyName in appListKey.GetSubKeyNames()) {
					if (appKeyName.IndexOf(appid + "_" + version + "_") == 0) {
						// Save the name, in case sub key doesn't exist
						windowsAppName = appKeyName;
						var appKey = appListKey.OpenSubKey(appKeyName);
						var appClassKey = appKey.OpenSubKey("ActivatableClassId\\App");
						if (appClassKey == null)
						{
							appClassKey = appKey.OpenSubKey("ActivatableClassId\\App.wwa");
						}
						String serverId = (String)appClassKey.GetValue("Server");
						var subKey = appKey.OpenSubKey("Server\\" + serverId);
						appUserModelId = (String)subKey.GetValue("AppUserModelId");
						break;
					}
				}
			} else {
				// no version, so find all with the appid and the largest version number
				string lastVersion = null;
				foreach (var appKeyName in appListKey.GetSubKeyNames()) {
					int p = appKeyName.IndexOf(appid + "_");
					if (p == 0) {
						int q = appKeyName.IndexOf("_", p + 1);
						if (q != -1) {
							string thisVersion = appKeyName.Substring(p + 1, q);
							if (lastVersion == null || String.Compare(thisVersion, lastVersion, true) > 0) {
								// Save the name, in case sub key doesn't exist
								windowsAppName = appKeyName;
								var appKey = appListKey.OpenSubKey(appKeyName);
								var appClassKey = appKey.OpenSubKey("ActivatableClassId\\App");
								if (appClassKey == null)
								{
									appClassKey = appKey.OpenSubKey("ActivatableClassId\\App.wwa");
								}
								if (appClassKey != null)
								{
									String serverId = (String)appClassKey.GetValue("Server");
									var subKey = appKey.OpenSubKey("Server\\" + serverId);
									if (subKey != null)
									{
										appUserModelId = (String)subKey.GetValue("AppUserModelId");
										lastVersion = thisVersion;
									}
								}
							}
						}
					}
				}
			}

			// If there's no Server entry in the registry...we still have a way when Windows Store application id is provided
			// You can find Windows Store application id in the "Application Id" value in the AppxManifest.xml.
			if (appUserModelId == null && windowsAppName != null) {

				// Extract "family name" from the entry name, by removing version and archtecture string
				// For example: Microsoft.SkypeApp_3.2.1.0_x86__kzf8qxf38zg5c -> Microsoft.SkypeApp_kzf8qxf38zg5c
				var first = windowsAppName.IndexOf("_");
				var last  = windowsAppName.LastIndexOf("_");
				var familyName = windowsAppName.Substring(0, first) + "_" + windowsAppName.Substring(last + 1);

				// we try to do our best...many apps are actually using "App" for application id
				if (windowsAppId == null) {
					windowsAppId = "App";
				}

				// then we conbine it with the Windows Store application id...wish it generates valid one
				appUserModelId = String.Format("{0}!{1}", familyName, windowsAppId);
			}

			if (appUserModelId == null) {
				Console.WriteLine("Could not find version " + version + " of application " + appid + " in the registry. Is the application installed?");
				return 1;
			}

			try {
				var aam = new ApplicationActivationManager();
				UInt32 id;
				aam.ActivateApplication(appUserModelId, null, ActivateOptions.None, out id);
				Console.WriteLine(id);
			} catch (System.Runtime.InteropServices.COMException) {
				Console.WriteLine("Could not find version " + version + " of application " + appid + " in the registry. Is the application installed?");
				return 1;
			}

			return 0;
		}

		static int showHelp(string msg = "") {
			Console.WriteLine("Appcelerator Windows Store App Tool v1.0\n");

			if (msg.Length > 0) {
				Console.WriteLine("ERROR: " + msg + "\n");
			}

			Console.WriteLine("Usage:");
			Console.WriteLine("  wstool <command> [options]");
			Console.WriteLine("");
			Console.WriteLine("Commands:");
			Console.WriteLine("  launch --appid <Titanium application id> [--appversion <version>] [--windowsAppId <Windows Store application id>] Launch a Windows Store app");
			Console.WriteLine("");

			return msg.Length > 0 ? 1 : 0;
		}
	}
}
