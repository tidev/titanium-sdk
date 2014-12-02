using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Windows.Networking;
using Windows.Networking.Sockets;
using Windows.Storage.Streams;

namespace TitaniumApp
{
	public static class Logger
	{
		static StreamSocket tcpSocket = null;
		static DataWriter tcpWriter = null;

		public static async Task init(Dictionary<string, string> settings) {
			if (!settings.ContainsKey("serverToken") || settings["serverToken"].Length == 0) {
				return;
			}

			if (!settings.ContainsKey("ipAddressList") || settings["ipAddressList"].Length == 0) {
				return;
			}

			if (!settings.ContainsKey("tcpPort") || settings["tcpPort"].Length == 0) {
				return;
			}

			string serverToken = settings["serverToken"];

			string[] ipAddressList = settings["ipAddressList"].Split(new char[] { ',' });
			if (ipAddressList.Length == 0) {
				return;
			}

			int port = Int32.Parse(settings["tcpPort"]);
			if (port < 0 || port >= 65535) return;

			// need to find which ip address is valid
			for (int i = 0; i < ipAddressList.Length; i++) {
				Debug.WriteLine("[LOGGER] Trying to connect to log server: " + ipAddressList[i].Trim() + ":" + port);

				try {
					var cts = new CancellationTokenSource();
					int timeout = 2000;
					if (settings.ContainsKey("logConnectionTimeout")) {
						timeout = Int32.Parse(settings["logConnectionTimeout"]);
					}
					if (timeout >= 0) {
						cts.CancelAfter(timeout);
					}

					tcpSocket = new StreamSocket();
					tcpSocket.Control.KeepAlive = true;

					var connectAsync = tcpSocket.ConnectAsync(new HostName(ipAddressList[i].Trim()), port.ToString());
					var connectTask = connectAsync.AsTask(cts.Token);
					await connectTask;

					tcpWriter = new DataWriter(tcpSocket.OutputStream);

					// we write the server token to see if this log relay is really the log relay we're looking for
					log(serverToken);

					// if we made it this far, then we've found a good log relay and we'll stop connecting to the rest
					break;
				} catch (TaskCanceledException) {
					// try the next ip address
					if (tcpSocket != null) {
						tcpSocket.Dispose();
						tcpSocket = null;
					}
				} catch (Exception ex) {
					if (tcpWriter != null) {
						tcpWriter.Dispose();
						tcpWriter = null;
					}
					if (tcpSocket != null) {
						tcpSocket.Dispose();
						tcpSocket = null;
					}
					if (SocketError.GetStatus(ex.HResult) == SocketErrorStatus.Unknown) {
						break;
					}
					Debug.WriteLine(ex.ToString());
					if (i + 1 < ipAddressList.Length) {
						Debug.WriteLine("Trying next IP address");
					}
				}
			}
		}

		[Conditional("DEBUG")]
		public async static void log(string message) {
			Debug.WriteLine(message);

			// send message to Titanium CLI log relay
			if (tcpSocket != null && tcpWriter != null) {
				tcpWriter.WriteString(message + "\n");
				await tcpWriter.StoreAsync();
			}
		}

		[Conditional("DEBUG")]
		public static void log(string type, string message) {
			log(("[" + type + "]").PadRight(7) + " " + message);
		}
	}
}
