using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using Microsoft.Phone.Controls;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace TitaniumApp.TiRequestHandlers
{
	class ReflectionRequestHandler : IRequestHandler
	{
		private Dictionary<string, Type> cachedTypes = new Dictionary<string, Type>();
		private Dictionary<string, object> instances = new Dictionary<string, object>();
		private Int32 instanceCount = 0;
		private Dictionary<string, Delegate> delegates = new Dictionary<string, Delegate>();

		public ReflectionRequestHandler() {}

		public ReflectionRequestHandler(Microsoft.Phone.Controls.PhoneApplicationPage app, WebBrowser browser, System.Windows.Controls.Grid root) {
			instances["app"] = app;
			instances["browser"] = browser;
			instances["root"] = root;
		}

		public TiResponse process(TiRequestParams data) {
			if (!data.ContainsKey("action")) {
				throw new Exception("Reflection Handler Exception: Request missing 'action' param");
			}

			string action = (string)data["action"];

			switch (action) {
				case "addEventListener":	return addEventListener(data);
				case "createInstance":		return createInstance(data);
				case "destroy":				return destroy(data);
				case "getEnum":				return getEnum(data);
				case "invokeMethod":		return invokeMethod(data);
				case "invokeStatic":		return invokeStatic(data);
				case "property":			return property(data);
				case "removeEventListener":	return removeEventListener(data);
				default:
					throw new Exception("Reflection Handler Exception: Invalid action \"" + action + "\"");
			}
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
			} else if (className.StartsWith("System.Net")) {
				className += ", System.Net, Version=2.0.5.0, Culture=neutral, PublicKeyToken=7cec85d7bea7798e";
			} else if (className.StartsWith("System.")) {
				className += ", System, Version=4.0.0.0, Culture=neutral, PublicKeyToken=7cec85d7bea7798e";
			}

			return cachedTypes[className] = Type.GetType(className);
		}

		private TiResponse createReturnType(Type type, object value) {
			TiResponse response = new TiResponse();

			if (value == null || type.IsPrimitive || type == typeof(string) || type == typeof(decimal)) {
				response["primitiveValue"] = value;
				return response;
			}

			if (instances.ContainsValue(value)) {
				response["handle"] = instances.FirstOrDefault(x => x.Value == value).Key;
				return response;
			}

			if ((uint)instanceCount > UInt32.MaxValue) {
				throw new Exception("Reflection Handler Exception: Maximum instance count exceeded");
			}

			string handle = instanceCount++.ToString();
			instances[handle] = value;

			response["handle"] = handle;
			return response;
		}

		private TiResponse addEventListener(TiRequestParams data) {
			if (!data.ContainsKey("handle")) {
				throw new Exception("Reflection Handler Exception: \"addEventListener\" request missing \"handle\" param");
			}

			string handle = (string)data["handle"];

			if (!instances.ContainsKey(handle)) {
				throw new Exception("Reflection Handler Exception: \"addEventListener\" request invalid handle \"" + handle + "\"");
			}

			if (!data.ContainsKey("name")) {
				throw new Exception("Reflection Handler Exception: \"addEventListener\" request missing \"name\" param");
			}

			string eventName = (string)data["name"];
			var instance = instances[handle];
			var eventInfo = instance.GetType().GetEvent(eventName);

			// create an array of parameters based on the event info
			var parameters = eventInfo.EventHandlerType.GetMethod("Invoke").GetParameters().
					Select((p, i) => Expression.Parameter(p.ParameterType, "p" + i)).ToArray();

			// construct a new array of parameters to the method we are actually going to call
			// need to pass in extra information so the Proxy knows which callback to fire
			Expression[] pass = new Expression[5];
			parameters.CopyTo(pass, 0);
			pass[2] = Expression.Constant(eventInfo.Name);
			pass[3] = Expression.Constant(handle);
			pass[4] = Expression.Constant(instances["browser"]);

			// Get method info of the handler we want to call
			MethodInfo methodInfo = this.GetType().GetMethod("eventHandler", BindingFlags.NonPublic | BindingFlags.Instance);
			MethodCallExpression methodCall = Expression.Call(Expression.Constant(this), methodInfo, pass);

			// Construct a delegate using a lambda expression
			// (Object, EventArgs) => dummyHandler(Object, EventArgs, String, String, WebBrowser)
			var lambda = Expression.Lambda(
				eventInfo.EventHandlerType,
				methodCall,
				parameters
			).Compile();

			// Hook the event to the delegate
			eventInfo.AddEventHandler(instance, lambda);

			// Store the delegate to remove it later
			delegates[handle + "." + eventName] = lambda;

			return null;
		}

		private void eventHandler(Object sender, EventArgs e, String eventName, String handle, WebBrowser browser) {
			TiResponse response = new TiResponse();
			response["_hnd"] = handle;
			response["type"] = eventName;

			if ((uint)instanceCount + 1 > UInt32.MaxValue) {
				throw new Exception("Reflection Handler Exception: Maximum instance count exceeded");
			}

			string senderHandle = instanceCount++.ToString();
			instances[senderHandle] = sender;
			response["sender"] = senderHandle;

			string eventArgsHandle = instanceCount++.ToString();
			instances[eventArgsHandle] = e;
			response["eventArgs"] = eventArgsHandle;

			browser.InvokeScript("execScript", new string[] { "tiwp8.fireEvent(" + JsonConvert.SerializeObject(response, Formatting.None) + ")" });

			instances.Remove(senderHandle);
			instances.Remove(eventArgsHandle);
		}

		private TiResponse createInstance(TiRequestParams data) {
			if (!data.ContainsKey("className")) {
				throw new Exception("Reflection Handler Exception: \"createInstance\" request missing \"className\" param");
			}

			string className = (string)data["className"];
			var classType = lookupType(className);
			if (classType == null) {
				throw new Exception("Reflection Handler Exception: \"createInstance\" request invalid classname \"" + classType + "\"");
			}

			if (!data.ContainsKey("args")) {
				throw new Exception("Reflection Handler Exception: \"createInstance\" request missing \"args\" param");
			}

			JArray args = (JArray)data["args"];
			if (args.Count % 2 != 0) {
				throw new Exception("Reflection Handler Exception: \"createInstance\" request arguments must contain an even number of type-values");
			}

			// create the argument types array
			Type[] ctorArgumentTypes = new Type[args.Count / 2];
			for (int i = 0, j = 0; i < args.Count; i += 2, j++) {
				ctorArgumentTypes[j] = lookupType((string)args[i]);
			}

			// create the argument values array
			object[] ctorArguments = new object[args.Count / 2];
			for (int i = 1, j = 0; i < args.Count; i += 2, j++) {
				JObject arg = (JObject)args[i];
				if (arg["valueHnd"] != null) {
					ctorArguments[j] = instances[(string)arg["valueHnd"]];
				} else if (ctorArgumentTypes[j] == typeof(Uri)) {
					ctorArguments[j] = new Uri((string)arg["valuePrimitive"], UriKind.RelativeOrAbsolute);
				} else {
					ctorArguments[j] = ((JValue)arg["valuePrimitive"]).Value;
				}
				if (ctorArguments[j] != null) {
					ctorArguments[j] = Convert.ChangeType(ctorArguments[j], ctorArgumentTypes[j]);
				}
			}

			if ((uint)instanceCount > UInt32.MaxValue) {
				throw new Exception("Reflection Handler Exception: Maximum instance count exceeded");
			}

			// Invoke the constructor and return the result
			var instance = classType.GetConstructor(ctorArgumentTypes).Invoke(ctorArguments);

			string handle = instanceCount++.ToString();
			instances[handle] = instance;

			TiResponse response = new TiResponse();
			response["handle"] = handle;
			return response;
		}

		private TiResponse destroy(TiRequestParams data) {
			if (!data.ContainsKey("handle")) {
				throw new Exception("Reflection Handler Exception: \"invokeMethod\" request missing \"handle\" param");
			}

			string handle = (string)data["handle"];

			if (!instances.ContainsKey(handle)) {
				throw new Exception("Reflection Handler Exception: \"invokeMethod\" request invalid handle \"" + handle + "\"");
			}

			var instance = instances[handle];

			// remove from parent view
			var propertyInfo = instance.GetType().GetProperty("Parent");
			if (propertyInfo != null) {
				var parent = propertyInfo.GetValue(instance);
				if (parent != null) {
					propertyInfo = parent.GetType().GetProperty("Children");
					if (propertyInfo != null) {
						var children = propertyInfo.GetValue(parent);
						var remove = children.GetType().GetMethod("Remove");
						remove.Invoke(children, new object[] { instance });
					}
				}
			}

			// call Dispose method
			var dispose = instance.GetType().GetMethod("Dispose");
			if (dispose != null) {
				dispose.Invoke(instance, null);
			}

			// call Finalize method
			var finalize = instance.GetType().GetMethod("Finalize");
			if (finalize != null) {
				finalize.Invoke(instance, null);
			}

			// remove global reference
			instances.Remove(handle);

			return null;
		}

		private TiResponse getEnum(TiRequestParams data) {
			if (!data.ContainsKey("name")) {
				throw new Exception("Reflection Handler Exception: \"getEnum\" request missing \"name\" param");
			}

			if (!data.ContainsKey("value")) {
				throw new Exception("Reflection Handler Exception: \"getEnum\" request missing \"value\" param");
			}

			string name = (string)data["name"];
			string value = (string)data["value"];

			Type t = lookupType(name);
			if (t == null) {
				throw new Exception("Reflection Handler Exception: \"getEnum\" request failed because \"" + name + "\" is an invalid class name");
			}

			object val = null;

			if (t.IsEnum) {
				val = Enum.Parse(t, value);
			} else {
				var prop = t.GetProperty(value);
				if (prop != null) {
					val = prop.GetValue(null, null);
				}
			}

			return createReturnType(val.GetType(), val);
		}

		private TiResponse invokeMethod(TiRequestParams data) {
			if (!data.ContainsKey("handle")) {
				throw new Exception("Reflection Handler Exception: \"invokeMethod\" request missing \"handle\" param");
			}

			string handle = (string)data["handle"];

			if (!instances.ContainsKey(handle)) {
				throw new Exception("Reflection Handler Exception: \"invokeMethod\" request invalid handle \"" + handle + "\"");
			}

			if (!data.ContainsKey("method")) {
				throw new Exception("Reflection Handler Exception: \"invokeMethod\" request missing \"method\" param");
			}

			if (!data.ContainsKey("args")) {
				throw new Exception("Reflection Handler Exception: \"invokeMethod\" request missing \"args\" param");
			}

			JArray args = (JArray)data["args"];
			if (args.Count % 2 != 0) {
				throw new Exception("Reflection Handler Exception: \"invokeMethod\" request arguments must contain an even number of type-values");
			}

			// create the argument types array
			Type[] fnArgumentTypes = new Type[args.Count / 2];
			for (int i = 0, j = 0; i < args.Count; i += 2, j++) {
				fnArgumentTypes[j] = lookupType((string)args[i]);
			}

			// create the argument values array
			object[] fnArguments = new object[args.Count / 2];
			for (int i = 1, j = 0; i < args.Count; i += 2, j++) {
				JObject arg = (JObject)args[i];
				if (arg["valueHnd"] != null) {
					fnArguments[j] = instances[(string)arg["valueHnd"]];
				} else if (fnArgumentTypes[j] == typeof(Uri)) {
					fnArguments[j] = new Uri((string)arg["valuePrimitive"], UriKind.RelativeOrAbsolute);
				} else {
					fnArguments[j] = ((JValue)arg["valuePrimitive"]).Value;
				}
				if (fnArguments[j] != null) {
					fnArguments[j] = Convert.ChangeType(fnArguments[j], fnArgumentTypes[j]);
				}
			}

			var instance = instances[handle];

			// get the method info
			MethodInfo methodInfo = instance.GetType().GetMethod((string)data["method"], fnArgumentTypes);

			// invoke the method
			var result = methodInfo.Invoke(instance, fnArguments);

			if (methodInfo.ReturnType == typeof(void)) {
				result = null;
			}

			return createReturnType(result == null ? null : result.GetType(), result);
		}

		private TiResponse invokeStatic(TiRequestParams data) {
			if (!data.ContainsKey("className")) {
				throw new Exception("Reflection Handler Exception: \"invokeStatic\" request missing \"className\" param");
			}

			string className = (string)data["className"];
			var classType = lookupType(className);
			if (classType == null) {
				throw new Exception("Reflection Handler Exception: \"invokeStatic\" request invalid classname \"" + classType + "\"");
			}

			if (!data.ContainsKey("method")) {
				throw new Exception("Reflection Handler Exception: \"invokeStatic\" request missing \"method\" param");
			}

			if (!data.ContainsKey("args")) {
				throw new Exception("Reflection Handler Exception: \"invokeStatic\" request missing \"args\" param");
			}

			JArray args = (JArray)data["args"];
			if (args.Count % 2 != 0) {
				throw new Exception("Reflection Handler Exception: \"invokeStatic\" request arguments must contain an even number of type-values");
			}

			// create the argument types array
			Type[] fnArgumentTypes = new Type[args.Count / 2];
			for (int i = 0, j = 0; i < args.Count; i += 2, j++) {
				fnArgumentTypes[j] = lookupType((string)args[i]);
			}

			// create the argument values array
			object[] fnArguments = new object[args.Count / 2];
			for (int i = 1, j = 0; i < args.Count; i += 2, j++) {
				JObject arg = (JObject)args[i];
				if (arg["valueHnd"] != null) {
					fnArguments[j] = instances[(string)arg["valueHnd"]];
				} else if (fnArgumentTypes[j] == typeof(Uri)) {
					fnArguments[j] = new Uri((string)arg["valuePrimitive"], UriKind.RelativeOrAbsolute);
				} else {
					fnArguments[j] = ((JValue)arg["valuePrimitive"]).Value;
				}
				if (fnArguments[j] != null) {
					fnArguments[j] = Convert.ChangeType(fnArguments[j], fnArgumentTypes[j]);
				}
			}

			// get the method info
			MethodInfo methodInfo = classType.GetMethod((string)data["method"], fnArgumentTypes);

			// invoke the method
			var result = methodInfo.Invoke(null, fnArguments);

			if (methodInfo.ReturnType == typeof(void)) {
				result = null;
			}

			return createReturnType(result == null ? null : result.GetType(), result);
		}

		private TiResponse property(TiRequestParams data) {
			if (!data.ContainsKey("handle")) {
				throw new Exception("Reflection Handler Exception: \"property\" request missing \"handle\" param");
			}

			string handle = (string)data["handle"];

			if (!instances.ContainsKey(handle)) {
				throw new Exception("Reflection Handler Exception: \"property\" request invalid handle \"" + handle + "\"");
			}

			if (!data.ContainsKey("name")) {
				throw new Exception("Reflection Handler Exception: \"property\" request missing \"name\" param");
			}

			var obj = data["name"];
			if (obj == null) {
				throw new Exception("Reflection Handler Exception: \"property\" request \"name\" is null");
			}

			var instance = instances[handle];
			Type instanceType = instance.GetType();
			Type propType = instanceType.GetType();

			TiResponse response = new TiResponse();
			response["value"] = null;

			switch (obj.GetType().ToString()) {
				case "Newtonsoft.Json.Linq.JArray":
					{
						// get multiple props
						JArray arr = (JArray)obj;
						Dictionary<string, TiResponse> value = new Dictionary<string, TiResponse>();
						for (var i = 0; i < arr.Count; i++) {
							string propName = arr[i].ToString();
							object val = instanceType.GetProperty(propName).GetValue(instance);
							value[propName] = createReturnType(val.GetType(), val);
						}
						response["value"] = value;
						return response;
					}

				case "Newtonsoft.Json.Linq.JObject":
					{
						// set multiple props
						JObject props = (JObject)obj;
						foreach (JProperty prop in props.Properties()) {
							var propertyInfo = instanceType.GetProperty(prop.Name);
							JObject value = (JObject)prop.Value;
							if (value["valueHnd"] != null) {
								propertyInfo.SetValue(instance, instances[(string)value["valueHnd"]]);
							} else if (value["valuePrimitive"] != null) {
								var valuePrimitive = value["valuePrimitive"];
								if (propertyInfo.PropertyType == typeof(Uri)) {
									propertyInfo.SetValue(instance, Convert.ChangeType(new Uri(valuePrimitive.ToObject<string>(), UriKind.RelativeOrAbsolute), propertyInfo.PropertyType));
								} else {
									propertyInfo.SetValue(instance, valuePrimitive.ToObject(propertyInfo.PropertyType));
								}
							}
						}

						return null;
					}

				case "System.String":
					{
						string name = (string)obj;
						var propertyInfo = instanceType.GetProperty(name);

						// setting a single prop
						if (data.ContainsKey("valueHnd") && data["valueHnd"] != null) {
							propertyInfo.SetValue(instance, instances[(string)data["valueHnd"]]);
							return null;
						} else if (data.ContainsKey("valuePrimitive")) {
							var valuePrimitive = data["valuePrimitive"];
							if (propertyInfo.PropertyType == typeof(Uri)) {
								valuePrimitive = new Uri((string)valuePrimitive, UriKind.RelativeOrAbsolute);
							}
							propertyInfo.SetValue(instance, Convert.ChangeType(valuePrimitive, propertyInfo.PropertyType));
							return null;
						}

						// getting a single prop
						object val = propertyInfo.GetValue(instance);
						return createReturnType(val.GetType(), val);
					}
			}

			return null;
		}

		private TiResponse removeEventListener(TiRequestParams data) {
			if (!data.ContainsKey("handle")) {
				throw new Exception("Reflection Handler Exception: \"addEventListener\" request missing \"handle\" param");
			}

			string handle = (string)data["handle"];

			if (!instances.ContainsKey(handle)) {
				throw new Exception("Reflection Handler Exception: \"addEventListener\" request invalid handle \"" + handle + "\"");
			}

			if (!data.ContainsKey("name")) {
				throw new Exception("Reflection Handler Exception: \"addEventListener\" request missing \"name\" param");
			}

			string eventName = (string)data["name"];
			var instance = instances[handle];
			var eventInfo = instance.GetType().GetEvent(eventName);
			var handler = delegates[handle + "." + eventName];
			eventInfo.RemoveEventHandler(instances[handle], handler);
			delegates.Remove(handle + "." + eventName);

			return null;
		}
	}
}
