using System;
using System.Collections.Generic;
using System.IO;
using System.Windows;
using System.Windows.Navigation;
using Microsoft.Phone.Controls;
using Newtonsoft.Json;
using TitaniumApp.Resources;
using TitaniumApp.TiRequestHandlers;

namespace TitaniumApp
{
	public partial class MainPage : PhoneApplicationPage
	{
		private Dictionary<string, IRequestHandler> requestHandlers = new Dictionary<string, IRequestHandler>();
		private XHRProxy xhrProxy;
		public TiSettings settings = new TiSettings();

		// Constructor
		public MainPage() {
			InitializeComponent();

			initTiSettings();

			Logger.init(settings);

			requestHandlers["file"] = new FileRequestHandler();
			requestHandlers["log"]  = new LogRequestHandler();
			requestHandlers["reflection"] = new ReflectionRequestHandler(app, browser, root);

			xhrProxy = new XHRProxy(9999);
		}

		void initTiSettings() {
			string tiAppSettingsFile = "titanium_settings.ini";
			if (File.Exists(tiAppSettingsFile)) {
				StreamReader sr = new StreamReader(tiAppSettingsFile);
				string line, key, value;
				int p;
				while (true) {
					line = sr.ReadLine();
					if (line == null) {
						break;
					}

					line = line.Trim();
					if (line.Length > 0 && !line.StartsWith("#") && !line.StartsWith(";")) {
						p = line.IndexOf('=');
						if (p != -1) {
							key = line.Substring(0, p).Trim();
							value = line.Substring(p + 1).Trim();
							settings[key] = value;
						}
					}
				}
			}
		}

		protected override void OnNavigatedTo(NavigationEventArgs e) {
			base.OnNavigatedTo(e);
			xhrProxy.Start();
		}

		protected override void OnNavigatedFrom(NavigationEventArgs e) {
			base.OnNavigatedFrom(e);
			xhrProxy.Stop();
		}

		void browser_Loaded(object sender, RoutedEventArgs e) {
			browser.Navigate(new Uri("index.html", UriKind.Relative));
		}

		void browser_ScriptNotify(object sender, NotifyEventArgs e) {
			TiRequest request = JsonConvert.DeserializeObject<TiRequest>(e.Value);
			TiResponse response;

			try {
				if (request.type == null) {
					throw new Exception("Request Exception: Missing request \"type\" param");
				}

				if (!requestHandlers.ContainsKey(request.type)) {
					throw new Exception("Request Exception: Invalid request type \"" + request.type + "\"");
				}

				if (request.data == null) {
					throw new Exception("Request Exception: Missing request \"data\" param");
				}

				response = requestHandlers[request.type].process(request.data);
			} catch (Exception ex) {
				response = new TiResponse();
				response["error"] = ex.ToString();
			}

			// if the handler doesn't have a response, then just return
			if (response == null) {
				return;
			}

			// if the request has a token, then add it to the response
			if (request.token != null) {
				response["token"] = request.token;
			}

			// pass the response back to the browser
			try {
				browser.InvokeScript("execScript", new string[] { "tiwp8.handleResponse(" + JsonConvert.SerializeObject(response, Formatting.None) + ")" });
			} catch { }
		}
	}
}
