using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using Windows.Networking;
using Windows.Networking.Sockets;
using Windows.Storage.Streams;

namespace TitaniumApp
{
	public static class Logger
	{
		static DatagramSocket multicastSocket;
		static string logToken = "";
		static StreamSocket tcpSocket = null;
		static DataWriter tcpWriter = null;

		[Conditional("DEBUG")]
		public static async void init(TiSettings settings) {
			if (!settings.ContainsKey("logToken") || settings["logToken"].Length == 0) {
				return;
			}

			logToken = settings["logToken"];

			multicastSocket = new DatagramSocket();
			multicastSocket.MessageReceived += multicastSocket_MessageReceived;

			HostName hostname = new HostName("239.6.6.6");

			try {
				await multicastSocket.BindServiceNameAsync("8666");
				multicastSocket.JoinMulticastGroup(hostname);

				IOutputStream stream = await multicastSocket.GetOutputStreamAsync(hostname, "8666");
				DataWriter writer = new DataWriter(stream);
				writer.WriteString("TI_WP8_LOGGER");
				await writer.StoreAsync();
				writer.DetachStream();
				stream.Dispose();
			} catch (Exception ex) {
				if (SocketError.GetStatus(ex.HResult) == SocketErrorStatus.Unknown) {
					throw;
				}
				Debug.WriteLine(ex.ToString());
			}
		}

		static async void multicastSocket_MessageReceived(DatagramSocket sender, DatagramSocketMessageReceivedEventArgs eventArguments) {
			try {
				HostName remoteHostAddress = eventArguments.RemoteAddress;
				uint len = eventArguments.GetDataReader().UnconsumedBufferLength;
				string message = eventArguments.GetDataReader().ReadString(len).Trim();
				int p = message.IndexOf(':');
				if (p != -1) {
					string serverLogToken = message.Substring(0, p);
					int port = Int32.Parse(message.Substring(p + 1));

					if (serverLogToken == logToken && port > 0 && port < 65535) {
						Debug.WriteLine("[LOGGER] Found a Titanium log server: " + remoteHostAddress.DisplayName + ":" + port);

						try {
							tcpSocket = new StreamSocket();
							tcpSocket.Control.KeepAlive = true;
							await tcpSocket.ConnectAsync(remoteHostAddress, port.ToString());
							tcpWriter = new DataWriter(tcpSocket.OutputStream);

							// shutdown the multicast socket and start the tcp connection
							multicastSocket.Dispose();
						} catch {
							if (tcpWriter != null) {
								tcpWriter.Dispose();
								tcpWriter = null;
							}
							if (tcpSocket != null) {
								tcpSocket.Dispose();
								tcpSocket = null;
							}
						}
					}
				}
			} catch (Exception ex) {
				if (SocketError.GetStatus(ex.HResult) == SocketErrorStatus.Unknown) {
					throw;
				}
				Debug.WriteLine(ex.ToString());
			}
		}

		[Conditional("DEBUG")]
		public async static void log(string message) {
			Debug.WriteLine(message);

			// send message to Titanium CLI log proxy
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
