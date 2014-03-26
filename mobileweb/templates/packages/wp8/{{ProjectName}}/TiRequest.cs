using System;

namespace TitaniumApp
{
	public class TiRequest
	{
		public string type { get; set; }
		public string rtoken { get; set; } // request token
		public string stoken { get; set; } // security token
		public TiRequestParams data { get; set; }
	}
}
