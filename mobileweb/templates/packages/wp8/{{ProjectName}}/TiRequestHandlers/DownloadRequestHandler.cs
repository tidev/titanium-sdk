using System;
using System.Collections.Generic;
using System.IO;
using System.IO.IsolatedStorage;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Windows.Storage;

namespace TitaniumApp.TiRequestHandlers
{
	class DownloadRequestHandler : IRequestHandler
	{
		public TiResponse process(TiRequestParams data) {
			if (!data.ContainsKey("url")) {
				throw new Exception("Download Handler Exception: Request missing 'url' param");
			}

			string url = (string)data["url"];

			if (!url.StartsWith("http://") && !url.StartsWith("https://")) {
				throw new Exception("Download Handler Exception: 'url' param must start with 'http://' or 'https://'");
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
					throw new Exception("Download Handler Exception: Request missing 'saveTo' param");
				}
			}

			if (saveTo == null || saveTo == "") {
				throw new Exception("Download Handler Exception: Invalid 'saveTo' param");
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
					throw new Exception("Download Handler Exception: Unable to create destination directory '" + dir + "' because of insufficient permissions or the isolated storage has been disabled or removed");
				}
			}

			if (isf.FileExists(saveTo)) {
				if (data.ContainsKey("overwrite") && (bool)data["overwrite"]) {
					isf.DeleteFile(saveTo);
				} else {
					throw new Exception("Download Handler Exception: File '" + saveTo + "' already exists");
				}
			}

			IsolatedStorageFileStream fileStream = null;

			try {
				fileStream = isf.CreateFile(saveTo);
			} catch (IsolatedStorageException ise) {
				throw new Exception("Download Handler Exception: Unable to create file '" + saveTo + "' because the isolated storage has been disabled or removed");
			} catch (DirectoryNotFoundException dnfe) {
				throw new Exception("Download Handler Exception: Unable to create file '" + saveTo + "' because the directory does not exist");
			} catch (ObjectDisposedException dnfe) {
				throw new Exception("Download Handler Exception: Unable to create file '" + saveTo + "' because the isolated storage has been disposed");
			}

			TiResponse response = new TiResponse();
			DownloadFile df = new DownloadFile();
			response["handle"] = InstanceRegistry.createHandle(df);
			df.downloadFileAsync(url, fileStream);

			return response;
		}

		public class DownloadFile
		{
			public event EventHandler<DownloadFileEventArgs> complete;

			public async void downloadFileAsync(string url, IsolatedStorageFileStream filestream) {
				SynchronizationContext ctx = SynchronizationContext.Current;
				HttpWebRequest request = (HttpWebRequest)WebRequest.CreateHttp(new Uri(url));
				request.Method = "GET";

				Logger.log("DownloadRequestHandler", "Downloading " + url + " asynchronously...");

				request.BeginGetResponse(async callbackResult => {
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
						int responseBufferSize = 4096;
						int responseBytesRead = 0;
						int responseTotalBytesRead = 0;
						byte[] responseBuffer = new byte[responseBufferSize];

						while ((responseBytesRead = br.Read(responseBuffer, 0, responseBuffer.Length)) > 0) {
							responseTotalBytesRead += responseBytesRead;
							await filestream.WriteAsync(responseBuffer, 0, responseBuffer.Length);
						}
						filestream.Close();

						Logger.log("DownloadRequestHandler", "Wrote " + responseTotalBytesRead + " bytes");

						DownloadFileEventArgs args = new DownloadFileEventArgs();
						args.file = filestream.Name;
						args.size = responseTotalBytesRead;

						ctx.Post(result => {
							DownloadFile df = (DownloadFile)callbackResult.AsyncState;
							df.OnComplete((DownloadFileEventArgs)result);
						}, args);

					} catch (WebException ex) {
						// check if we have an expired or self-signed cert
						if (ex.Status == WebExceptionStatus.UnknownError) {
							if (ex.Response.Headers.Count == 0) {
								Logger.log("DownloadRequestHandler", "Invalid SSL certificate, returning a 400 Bad Request");
								throw new Exception("Download Handler Exception: Invalid SSL certificate, returning a 400 Bad Request");
							} else {
								Logger.log("DownloadRequestHandler", "File not found, returning a 404");
								throw new Exception("Download Handler Exception: File not found, returning a 404");
							}
						} else {
							Logger.log("DownloadRequestHandler", "400 Bad Request");
							Logger.log("DownloadRequestHandler", ex.Status.ToString());
							throw;
						}
					}
				}, this);
			}

			protected virtual void OnComplete(DownloadFileEventArgs e) {
				EventHandler<DownloadFileEventArgs> handler = complete;
				if (handler != null) {
					handler(this, e);
				}
			}
		}

		public class DownloadFileEventArgs : EventArgs
		{
			public string file { get; set; }
			public int size { get; set; }
		}
	}
}
