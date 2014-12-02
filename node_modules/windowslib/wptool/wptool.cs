using System;
using System.Reflection;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Globalization;
using Microsoft.SmartDevice.Connectivity.Interface;
using Microsoft.SmartDevice.MultiTargeting.Connectivity;

namespace wptool
{
	class wptool
	{
		static int Main(string[] args) {
			if (args.Length == 0) {
				return showHelp();
			}

			int localeId = CultureInfo.CurrentUICulture.LCID;
			MultiTargetingConnectivity multiTargetingConnectivity = new MultiTargetingConnectivity(localeId);
			Collection<ConnectableDevice> devices = multiTargetingConnectivity.GetConnectableDevices(false);

			string command = null;
			string wpsdk = null;
			int udid = -1;
			int i;

			for (i = 0; i < args.Length; i++) {
				if (args[i] == "--wpsdk") {
					if (i + 1 < args.Length) {
						wpsdk = args[++i];
					}
				} else if (command == null) {
					command = args[i];
					if (command == "connect" && i + 1 < args.Length) {
						try {
							udid = int.Parse(args[++i]);
						} catch (Exception ex) {
							return showHelp(String.Format("Invalid device UDID '{0}'", args[i]));
						}
					}
				}
			}

			if (wpsdk == null) {
				wpsdk = "8.1";
			} else {
				// trim whatever version number they pass in to 2 digits
				string[] parts = wpsdk.Split(new Char [] {'.'});
				wpsdk = "";
				i = 0;
				while (i < 2) {
					if (wpsdk.Length > 0) {
						wpsdk += '.';
					}
					if (i < parts.Length) {
						wpsdk += parts[i];
					} else {
						wpsdk += '0';
					}
					i++;
				}
			}

			List<ConnectableDevice> deviceList = new List<ConnectableDevice>();
			i = 0;
			foreach (ConnectableDevice dev in multiTargetingConnectivity.GetConnectableDevices(false)) {
				if (!dev.IsEmulator() || (wpsdk == "8.0" && dev.IsLegacyEmulator()) || (wpsdk != "8.0" && !dev.IsLegacyEmulator())) {
					deviceList.Add(dev);
					i++;
				}
			}

			if (command == "enumerate") {
				int id = 0;
				int j = 0;

				Console.WriteLine("{");

				Console.WriteLine("\t\"devices\": [");
				foreach (ConnectableDevice dev in deviceList) {
					if (!dev.IsEmulator()) {
						if (j > 0) {
							Console.WriteLine(",");
						}
						Console.WriteLine("\t\t{\n");
						Console.WriteLine("\t\t\t\"name\": \"" + dev.Name.Replace("\"", "\\\"") + "\",");
						Console.WriteLine("\t\t\t\"udid\": " + id + ",");
						Console.WriteLine("\t\t\t\"index\": " + id + ",");
						Console.WriteLine("\t\t\t\"wpsdk\": null");
						Console.Write("\t\t}");
						j++;
					}
					id++;
				}
				Console.WriteLine("\n\t],");

				id = 0;
				j = 0;

				Console.WriteLine("\t\"emulators\": [");
				foreach (ConnectableDevice dev in deviceList) {
					if (dev.IsEmulator()) {
						if (j > 0) {
							Console.WriteLine(",");
						}
						Console.WriteLine("\t\t{\n");
						Console.WriteLine("\t\t\t\"name\": \"" + dev.Name.Replace("\"", "\\\"") + "\",");
						Console.WriteLine("\t\t\t\"udid\": \"" + wpsdk.Replace('.', '-') + "-" + id + "\",");
						Console.WriteLine("\t\t\t\"index\": " + id + ",");
						Console.WriteLine("\t\t\t\"wpsdk\": \"" + wpsdk + "\"");
						Console.Write("\t\t}");
						j++;
					}
					id++;
				}
				Console.WriteLine("\n\t]");
				
				Console.WriteLine("}");
				return 0;
			}

			if (command == "connect") {
				// validate the id
				if (udid == -1) {
					return showHelp("Missing device/emulator UDID");
				} if (udid < 0 || udid >= deviceList.Count) {
					return showHelp(String.Format("Invalid device UDID '{0:D}'", udid));
				}

				ConnectableDevice connectableDevice = deviceList[udid];
				try {
					IDevice device = connectableDevice.Connect();
					ISystemInfo systemInfo = device.GetSystemInfo();
					Version version = new Version(systemInfo.OSMajor, systemInfo.OSMinor);
					Console.WriteLine("{\"success\":true}");
					return 0;
				} catch (Exception ex) {
					Console.WriteLine("{");
					Console.WriteLine("\t\"success\": false,");
					Console.WriteLine("\t\"message\": \"" + ex.Message.Trim().Replace("\"", "\\\"") + "\"");
					Console.WriteLine("}");
					return 1;
				}
			}

			if (command != null) {
				return showHelp(String.Format("Invalid command '{0}'", command));
			}

			return showHelp();
		}

		static int showHelp(string msg = "") {
			Console.WriteLine("Appcelerator Windows Phone Tool v1.0\n");

			if (msg.Length > 0) {
				Console.WriteLine("ERROR: " + msg + "\n");
			}

			Console.WriteLine("Usage:");
			Console.WriteLine("  wptool <command> [--wpsdk <ver>] [options]");
			Console.WriteLine("");
			Console.WriteLine("Commands:");
			Console.WriteLine("  enumerate       List all devices and emulators");
			Console.WriteLine("  connect <udid>  Connects to the specified device");
			Console.WriteLine("");
			Console.WriteLine("Options:");
			Console.WriteLine(" --wpsdk <ver>    The version of the Windows Phone SDK emulators to use (e.g. '8.0' or '8.1')");
			Console.WriteLine("                  Defaults to non-legacy, non-Windows Phone 8 (e.g. 8.1)");
			Console.WriteLine("");

			return msg.Length > 0 ? 1 : 0;
		}
	}
}
