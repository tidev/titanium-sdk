using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Navigation;
using System.Windows.Media;
using Microsoft.Phone.Controls;
using Microsoft.Phone.Shell;
using Microsoft.Devices;
using System.IO.IsolatedStorage;
using System.IO;
using System.Windows.Resources;
using System.Text.RegularExpressions;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Reflection;
using System.ComponentModel;
using <%= projectName %>.Resources;

namespace <%= projectName %>
{
	public partial class MainPage : PhoneApplicationPage
	{
		private Dictionary<string, Type> cachedTypes = new Dictionary<string, Type>();
		private Dictionary<string, object> instances = new Dictionary<string, object>();
		private Dictionary<string, Delegate> delegates = new Dictionary<string, Delegate>();
		private Int32 instance_count = 0;

		// Constructor
		public MainPage() {
			InitializeComponent();

			instances["root"] = root;
			instances["browser"] = browser;
			instances["app"] = app;
		}

		private void browser_Loaded(object sender, RoutedEventArgs e) {
			browser.Navigate(new Uri("index.html", UriKind.Relative));
		}

		private void exceptionDelegate(Exception e) {
			try {
				browser.InvokeScript("execScript", new string[] { "tiwp8.handleError(" + parseObject(e) + ")" });
			} catch { }
		}

		private void browser_ScriptNotify(object sender, NotifyEventArgs e) {
			var type = e.Value[0];

			// file access
			if (type == 'f') {
				var isBinary = e.Value[1] == 'b';
				var path = e.Value.Substring(2);
				string fileContents = "";
				try {
					if (isBinary) {
						var filestream = new FileStream("App/" + path, FileMode.Open);
						byte[] data = new byte[filestream.Length];
						filestream.Read(data, 0, (int)filestream.Length);
						fileContents = Convert.ToBase64String(data);
					} else {
						fileContents = (new StreamReader("App/" + path)).ReadToEnd();
					}
					browser.InvokeScript("execScript", new string[] { "tiwp8.handleFileResponse({path:" + path.Replace("\"", "\\\"") + ",success:true,contents:\"" + fileContents.Replace("\"", "\\\"") + "\"})" });
				} catch {
					browser.InvokeScript("execScript", new string[] { "tiwp8.handleFileResponse({path:" + path.Replace("\"", "\\\"") + ",success:false})" });
				}

			// log message
			} else if (type == 'l') {
				log(e.Value.Substring(1));

			// reflection call
			} else if (type == 'r') {
				var action = e.Value.Substring(1, 2);
				var value = e.Value.Substring(3);
				string returnInfo;

				switch (action) {
					// return the root grid so you can add new things to it
					case "gr":
						returnInfo = "\"root\"";
						break;

					// return the main web browser object
					case "gw":
						returnInfo = "\"browser\"";
						break;

					// get the main phone application page
					case "ga":
						returnInfo = "\"app\"";
						break;

					// invoke a static method of a class
					case "is":
						returnInfo = invokeStatic(value);
						break;

					// create an instance of a class
					case "ci":
						returnInfo = createInstance(value);
						break;

					// invoke a method of a instance
					case "in":
						returnInfo = invoke(value);
						break;

					// get an instance property
					case "gp":
						returnInfo = getProp(value);
						break;

					// set an instance property
					case "sp":
						returnInfo = setProp(value);
						break;

					// get an enum
					case "ge":
						returnInfo = getEnum(value);
						break;

					// get at index
					case "gi":
						throw new NotImplementedException();
						break;

					// set at index
					case "si":
						throw new NotImplementedException();
						break;

					// destroy an instance
					case "de":
						returnInfo = destroy(value);
						break;

					// add an event listener
					case "ae":
						returnInfo = addEventListener(value);
						break;

					// remove an event listener
					case "re":
						returnInfo = removeEventListener(value);
						break;

					default:
						throw new ArgumentException("Invalid Windows Phone 8 reflection action " + action);
				}

				// return the response
				try {
					browser.InvokeScript("execScript", new string[] { "tiwp8.handleProxyResponse(" + returnInfo + ")" });
				} catch { }
			}
		}

		private void log(string msg) {
			System.Diagnostics.Debug.WriteLine(msg);
		}

