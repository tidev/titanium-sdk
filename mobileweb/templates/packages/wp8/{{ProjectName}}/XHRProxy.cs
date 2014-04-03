/**
 * This file contains portions of code from http://developer.nokia.com/community/wiki/A_simplistic_HTTP_Server_on_Windows_Phone
 */

using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Windows.Networking.Sockets;
using Windows.Storage.Streams;

namespace TitaniumApp
{
	public class XHRProxy
	{
		private bool running = false;
		private int port;
		private StreamSocketListener listener;
		Dictionary<string, string> mimeTypes = new Dictionary<string,string>();

		public string securityToken { get; set; }

		public XHRProxy(int port) {
			this.port = port;

			// load the mime types
			StreamReader sr = new StreamReader("Assets/mime.types");
			string line;
			int p;
			while (true) {
				line = sr.ReadLine();
				if (line == null) {
					break;
				}

				line = line.Trim();
				if (line.Length > 0) {
					p = line.IndexOfAny(new char[] { ' ', '\t' });
					if (p != -1) {
						mimeTypes[line.Substring(0, p)] = line.Substring(p+1).Trim();
					}
				}
			}
		}

		public async void Start() {
			if (!this.running) {
				this.running = true;
				this.listener = new StreamSocketListener();
				this.listener.Control.QualityOfService = SocketQualityOfService.Normal;
				this.listener.ConnectionReceived += ConnectionReceived;
				await this.listener.BindServiceNameAsync(this.port.ToString());
			}
		}

		public void Stop() {
			if (this.running) {
				this.listener.Dispose();
				this.running = false;
			}
		}

		async void ConnectionReceived(StreamSocketListener sender, StreamSocketListenerConnectionReceivedEventArgs args) {
			await Task.Run(() => {
				handleRequest(args.Socket);
			});
		}

		private enum RequestParseState { GetRequest, Headers, CreateRequest, ServeFile };
		private string[] states = { "GetRequest", "Headers", "CreateRequest", "ServeFile" };

		private async void requestError(DataWriter writer, StreamSocket socket, string status, string message = "") {
			writer.WriteString("HTTP/1.0 " + status + "\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\n" + message);
			await writer.StoreAsync();
			socket.Dispose();
		}

