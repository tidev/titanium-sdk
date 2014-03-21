using System;
using System.Text.RegularExpressions;

namespace TitaniumApp.TiRequestHandlers
{
	class LogRequestHandler : IRequestHandler
	{
		private Regex logLevelRegex = new Regex(@"^\[(\w+)\]\s(.*)?$", RegexOptions.Compiled);

		public TiResponse process(TiRequestParams data) {
			if (data.ContainsKey("message")) {
				string message = (string)data["message"];

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
			return null;
		}
	}
}