		private Type lookupType(string className) {
			if (cachedTypes.ContainsKey(className)) {
				return cachedTypes[className];
			}

			if (Type.GetType(className) != null) {
				// Do nothing
			} else if (className.StartsWith("System.Windows")) {
				className += ", System.Windows, Version=2.0.6.0, Culture=neutral, PublicKeyToken=7cec85d7bea7798e";
			} else if (className.StartsWith("Microsoft.Phone") || className.StartsWith("Microsoft.Devices")) {
				className += ", Microsoft.Phone, Version=8.0.0.0, Culture=neutral, PublicKeyToken=24eec0d8c86cda1e";
			} else if (className.StartsWith("System.")) {
				className += ", System, Version=4.0.0.0, Culture=neutral, PublicKeyToken=7cec85d7bea7798e";
			}

			return cachedTypes[className] = Type.GetType(className);
		}

		private string createReturnType(Type type, object value) {
			if (type.IsPrimitive || type == typeof(decimal) || value == null) {
				return "{ \"primitiveValue\": " + (type == typeof(bool) ? value.ToString().ToLower() : value.ToString()) + " }";
			} else if (type == typeof(string)) {
				return "{ \"primitiveValue\": \"" + value.ToString().Replace("\"", "\\\"") + "\" }";
			} else if (instances.ContainsValue(value)) {
				return "{ \"hnd\": \"" + instances.FirstOrDefault(x => x.Value == value).Key + "\" }";
			}

			if ((uint)instance_count > UInt32.MaxValue) {
				throw new ArgumentOutOfRangeException();
			}

			string result = "{ \"hnd\": \"" + instance_count.ToString() + "\" }";
			instances[instance_count++.ToString()] = value;
			return result;
		}

		[DataContract]
		private class ValuePayload {
			[DataMember(Name = "valueHnd")]
			public string valueHnd { get; set; }
			[DataMember(Name = "valuePrimitive")]
			public object valuePrimitive { get; set; }
		}

		[DataContract]
		private class InvokeStaticPayload {
			[DataMember(Name = "className")]
			public string className { get; set; }
			[DataMember(Name = "argTypes")]
			public string[] argTypes { get; set; }
			[DataMember(Name = "argValues")]
			public ValuePayload[] argValues { get; set; }
		}

		private string invokeStatic(string value) {
			// Deserialize the data
			DataContractJsonSerializer ser = new DataContractJsonSerializer(typeof(InvokeStaticPayload));
			var payload = (InvokeStaticPayload)ser.ReadObject(new MemoryStream(Encoding.UTF8.GetBytes(value)));

			try {
				// Create the argument types array
				Type[] fnArgumentTypes = new Type[payload.argTypes.Length];
				for (int i = 0; i < fnArgumentTypes.Length; i++) {
					fnArgumentTypes[i] = lookupType(payload.argTypes[i]);
				}

				// Create the arguments object
				object[] fnArguments = new object[payload.argValues.Length];
				for (int i = 0; i < payload.argValues.Length; i++) {
					if (payload.argValues[i].valueHnd != null) {
						fnArguments[i] = instances[(string)payload.argValues[i].valueHnd];
					} else if (fnArgumentTypes[i] == typeof(Uri)) {
						fnArguments[i] = new Uri((string)payload.argValues[i].valuePrimitive, UriKind.RelativeOrAbsolute);
					} else {
						fnArguments[i] = payload.argValues[i].valuePrimitive;
					}
					fnArguments[i] = Convert.ChangeType(fnArguments[i], fnArgumentTypes[i]);
				}

				// Get the static method info
				MethodInfo methodInfo = lookupType(payload.className).GetMethod(payload.name, fnArgumentTypes);

				// Invoke the method
				var result = methodInfo.Invoke(instances[payload.hnd], fnArguments);
				return methodInfo.ReturnType == typeof(void) ? "{ \"primitiveValue\": null }" : createReturnType(result.GetType(), result);
			} catch (Exception err) {
				exceptionDelegate(err);
				return "{}";
			}
		}

		[DataContract]
		private class CreateInstancePayload {
			[DataMember(Name = "className")]
			public string className { get; set; }
			[DataMember(Name = "argTypes")]
			public string[] argTypes { get; set; }
			[DataMember(Name = "argValues")]
			public ValuePayload[] argValues { get; set; }
		}