		private async void handleRequest(StreamSocket socket) {
			Logger.log("XHRProxy", "Received incoming HTTP request");

			DataWriter writer = new DataWriter(socket.OutputStream);
			writer.UnicodeEncoding = Windows.Storage.Streams.UnicodeEncoding.Utf8;

			// deny any request that isn't from localhost
			if (socket.Information.RemoteAddress.RawName != "::1") {
				Logger.log("XHRProxy", "403 Forbidden; remote address \"" + socket.Information.RemoteAddress.RawName + "\" != \"::1\"");
				requestError(writer, socket, "403 Forbidden", "Forbidden");
				return;
			}

			DataReader reader = new DataReader(socket.InputStream);
			reader.InputStreamOptions = InputStreamOptions.Partial;

			RequestParseState state = RequestParseState.GetRequest;
			string urlPrefix = "/fetch/" + this.securityToken + "/";
			UInt32 numBytesRead = 0;
			UInt32 requestBufferSize = 4096;
			string buffer = "";
			string httpMethod = "";
			string url = "";
			bool isLocalFile = true;
			Uri httpUri = null;
			int p, q;
			bool needMoreData = true;
			HttpWebRequest request = null;
			Dictionary<string, string> headers = new Dictionary<string,string>();
			int responseBufferSize = 4096;
			int responseBytesRead = 0;
			int responseTotalBytesRead = 0;
			byte[] responseBuffer = new byte[responseBufferSize];

			try {
				while (true) {
					Logger.log("XHRProxy", "State = " + states[(int)state]);

					if (needMoreData) {
						numBytesRead = await reader.LoadAsync(requestBufferSize);
						Logger.log("XHRProxy", "Read " + numBytesRead + " bytes");
						buffer += reader.ReadString(numBytesRead);
					}

					switch (state) {
						case RequestParseState.GetRequest:
							// go until first \n
							p = buffer.IndexOf("\r\n");
							if (p != -1) {
								// parse out the request
								string[] tokens = buffer.Substring(0, p).Split(' ');
								if (tokens.Length != 3) {
									Logger.log("XHRProxy", "400 Bad Request; request had " + tokens.Length + " tokens, expected 3");
									requestError(writer, socket, "400 Bad Request", "Bad Request");
									return;
								}

								httpMethod = tokens[0].ToUpper();
								Logger.log("XHRProxy", "Method = " + httpMethod);

								url = tokens[1];
								q = url.IndexOf(urlPrefix);
								if (q != 0) {
									Logger.log("XHRProxy", "400 Bad Request");
									requestError(writer, socket, "400 Bad Request", "Bad Request");
									return;
								}

								string encodedUrl = url.Substring(q + urlPrefix.Length);
								string decodedUrl = HttpUtility.UrlDecode(encodedUrl).Replace(' ', '+');
								byte[] data = Convert.FromBase64String(decodedUrl);
								url = Encoding.UTF8.GetString(data, 0, data.Length);
								if (url.IndexOf("http://") == 0 || url.IndexOf("https://") == 0) {
									isLocalFile = false;
								}
								Logger.log("XHRProxy", "URL = " + url);

								buffer = buffer.Substring(p + 2);
								needMoreData = false;
								state = RequestParseState.Headers;
							} else if (numBytesRead < requestBufferSize) {
								// not enough data, bad request
								Logger.log("XHRProxy", "400 Bad Request; not enough data");
								requestError(writer, socket, "400 Bad Request", "Bad Request");
								return;
							} else {
								// need more data
								Logger.log("XHRProxy", "Need more data...");
								needMoreData = true;
							}
							break;

						case RequestParseState.Headers:
							p = buffer.IndexOf("\r\n\r\n"); // two line breaks
							if (p != -1) {
								Logger.log("XHRProxy", "Original HTTP Request Headers:");
								string[] lines = buffer.Substring(0, p).Split('\n');
								foreach (string line in lines) {
									q = line.IndexOf(':');
									if (q != -1) {
										string name = line.Substring(0, q);
										string value = line.Substring(q + 2).Trim();
										Logger.log("XHRProxy", "    " + name + ": " + value);
										headers[name] = value;
									} else {
										Logger.log("XHRProxy", "    Bad HTTP header \"" + line + "\", ignoring");
									}
								}

								buffer = buffer.Substring(p + 4);
								state = isLocalFile ? RequestParseState.ServeFile : RequestParseState.CreateRequest;
							} else if (numBytesRead < requestBufferSize) {
								// not enough data, bad request
								Logger.log("XHRProxy", "400 Bad Request; not enough data");
								requestError(writer, socket, "400 Bad Request", "Bad Request");
								return;
							} else {
								// need more data
								Logger.log("XHRProxy", "Need more data...");
								needMoreData = true;
							}

							if (state == RequestParseState.ServeFile) {
								continue;
							}
							break;

						case RequestParseState.ServeFile:
							string originalFile = url;
							string file = collapsePath(originalFile);
							if (file.IndexOf("..") == 0) {
								Logger.log("XHRProxy", "400 Bad Request");
								Logger.log("XHRProxy", "Original file: " + originalFile);
								Logger.log("XHRProxy", "Resolved file: " + file);
								requestError(writer, socket, "400 Bad Request", "The requested file must not begin with \"..\"");
								return;
							}

							file = "App/" + file;

							if (!File.Exists(file)) {
								Logger.log("XHRProxy", "404 File Not Found");
								Logger.log("XHRProxy", "Original file: " + originalFile);
								Logger.log("XHRProxy", "Resolved file: " + file);
								requestError(writer, socket, "404 File Not Found", "File Not Found");
								return;
							}

							FileInfo fi = new FileInfo(file);
							string ext = fi.Extension.Substring(1); // trim the dot

							string mimetype = "application/octet-stream";
							if (mimeTypes.ContainsKey(ext)) {
								mimetype = mimeTypes[ext];
							}

							Logger.log("XHRProxy", "Status: 200 OK");
							Logger.log("XHRProxy", "Actual HTTP headers being returned:");
							Logger.log("XHRProxy", "    Content-Type: " + mimetype);
							Logger.log("XHRProxy", "    Content-Length: " + fi.Length);
							Logger.log("XHRProxy", "    Connection: close");

							writer.WriteString("HTTP/1.0 200 OK\r\n");
							writer.WriteString("Content-Type: " + mimetype + "\r\n");
							writer.WriteString("Content-Length: " + fi.Length + "\r\n");
							writer.WriteString("Connection: close\r\n\r\n");

							FileStream fs = new FileStream(file, FileMode.Open);
							while ((responseBytesRead = fs.Read(responseBuffer, 0, responseBuffer.Length)) > 0) {
								responseTotalBytesRead += responseBytesRead;
								writer.WriteBytes(responseBuffer);
							}
							Logger.log("XHRProxy", "Returned " + responseTotalBytesRead + " bytes");

							await writer.StoreAsync();
							socket.Dispose();
							return;

						case RequestParseState.CreateRequest:
							httpUri = new Uri(url, UriKind.Absolute);
							request = (HttpWebRequest)WebRequest.CreateHttp(httpUri);
							request.Method = httpMethod;

							Logger.log("XHRProxy", "Actual HTTP headers being sent:");
							foreach (string key in headers.Keys) {
								if (key == "Accept") {
									Logger.log("XHRProxy", "    Accept: " + headers[key]);
									request.Accept = headers[key];
								} else if (key == "Content-Type") {
									if (httpMethod == "POST" || httpMethod == "PUT") {
										Logger.log("XHRProxy", "    Content-Type: " + headers[key]);
										request.ContentType = headers[key];
									}
								} else if (key == "Host") {
									Logger.log("XHRProxy", "    Host: " + httpUri.Host);
									request.Headers["Host"] = httpUri.Host;
								} else {
									Logger.log("XHRProxy", "    " + key + ": " + headers[key]);
									request.Headers[key] = headers[key];
								}
							}

							if (httpMethod == "POST" || httpMethod == "PUT") {
								Stream requestStream = await Task.Factory.FromAsync<Stream>(request.BeginGetRequestStream, request.EndGetRequestStream, null);
								byte[] jsonAsBytes = Encoding.UTF8.GetBytes(buffer);
								Logger.log("XHRProxy", "Body:");
								Logger.log("XHRProxy", buffer);
								await requestStream.WriteAsync(jsonAsBytes, 0, jsonAsBytes.Length);

								if (numBytesRead == requestBufferSize) {
									// pump the rest of the data
									while (true) {
										numBytesRead = await reader.LoadAsync(requestBufferSize);
										if (numBytesRead == 0) {
											break;
										}
										Logger.log("XHRProxy", "Read " + numBytesRead + " bytes");
										buffer = reader.ReadString(numBytesRead);
										Logger.log("XHRProxy", buffer);
										byte[] jsonAsBytes2 = Encoding.UTF8.GetBytes(buffer);
										await requestStream.WriteAsync(jsonAsBytes2, 0, jsonAsBytes2.Length);
										if (numBytesRead < requestBufferSize) {
											break;
										}
									}
								}

								requestStream.Close();
							}

							Logger.log("XHRProxy", "Sending request...");
							request.BeginGetResponse(async callbackResult => {
								try {
									Logger.log("XHRProxy", "Reading response...");
									HttpWebResponse response = (HttpWebResponse)request.EndGetResponse(callbackResult);

									Logger.log("XHRProxy", "Status: " + (int)response.StatusCode + " " + response.StatusDescription);
									writer.WriteString("HTTP/1.0 " + (int)response.StatusCode + " " + response.StatusDescription + "\r\n");

									Logger.log("XHRProxy", "Original HTTP response headers:");
									foreach (string key in response.Headers.AllKeys) {
										Logger.log("XHRProxy", "    " + key + ": " + response.Headers[key]);
									}

									Logger.log("XHRProxy", "Actual HTTP headers being returned:");
									foreach (string key in response.Headers.AllKeys) {
										if (key == "Connection") {
											Logger.log("XHRProxy", "    Connection: close");
											writer.WriteString("Connection: close\r\n");
										} else {
											Logger.log("XHRProxy", "    " + key + ": " + response.Headers[key]);
											writer.WriteString(key + ": " + response.Headers[key] + "\r\n");
										}
									}
									writer.WriteString("\r\n");

									Stream responseStream = response.GetResponseStream();
									BinaryReader br = new BinaryReader(responseStream);
									while ((responseBytesRead = br.Read(responseBuffer, 0, responseBuffer.Length)) > 0) {
										responseTotalBytesRead += responseBytesRead;
										writer.WriteBytes(responseBuffer);
									}
									Logger.log("XHRProxy", "Returned " + responseTotalBytesRead + " bytes");

									await writer.StoreAsync();
									socket.Dispose();
								} catch (WebException ex) {
									// check if we have an expired or self-signed cert
									if (ex.Status == WebExceptionStatus.UnknownError) {
										if (ex.Response.Headers.Count == 0 && httpUri.Scheme == "https") {
											Logger.log("XHRProxy", "Invalid SSL certificate, returning a 400 Bad Request");
											requestError(writer, socket, "400 Bad Request", "Invalid SSL certificate");
										} else {
											Logger.log("XHRProxy", "File not found, returning a 404");
											requestError(writer, socket, "404 File Not Found", "File Not Found");
										}
									} else {
										Logger.log("XHRProxy", "400 Bad Request");
										Logger.log("XHRProxy", ex.Status.ToString());
										requestError(writer, socket, "400 Bad Request", ex.Status.ToString());
									}
									return;
								}
							}, null);

							return;
					}
				}
			} catch (Exception ex) {
				Logger.log("XHRProxy", "500 Internal Server Error");
				foreach (string s in ex.ToString().Split(new string[] { "\r\n", "\n" }, StringSplitOptions.None)) {
					Logger.log("XHRProxy", s);
				}
				requestError(writer, socket, "500 Internal Server Error", ex.Message);
			}
		}

		private string collapsePath(string path) {
			string[] parts = path.Replace('\\', '/').Split('/');
			int i;
			List<string> tmp = new List<string>();
			string segment = "";
			string lastSegment = "";

			for (i = 0; i < parts.Length; i++) {
				segment = parts[i];
				if (segment == ".." && tmp.Count > 0 && lastSegment != "..") {
					tmp.RemoveAt(tmp.Count - 1);
					lastSegment = tmp[tmp.Count - 1];
				} else if (segment != ".") {
					tmp.Add(lastSegment = segment);
				}
			}

			string result = "";
			for (i = 0; i < tmp.Count; i++) {
				if (result.Length > 0) {
					result += "/";
				}
				result += tmp[i];
			}

			return result;
		}
	}
}
