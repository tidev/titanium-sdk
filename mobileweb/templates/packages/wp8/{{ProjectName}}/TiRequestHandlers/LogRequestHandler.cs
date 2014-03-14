using System;

namespace TitaniumApp.TiRequestHandlers
{
	class LogRequestHandler : IRequestHandler
	{
		public TiResponse process(TiRequestParams data) {
			if (data.ContainsKey("message")) {
				Logger.log((string)data["message"]);
			}
			return null;
		}
	}
}