		private string createInstance(string value) {
			// Deserialize the data
			DataContractJsonSerializer ser = new DataContractJsonSerializer(typeof(CreateInstancePayload));
			var payload = (CreateInstancePayload)ser.ReadObject(new MemoryStream(Encoding.UTF8.GetBytes(value)));

			try {
				// Create the argument types array
				Type[] ctorArgumentTypes = new Type[payload.argTypes.Length];
				for (int i = 0; i < ctorArgumentTypes.Length; i++) {
					ctorArgumentTypes[i] = lookupType(payload.argTypes[i]);
				}

				// Create the arguments object
				object[] ctorArguments = new object[payload.argValues.Length];
				for (int i = 0; i < payload.argValues.Length; i++) {
					if (payload.argValues[i].valueHnd != null) {
						ctorArguments[i] = instances[(string)payload.argValues[i].valueHnd];
					} else if (ctorArgumentTypes[i] == typeof(Uri)) {
						ctorArguments[i] = new Uri((string)payload.argValues[i].valuePrimitive, UriKind.RelativeOrAbsolute);
					} else {
						ctorArguments[i] = payload.argValues[i].valuePrimitive;
					}
					ctorArguments[i] = Convert.ChangeType(ctorArguments[i], ctorArgumentTypes[i]);
				}

				// Invoke the constructor and return the result
				var instance = lookupType(payload.className).GetConstructor(ctorArgumentTypes).Invoke(ctorArguments);
				if ((uint)instance_count > UInt32.MaxValue) {
					throw new ArgumentOutOfRangeException();
				}

				var hnd = instance_count++.ToString();
				instances[hnd] = instance;
				return hnd;
			} catch (Exception err) {
				exceptionDelegate(err);
				return "{}";
			}
		}

		[DataContract]
		private class InvokePayload {
			[DataMember(Name = "hnd")]
			public string hnd { get; set; }
			[DataMember(Name = "name")]
			public string name { get; set; }
			[DataMember(Name = "argTypes")]
			public string[] argTypes { get; set; }
			[DataMember(Name = "argValues")]
			public ValuePayload[] argValues { get; set; }
		}

		private string invoke(string value) {
			// Deserialize the data
			DataContractJsonSerializer ser = new DataContractJsonSerializer(typeof(InvokePayload));
			var payload = (InvokePayload)ser.ReadObject(new MemoryStream(Encoding.UTF8.GetBytes(value)));

			try {
				// Create the argument types array
				Type[] fnArgumentTypes = new Type[payload.argTypes.Length];
				for (int i = 0; i < fnArgumentTypes.Length; i++) {
					fnArgumentTypes[i] = lookupType(payload.argTypes[i]);
				}

				// Create the arguments object
				object[] fnArguments = new object[payload.argValues.Length];
				for (int i = 0; i < payload.argValues.Length; i++) {
					if (payload.argValues[i].valueHnd != null) {
						fnArguments[i] = instances[(string)payload.argValues[i].valueHnd];
					} else if (fnArgumentTypes[i] == typeof(Uri)) {
						fnArguments[i] = new Uri((string)payload.argValues[i].valuePrimitive, UriKind.RelativeOrAbsolute);
					} else {
						fnArguments[i] = payload.argValues[i].valuePrimitive;
					}
					fnArguments[i] = Convert.ChangeType(fnArguments[i], fnArgumentTypes[i]);
				}

				// Get the method info
				MethodInfo methodInfo = instances[payload.hnd].GetType().GetMethod(payload.name, fnArgumentTypes);

				// Invoke the method
				var result = methodInfo.Invoke(instances[payload.hnd], fnArguments);
				return methodInfo.ReturnType == typeof(void) ? "{ \"primitiveValue\": null }" : createReturnType(result.GetType(), result);
			} catch (Exception err) {
				exceptionDelegate(err);
				return "{}";
			}
		}

		[DataContract]
		private class GetPropPayload {
			[DataMember(Name = "hnd")]
			public string hnd { get; set; }
			[DataMember(Name = "name")]
			public string name { get; set; }
			[DataMember(Name = "isAttached")]
			public bool isAttached { get; set; }
		}

