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

			string command = null;
			int i;

			for (i = 0; i < args.Length; i++) {
				if (command == null) {
					command = args[i];
					if (args[i] == "launch") {
						if (i + 1 < args.Length) {
							string appid = args[++i];
							string version = i + 1 < args.Length ? args[++i] : null;
							return launchApp(appid, version);
						} else {
							return showHelp("Missing app id.");
						}
					}
				}
			}

			if (command != null) {
				return showHelp(String.Format("Invalid command '{0}'", command));
			}

			return showHelp();
		}

		static int launchApp(String appid, String version) {
			String appUserModelId = null;
			var appListKey = Registry.CurrentUser.OpenSubKey("Software\\Classes\\ActivatableClasses\\Package");

			// if we have the version, then this should be simple
			if (version != null) {
				foreach (var appKeyName in appListKey.GetSubKeyNames()) {
					if (appKeyName.IndexOf(appid + "_" + version + "_") == 0) {
						var appKey = appListKey.OpenSubKey(appKeyName);
						var subKey = appKey.OpenSubKey("Server\\App.wwa");
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
							string thisVersion = appKeyName.Substring(p + appid.Length + 1, q);
							if (lastVersion == null || String.Compare(thisVersion, lastVersion, true) > 0) {
								var appKey = appListKey.OpenSubKey(appKeyName);
								var subKey = appKey.OpenSubKey("Server\\App.wwa");
								if (subKey != null) {
									appUserModelId = (String)subKey.GetValue("AppUserModelId");
									lastVersion = thisVersion;
								}
							}
						}
					}
				}
			}

			if (appUserModelId == null) {
				Console.WriteLine("Could not find version " + version + " of application " + appid + " in the registry. Is the application installed?");
				return 1;
			}

			var aam = new ApplicationActivationManager();
			UInt32 id;
			aam.ActivateApplication(appUserModelId, null, ActivateOptions.None, out id);

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
			Console.WriteLine("  launch <appid> [<version>]   Launch a Windows Store app");
			Console.WriteLine("");

			return msg.Length > 0 ? 1 : 0;
		}
	}
}
