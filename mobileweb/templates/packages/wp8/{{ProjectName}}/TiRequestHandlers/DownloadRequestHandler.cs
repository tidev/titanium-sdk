using System;
using System.Collections.Generic;
using System.IO;
using System.IO.IsolatedStorage;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Phone.Net.NetworkInformation;
using Windows.Storage;

namespace TitaniumApp.TiRequestHandlers
{
	public class DownloadException : Exception
	{
		public string Type = "DownloadException";
		public DownloadException() {}
		public DownloadException(string message) : base(message) {}
		public DownloadException(string message, Exception inner) : base(message, inner) {}
	}

	public class DownloadRequestHandler : IRequestHandler
	{
		public TiResponse process(TiRequestParams data) {
			if (!data.ContainsKey("url")) {
				throw new DownloadException("Request missing 'url' param");
			}

			string url = (string)data["url"];

			if (!url.StartsWith("http://") && !url.StartsWith("https://")) {
				throw new DownloadException("'url' param must start with 'http://' or 'https://'");
			}

			string saveTo = "";
			int p;

			if (data.ContainsKey("saveTo")) {
				saveTo = (string)data["saveTo"];
			} else {
				// try to determine the filename based on the URL
				p = url.LastIndexOf('/');
				if (p > 8 && p != -1) { // make sure the last / is after the ://
					saveTo = url.Substring(p + 1);
				} else {
					throw new DownloadException("Request missing 'saveTo' param");
				}
			}

			if (saveTo == null || saveTo == "") {
				throw new DownloadException("Invalid 'saveTo' param");
			}

			saveTo = saveTo.Replace('\\', '/');

			IsolatedStorageFile isf = IsolatedStorageFile.GetUserStoreForApplication();

			p = saveTo.LastIndexOf('\\');
			if (p != -1) {
				string dir = saveTo.Substring(0, p);
				try {
					if (!isf.DirectoryExists(dir)) {
						isf.CreateDirectory(dir);
					}
				} catch (IsolatedStorageException ise) {
					throw new DownloadException("Unable to create destination directory '" + dir + "' because of insufficient permissions or the isolated storage has been disabled or removed");
				}
			}

			if (isf.FileExists(saveTo)) {
				if (data.ContainsKey("overwrite") && (bool)data["overwrite"]) {
					isf.DeleteFile(saveTo);
				} else {
					throw new DownloadException("File '" + saveTo + "' already exists");
				}
			}

			IsolatedStorageFileStream fileStream = null;

			try {
				fileStream = isf.CreateFile(saveTo);
			} catch (IsolatedStorageException ise) {
				throw new DownloadException("Unable to create file '" + saveTo + "' because the isolated storage has been disabled or removed");
			} catch (DirectoryNotFoundException dnfe) {
				throw new DownloadException("Unable to create file '" + saveTo + "' because the directory does not exist");
			} catch (ObjectDisposedException dnfe) {
				throw new DownloadException("Unable to create file '" + saveTo + "' because the isolated storage has been disposed");
			}

			TiResponse response = new TiResponse();
			DownloadFile df = new DownloadFile(SynchronizationContext.Current, new Uri(url), fileStream);
			response["handle"] = InstanceRegistry.createHandle(df);

			return response;
		}

		public class DownloadFile
		{
			public event EventHandler<DownloadFileEventArgs> complete;
			public event EventHandler<ErrorEventArgs> error;

			private SynchronizationContext ctx;
			private Uri uri;
			private IsolatedStorageFileStream filestream = null;

			public DownloadFile(SynchronizationContext c, Uri u, IsolatedStorageFileStream f) {
				this.ctx = c;
				this.uri = u;
				this.filestream = f;
			}

			public async void send() {
				DeviceNetworkInformation.ResolveHostNameAsync(new DnsEndPoint(uri.Host, 0), OnNameResolved, null);
			}

			private void OnNameResolved(NameResolutionResult dnsResult) {
				if (dnsResult.NetworkInterface == null) {
					if (filestream != null) {
						filestream.Close();
					}
					ctx.Post(result => {
						this.OnError(new ErrorEventArgs(new DownloadException("Network not available")));
					}, null);
					return;
				}

				HttpWebRequest request = (HttpWebRequest)WebRequest.CreateHttp(uri);
				request.Method = "GET";

				Logger.log("DownloadRequestHandler", "Downloading " + uri.AbsoluteUri + " asynchronously...");

				request.BeginGetResponse(async callbackResult => {
					DownloadFile df = (DownloadFile)callbackResult.AsyncState;

					try {
						HttpWebResponse response = (HttpWebResponse)request.EndGetResponse(callbackResult);
						Logger.log("DownloadRequestHandler", "Status: " + (int)response.StatusCode + " " + response.StatusDescription);
						if (response.Headers["Content-Length"] != null) {
							Logger.log("DownloadRequestHandler", "Content length: " + response.Headers["Content-Length"]);
						} else {
							Logger.log("DownloadRequestHandler", "Content length: unknown");
						}

						Stream responseStream = response.GetResponseStream();
						BinaryReader br = new BinaryReader(responseStream);
						int responseTotalBytesRead = 0;
						byte[] responseBuffer = br.ReadBytes(4096);

						while (responseBuffer.Length > 0) {
							responseTotalBytesRead += responseBytesRead;
							await filestream.WriteAsync(responseBuffer, 0, responseBuffer.Length);
							responseBuffer = br.ReadBytes(4096);
						}
						filestream.Close();

						Logger.log("DownloadRequestHandler", "Wrote " + responseTotalBytesRead + " bytes");

						ctx.Post(result => {
							df.OnComplete((DownloadFileEventArgs)result);
						}, new DownloadFileEventArgs(filestream.Name, responseTotalBytesRead));

					} catch (WebException ex) {
						DownloadException de;
						// check if we have an expired or self-signed cert
						if (ex.Status == WebExceptionStatus.UnknownError) {
							if (ex.Response.Headers.Count == 0 && uri.Scheme == "https") {
								de = new DownloadException("Invalid SSL certificate, returning a 400 Bad Request");
							} else {
								de = new DownloadException("File not found, returning a 404");
							}
						} else {
							de = new DownloadException("400 Bad Request: " + ex.Status.ToString());
						}
						if (filestream != null) {
							filestream.Close();
						}
						ctx.Post(result => {
							df.OnError(new ErrorEventArgs(de));
						}, null);
						Logger.log("DownloadRequestHandler", de.Message);
					}
				}, this);
			}

			public virtual void OnComplete(DownloadFileEventArgs e) {
				EventHandler<DownloadFileEventArgs> handler = complete;
				if (handler != null) {
					handler(this, e);
				}
			}

			public virtual void OnError(ErrorEventArgs e) {
				EventHandler<ErrorEventArgs> handler = error;
				if (handler != null) {
					handler(this, e);
				}
			}
		}

		public class DownloadFileEventArgs : EventArgs
		{
			public DownloadFileEventArgs(string f, int s) {
				this.file = f;
				this.size = s;
			}

			public string file { get; private set; }
			public int size { get; private set; }
		}

		public class DownloadFileErrorEventArgs : EventArgs
		{
			public DownloadFileErrorEventArgs(string ex) {
				this.error = ex;
			}

			public string error { get; private set; }
		}
	}
}