		private string getProp(string value) {
			// Deserialize the data
			DataContractJsonSerializer ser = new DataContractJsonSerializer(typeof(GetPropPayload));
			var payload = (GetPropPayload)ser.ReadObject(new MemoryStream(Encoding.UTF8.GetBytes(value)));

			try {
				// Get the property
				var prop = instances[payload.hnd].GetType().GetProperty(payload.name).GetValue(instances[payload.hnd]);
				var propType = prop.GetType();

				// Convert the result to the appropriate string and return it
				return createReturnType(propType, prop);
			} catch (Exception err) {
				exceptionDelegate(err);
				return "{}";
			}
		}

		[DataContract]
		private class SetPropPayload {
			[DataMember(Name = "hnd")]
			public string hnd { get; set; }
			[DataMember(Name = "name")]
			public string name { get; set; }
			[DataMember(Name = "valueHnd")]
			public string valueHnd { get; set; }
			[DataMember(Name = "valuePrimitive")]
			public object valuePrimitive { get; set; }
			[DataMember(Name = "isAttached")]
			public bool isAttached { get; set; }
		}

		private string setProp(string value) {
			// Deserialize the data
			DataContractJsonSerializer ser = new DataContractJsonSerializer(typeof(SetPropPayload));
			var payload = (SetPropPayload)ser.ReadObject(new MemoryStream(Encoding.UTF8.GetBytes(value)));

			try {
				// Get the property type
				var propertyInfo = instances[payload.hnd].GetType().GetProperty(payload.name);


				if (propertyInfo.PropertyType == typeof(Uri)) {
					payload.valuePrimitive = new Uri((string)payload.valuePrimitive, UriKind.RelativeOrAbsolute);
				}

				// Set the property type, looking up the handle if necessary
				if (payload.valueHnd == null) {
					propertyInfo.SetValue(instances[payload.hnd], Convert.ChangeType(payload.valuePrimitive, propertyInfo.PropertyType));
				} else {
					propertyInfo.SetValue(instances[payload.hnd], instances[payload.valueHnd]);
				}
			} catch (Exception err) {
				exceptionDelegate(err);
			}

			return "{}";
		}

		[DataContract]
		private class GetEnumPayload {
			[DataMember(Name = "name")]
			public string name { get; set; }
			[DataMember(Name = "value")]
			public string value { get; set; }
		}

		private string getEnum(string value) {
			// Deserialize the data
			DataContractJsonSerializer ser = new DataContractJsonSerializer(typeof(GetEnumPayload));
			var payload = (GetEnumPayload)ser.ReadObject(new MemoryStream(Encoding.UTF8.GetBytes(value)));

			try {
				// Get the value of the enumeration
				Type t = lookupType(payload.name);
				if (t == null) return "{}";
				Object item = new Object();

				if (t.IsEnum) {
					item = Enum.Parse(t, payload.value);
				} else {
					var prop = t.GetProperty(payload.value);
					if (prop == null) return "{}";
					item = prop.GetValue(null, null);
				}

				// Convert the result to the appropriate string and return it
				return createReturnType(item.GetType(), item);
			} catch (Exception err) {
				exceptionDelegate(err);
				return "{}";
			}
		}


		[DataContract]
		private class DestroyPayload {
			[DataMember(Name = "hnd")]
			public string hnd { get; set; }
		}

		private string destroy(string value) {
			// Deserialize the data
			DataContractJsonSerializer ser = new DataContractJsonSerializer(typeof(DestroyPayload));
			var payload = (DestroyPayload)ser.ReadObject(new MemoryStream(Encoding.UTF8.GetBytes(value)));

			try {
				// Remove from parent view
				var propertyInfo = instances[payload.hnd].GetType().GetProperty("Parent");
				if (propertyInfo != null) {
					var parent = propertyInfo.GetValue(instances[payload.hnd]);
					if (parent != null) {
						propertyInfo = parent.GetType().GetProperty("Children");
						if (propertyInfo != null) {
							var children = propertyInfo.GetValue(parent);
							var remove = children.GetType().GetMethod("Remove");
							remove.Invoke(children, new object[] { instances[payload.hnd] });
						}
					}
				}

				// Call Dispose method
				var dispose = instances[payload.hnd].GetType().GetMethod("Dispose");
				if (dispose != null) {
					dispose.Invoke(instances[payload.hnd], null);
				}

				// Call Finalize method
				var finalize = instances[payload.hnd].GetType().GetMethod("Finalize");
				if (finalize != null) {
					finalize.Invoke(instances[payload.hnd], null);
				}

				// Remove global reference
				instances.Remove(payload.hnd);
			} catch (Exception err) {
				exceptionDelegate(err);
			}

			return "{}";
		}

