using System;
using System.Diagnostics;

namespace TitaniumApp
{
	public class Logger
	{
		[Conditional("DEBUG")]
		public static void log(string message) {
			Debug.WriteLine(message);

			// TODO: send message to Titanium CLI log proxy
		}

		[Conditional("DEBUG")]
		public static void log(string type, string message) {
			log("[" + type + "] " + message);
		}
	}
}
