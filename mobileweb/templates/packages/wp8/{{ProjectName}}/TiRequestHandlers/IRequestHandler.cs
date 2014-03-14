using System;
using System.Collections.Generic;

namespace TitaniumApp.TiRequestHandlers
{
	interface IRequestHandler
	{
		TiResponse process(TiRequestParams data);
	}
}