		[DataContract]
		private class EventPayload {
			[DataMember(Name = "hnd")]
			public string hnd { get; set; }
			[DataMember(Name = "name")]
			public string name { get; set; }
		}

		private string addEventListener(string value) {
			// Deserialize the data
			DataContractJsonSerializer ser = new DataContractJsonSerializer(typeof(EventPayload));
			var payload = (EventPayload)ser.ReadObject(new MemoryStream(Encoding.UTF8.GetBytes(value)));

			try {
				// Get event info
				var eventInfo = instances[payload.hnd].GetType().GetEvent(payload.name);

				// Create an array of parameters based on the event info
				var parameters = eventInfo.EventHandlerType.GetMethod("Invoke").GetParameters().
					Select((p, i) => System.Linq.Expressions.Expression.Parameter(p.ParameterType, "p" + i)).ToArray();

				// Construct a new array of parameters to the method we are actually going to call
				// Need to pass in extra information so the Proxy knows which callback to fire
				System.Linq.Expressions.Expression[] pass = new System.Linq.Expressions.Expression[5];
				parameters.CopyTo(pass, 0);
				pass[2] = System.Linq.Expressions.Expression.Constant(eventInfo.Name);
				pass[3] = System.Linq.Expressions.Expression.Constant(payload.hnd);
				pass[4] = System.Linq.Expressions.Expression.Constant(browser);

				// Get method info of the handler we want to call
				var methodInfo = typeof(MainPage).GetMethod("dummyHandler", BindingFlags.NonPublic | BindingFlags.Instance);

				// Construct a delegate using a lambda expression
				// (Object, EventArgs) => dummyHandler(Object, EventArgs, String, String, WebBrowser)
				var lambda = System.Linq.Expressions.Expression.Lambda(
					eventInfo.EventHandlerType,
					System.Linq.Expressions.Expression.Call(System.Linq.Expressions.Expression.New(typeof(MainPage)), methodInfo, pass),
					parameters
				).Compile();

				// Hook the event to the delegate
				eventInfo.AddEventHandler(instances[payload.hnd], lambda);

				// Store the delegate to remove it later
				delegates[payload.hnd + "." + payload.name] = lambda;
			} catch (Exception err) {
				exceptionDelegate(err);
			}
			return "{}";
		}

		// Helper to shallow parse an object to a JSON string
		private string parseObject(Object parseme) {
			string rv = "{ ";
			PropertyInfo[] props = parseme.GetType().GetProperties();

			for (int i = 0; i < props.Length; i++) {
				if (props[i].CanRead != false) {
					try {
						var obj = props[i].GetValue(parseme);
						if (obj != null) {
							var type = props[i].PropertyType;
							string val = obj.ToString();
							string prop = props[i].ToString();
							string[] keys = prop.Split(' ');
							rv += "\"" + keys[1] + "\": \"" + val.Replace("\"", "\\\"") + "\",";
						}
					} catch { }
				}
			}

			return rv.Remove(rv.Length - 1, 1) + "}";
		}

		private void dummyHandler(Object sender, EventArgs e, String eventName, String handle, WebBrowser wb) {
			try {
				wb.InvokeScript("execScript", new string[] {
					"tiwp8.handleEvent({\"_hnd\": \"" + handle + "\", \"type\": \"" + eventName + "\", \"sender\": " + parseObject(sender) + ", \"eventArgs\": " + parseObject(e) + "})"
				});
			} catch {}
		}

		private string removeEventListener(string value) {
			// Deserialize the data
			DataContractJsonSerializer ser = new DataContractJsonSerializer(typeof(EventPayload));
			var payload = (EventPayload)ser.ReadObject(new MemoryStream(Encoding.UTF8.GetBytes(value)));

			var eventInfo = instances[payload.hnd].GetType().GetEvent(payload.name);
			var handler = delegates[payload.hnd + "." + payload.name];
			eventInfo.RemoveEventHandler(instances[payload.hnd], handler);
			delegates.Remove(payload.hnd + "." + payload.name);

			return "{}";
		}
	}
}
