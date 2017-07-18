using System;
using System.Reflection;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Globalization;
using Microsoft.SmartDevice.Connectivity.Interface;
using Microsoft.SmartDevice.MultiTargeting.Connectivity;
using System.Net;

namespace wptool
{
	class wptool
	{
		static int Main(string[] args) {
			if (args.Length == 0) {
				return showHelp();
			}

			string command = null;
			string wpsdk = null;
			string udid = null;
			Guid appid = Guid.Empty;
			int i;

			for (i = 0; i < args.Length; i++) {
				if (args[i] == "--wpsdk") {
					if (i + 1 < args.Length) {
						wpsdk = args[++i];
					}
				} else if (command == null) {
					command = args[i];
					if (command == "connect" && i + 1 < args.Length) {
						udid = args[++i];
					}
					else if (command == "launch" && i + 1 < args.Length)
					{
						udid = args[++i];
						string rawAppId = args[++i];
						try
						{
							appid = Guid.Parse(rawAppId);
						} catch (FormatException fe)
						{
							return showHelp("Invalid app GUID format: " + rawAppId);
						}
					}
				}
			}

			if (wpsdk == null) {
				wpsdk = "10.0";
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
			if (!wpsdk.Equals("10.0") && !wpsdk.Equals("8.1"))
			{
				return showHelp("Unsupported wpsdk value. Please use '10.0' or '8.1'.");
			}

			int localeId = CultureInfo.CurrentUICulture.LCID;
			MultiTargetingConnectivity multiTargetingConnectivity = new MultiTargetingConnectivity(localeId);
			Collection<ConnectableDevice> devices = multiTargetingConnectivity.GetConnectableDevices();

			List<ConnectableDevice> deviceList = new List<ConnectableDevice>();
			i = 0;
			foreach (ConnectableDevice dev in devices) {
				// Filter to device and emulators that match the given SDK. We use 6.3 Version as the marker for 8.1 emus, assume rest are 10.0
				string versionString = dev.Version.ToString();
				if (!dev.IsEmulator() || (wpsdk == "8.1" && versionString.Equals("6.3")) || (wpsdk == "10.0" && !versionString.Equals("6.3"))) {
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
					string versionString = dev.Version.ToString();
					if (!dev.IsEmulator()) {
						if (j > 0) {
							Console.WriteLine(",");
						}
						string sdk = "null";
						if (versionString == "6.3") {
							sdk = "\"8.1\"";
						} else if (versionString == "10.0") {
							sdk = "\"10.0\"";
						// skip invalid device
						} else if (versionString.StartsWith("2147483647")) {
							continue;
						}
						Console.WriteLine("\t\t{\n");
						Console.WriteLine("\t\t\t\"name\": \"" + dev.Name.Replace("\"", "\\\"") + "\",");
						Console.WriteLine("\t\t\t\"udid\": " + id + ",");
						Console.WriteLine("\t\t\t\"index\": " + id + ",");
						Console.WriteLine("\t\t\t\"version\": \"" + versionString + "\","); // windows 8.1: "6.3", windows 10: "10.0"
						Console.WriteLine("\t\t\t\"wpsdk\": " + sdk + ",");
						Console.WriteLine("\t\t\t\"type\": \"device\"");
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
						Console.WriteLine("\t\t\t\"guid\": \"" + dev.Id + "\",");
						Console.WriteLine("\t\t\t\"version\": \"" + dev.Version + "\","); // 6.3 for 8.1 emulators, 6.4 for 10 emulators, 2147483647.2147483647.2147483647.2147483647 for device
						Console.WriteLine("\t\t\t\"uapVersion\": \"" + dev.UapVersion + "\","); // blank/empty for 8.1 emulators and device, 10.0.10586.0 for win 10 emulators
						Console.WriteLine("\t\t\t\"wpsdk\": \"" + wpsdk + "\",");
						Console.WriteLine("\t\t\t\"type\": \"emulator\"");
						Console.Write("\t\t}");
						j++;
					}
					id++;
				}
				Console.WriteLine("\n\t]");

				Console.WriteLine("}");
				return 0;
			}

			// This won't just connect, it will launch the emulator!
			if (command == "connect" || command == "launch") {
				if (udid == null) {
					return showHelp("Missing device/emulator UDID");
				}
				// TODO Validate that the udid is either our generated udid (i.e. 10-0-1), or it's GUID, or it's an integer index value!

				int id = 0;
				// Search devices for udid!
				ConnectableDevice connectableDevice = null;
				foreach (ConnectableDevice dev in deviceList) {
					// Is it a matching GUID, matching UDID or matching Index value?
					if (dev.Id.Equals(udid) || (wpsdk.Replace('.', '-') + "-" + id).Equals(udid) || udid.Equals(id.ToString()))
					{
						connectableDevice = dev;
						break;
					}
					id++;
				}
				if (connectableDevice == null)
				{
					return showHelp(String.Format("Invalid device UDID '{0:D}'", udid));
				}

				try {
					IDevice device = connectableDevice.Connect();

					if (command == "launch")
					{
						IRemoteApplication app = device.GetApplication(appid);
						app.TerminateRunningInstances();
						app.Launch();
						Console.WriteLine("{");
						Console.WriteLine("\t\"success\": true");
						Console.WriteLine("}");
					} else {
						try {
							string destinationIp;
							string sourceIp;
							int destinationPort;
							device.GetEndPoints(0, out sourceIp, out destinationIp, out destinationPort);
							var address = IPAddress.Parse(destinationIp);
							ISystemInfo systemInfo = device.GetSystemInfo();

							Version version = new Version(systemInfo.OSMajor, systemInfo.OSMinor, systemInfo.OSBuildNo);
							Console.WriteLine("{");
							Console.WriteLine("\t\"success\": true,");
							Console.WriteLine("\t\"ip\": \"" + address.ToString() + "\",");
							Console.WriteLine("\t\"port\": " + destinationPort.ToString() + ",");
							Console.WriteLine("\t\"osVersion\": \"" + version.ToString() + "\",");
							Console.WriteLine("\t\"availablePhysical\": " + systemInfo.AvailPhys.ToString() + ",");
							Console.WriteLine("\t\"totalPhysical\": " + systemInfo.TotalPhys.ToString() + ",");
							Console.WriteLine("\t\"availableVirtual\": " + systemInfo.AvailVirtual.ToString() + ",");
							Console.WriteLine("\t\"totalVirtual\": " + systemInfo.TotalVirtual.ToString() + ",");
							Console.WriteLine("\t\"architecture\": \"" + systemInfo.ProcessorArchitecture.ToString() + "\",");
							Console.WriteLine("\t\"instructionSet\": \"" + systemInfo.InstructionSet.ToString() + "\",");
							Console.WriteLine("\t\"processorCount\": " + systemInfo.NumberOfProcessors.ToString() + "");
							Console.WriteLine("}");
						} catch (Exception ex) {
							//
							// ConnectableDevice throws an error when connecting to a physical Windows 10 device
							// physical Windows 10 devices can be connected to using 127.0.0.1.
							// From some point of Windows 10 SDK, IDevice.GetEndPoints throws Exception for Windows Phone 8.1 device too.
							// Interestingly ConnectableDevice.Version returns 8.1 _or_ 6.3 in this case.
							// Returning ok for now because we can still connect to the device.
							//
							if (command == "connect" && !connectableDevice.IsEmulator()) {
								Console.WriteLine("{");
								Console.WriteLine("\t\"success\": true,");
								Console.WriteLine("\t\"ip\": \"127.0.0.1\",");
								Console.WriteLine("\t\"osVersion\": \"" + connectableDevice.Version.ToString() + "\"");
								Console.WriteLine("}");
								return 0;
							}
						}
					}
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
			Console.WriteLine("  wptool <command> [--wpsdk <ver>]");
			Console.WriteLine("");
			Console.WriteLine("Commands:");
			Console.WriteLine("  enumerate					 List all devices and emulators");
			Console.WriteLine("  connect <udid>				Connects to the specified device");
			Console.WriteLine("  launch <udid> <product-guid>  Connects to the specified device and launches the app with the given product guid");
			Console.WriteLine("");
			Console.WriteLine("Options:");
			Console.WriteLine(" --wpsdk <ver>				  The version of the Windows Phone SDK emulators to use (e.g. '10.0', or '8.1')");
			Console.WriteLine("								Defaults to Windows 10 Mobile (e.g. 10.0)");
			Console.WriteLine("");

			return msg.Length > 0 ? 1 : 0;
		}
	}
}
