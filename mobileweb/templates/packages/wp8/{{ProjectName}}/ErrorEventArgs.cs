using System;

namespace TitaniumApp
{
	public class ErrorEventArgs : EventArgs
	{
		public ErrorEventArgs(Exception ex) {
			this.error = ex;
		}

		public Exception error { get; private set; }
	}
}
