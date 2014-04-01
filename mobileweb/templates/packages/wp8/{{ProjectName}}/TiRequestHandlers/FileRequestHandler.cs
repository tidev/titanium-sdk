using System;
using System.Collections.Generic;
using System.IO;

namespace TitaniumApp.TiRequestHandlers
{
	public class FileRequestException : Exception
	{
		public string Type = "FileRequestException";

		public FileRequestException() {}
		public FileRequestException(string message) : base(message) {}
		public FileRequestException(string message, Exception inner) : base(message, inner) {}
	}

	public class FileRequestHandler : IRequestHandler
	{
		public TiResponse process(TiRequestParams data) {
			if (!data.ContainsKey("file")) {
				throw new FileRequestException("Request missing 'file' param");
			}

			string file = collapsePath((string)data["file"]);
			if (file.IndexOf("..") == 0) {
				throw new FileRequestException("The requested file must not begin with \"..\"");
			}
			file = "App/" + file;

			if (!File.Exists(file)) {
				throw new FileRequestException("File \"" + file + "\" does not exist");
			}

			bool isBinary = false;
			if (data.ContainsKey("isBinary")) {
				isBinary = (bool)data["isBinary"];
			}

			TiResponse response = new TiResponse();
			response["file"] = file;

			if (isBinary) {
				var filestream = new FileStream(file, FileMode.Open);
				byte[] bytes = new byte[filestream.Length];
				filestream.Read(bytes, 0, (int)filestream.Length);
				response["encoding"] = "base64";
				response["contents"] = Convert.ToBase64String(bytes);
			} else {
				response["contents"] = (new StreamReader(file)).ReadToEnd();
			}

			return response;
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
