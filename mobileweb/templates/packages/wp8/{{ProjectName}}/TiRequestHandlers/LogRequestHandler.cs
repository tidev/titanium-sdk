using System;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace TitaniumApp.TiRequestHandlers
{
	public class LogRequestHandler : IRequestHandler
	{
		private Regex logLevelRegex = new Regex(@"^\[(\w+)\]\s(.*)?$", RegexOptions.Compiled);

		public TiResponse process(TiRequestParams data) {
			if (data.ContainsKey("message")) {
				JArray lines = (JArray)data["message"];

				for (int i = 0; i < lines.Count; i++) {
					string message = (string)lines[i];

					MatchCollection matches = logLevelRegex.Matches(message);
					if (matches.Count > 0) {
						GroupCollection groups = matches[0].Groups;
						if (groups.Count > 2) {
							string level = groups[1].Value.ToUpper();
							Logger.log(level == "LOG" ? "INFO" : level, groups[2].Value);
							return null;
						}
					}

					if (data.ContainsKey("level")) {
						string level = ((string)data["level"]).ToUpper();
						Logger.log(level == "LOG" ? "INFO" : level, message);
						return null;
					}

					Logger.log(message);
				}
			}
			return null;
		}
	}
}
