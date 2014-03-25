using System;
using System.Collections.Generic;

namespace TitaniumApp.TiRequestHandlers
{
	public interface IRequestHandler
	{
		TiResponse process(TiRequestParams data);
	}
}
