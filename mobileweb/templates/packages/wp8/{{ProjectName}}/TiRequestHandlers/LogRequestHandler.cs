using System;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace TitaniumApp.TiRequestHandlers
{
	public class LogRequestHandler : IRequestHandler
	{
		private Regex logLevelRegex = new Regex(@"^\[(\w+)\]\s(.*)?$", RegexOptions.Compiled | RegexOptions.Multiline);

		public TiResponse process(TiRequestParams data) {
			if (data.ContainsKey("message")) {
				JArray message = (JArray)data["message"];

				for (int i = 0; i < message.Count; i++) {
					string[] lines = ((string)message[i]).Split(new char[] { '\n' });

					for (int j = 0; j < lines.Length; j++) {
						string line = lines[j];

						MatchCollection matches = logLevelRegex.Matches(line);
						if (matches.Count > 0) {
							GroupCollection groups = matches[0].Groups;
							if (groups.Count > 2) {
								string level = groups[1].Value.ToUpper();
								Logger.log(level == "LOG" ? "INFO" : level, groups[2].Value);
								continue;
							}
						}

						if (data.ContainsKey("level")) {
							string level = ((string)data["level"]).ToUpper();
							Logger.log(level == "LOG" ? "INFO" : level, line);
							continue;
						}

						Logger.log(line);
					}
				}
			}
			return null;
		}
	}
}
