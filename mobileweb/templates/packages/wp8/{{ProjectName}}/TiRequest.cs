using System;

namespace TitaniumApp
{
	class TiRequest
	{
		public string type { get; set; }
		public string token { get; set; }
		public TiRequestParams data { get; set; }
	}
}
