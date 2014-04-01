using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Windows.Foundation;
using Microsoft.Phone.Controls;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace TitaniumApp.TiRequestHandlers
{
	public static class AsyncAwaiter
	{
		public static async Task<object> awaitTask<X>(this object obj) {
			IAsyncOperation<X> asyncOp = (IAsyncOperation<X>)obj;
			var result = await asyncOp;
			return (X)result;
		}
	}

	public class ReflectionException : Exception
	{
		public string Type = "ReflectionException";
		public ReflectionException() {}
		public ReflectionException(string message) : base(message) {}
		public ReflectionException(string message, Exception inner) : base(message, inner) {}
	}

	public class ReflectionRequestHandler : IRequestHandler
	{
		public ReflectionRequestHandler() {}

		public ReflectionRequestHandler(Microsoft.Phone.Controls.PhoneApplicationPage app, WebBrowser browser, System.Windows.Controls.Grid root) {
			InstanceRegistry.addInstance("app", app);
			InstanceRegistry.addInstance("browser", browser);
			InstanceRegistry.addInstance("root", root);
		}

		public TiResponse process(TiRequestParams data) {
			if (!data.ContainsKey("action")) {
				throw new ReflectionException("Request missing 'action' param");
			}

			string action = (string)data["action"];

			switch (action) {
				case "addEventListener":	return addEventListener(data);
				case "createInstance":		return createInstance(data);
				case "destroy":				return destroy(data);
				case "getEnum":				return getEnum(data);
				case "invokeMethod":		return invokeMethod(data);
				case "invokeMethodAsync":	return invokeMethodAsync(data);
				case "invokeStatic":		return invokeStatic(data);
				case "invokeStaticAsync":	return invokeStaticAsync(data);
				case "property":			return property(data);
				case "removeEventListener":	return removeEventListener(data);
				case "staticProperty":		return staticProperty(data);
				default:
					throw new ReflectionException("Invalid action \"" + action + "\"");
			}
		}

		private TiResponse addEventListener(TiRequestParams data) {
			if (!data.ContainsKey("handle")) {
				throw new ReflectionException("\"addEventListener\" request missing \"handle\" param");
			}

			string handle = (string)data["handle"];
			object instance = InstanceRegistry.getInstance(handle);

			if (instance == null) {
				throw new ReflectionException("\"addEventListener\" request invalid handle \"" + handle + "\"");
			}

			if (!data.ContainsKey("name")) {
				throw new ReflectionException("\"addEventListener\" request missing \"name\" param");
			}

			string eventName = (string)data["name"];
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
			pass[4] = Expression.Constant(InstanceRegistry.getInstance("browser"));

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
			InstanceRegistry.addDelegate(handle + "." + eventName, lambda);

			return null;
		}

		private void eventHandler(Object sender, EventArgs e, String eventName, String handle, WebBrowser browser) {
			TiResponse response = new TiResponse();
			response["_hnd"] = handle;
			response["type"] = eventName;

			string senderHandle = "";
			bool senderExists = InstanceRegistry.containsInstance(sender);
			if (senderExists) {
				senderHandle = InstanceRegistry.getInstanceHandleByValue(sender);
			} else {
				senderHandle = InstanceRegistry.createHandle(sender);
			}
			response["sender"] = senderHandle;

			string eventArgsHandle = "";
			bool eventArgsExists = InstanceRegistry.containsInstance(e);
			if (eventArgsExists) {
				eventArgsHandle = InstanceRegistry.getInstanceHandleByValue(e);
			} else {
				eventArgsHandle = InstanceRegistry.createHandle(e);
			}
			response["eventArgs"] = eventArgsHandle;

			response["error"] = null;
			if (e.GetType() == typeof(ErrorEventArgs)) {
				response["error"] = ((ErrorEventArgs)e).error;
			}

			browser.InvokeScript("execScript", new string[] { "tiwp8.fireEvent(" + JsonConvert.SerializeObject(response, Formatting.None) + ")" });

			if (!senderExists) InstanceRegistry.removeInstance(senderHandle);
			if (!eventArgsExists) InstanceRegistry.removeInstance(eventArgsHandle);
		}

		private TiResponse createInstance(TiRequestParams data) {
			if (!data.ContainsKey("className")) {
				throw new ReflectionException("\"createInstance\" request missing \"className\" param");
			}

			string className = (string)data["className"];
			var classType = InstanceRegistry.lookupType(className);
			if (classType == null) {
				throw new ReflectionException("\"createInstance\" request invalid classname \"" + classType + "\"");
			}

			if (!data.ContainsKey("args")) {
				throw new ReflectionException("\"createInstance\" request missing \"args\" param");
			}

			JArray args = (JArray)data["args"];
			if (args.Count % 2 != 0) {
				throw new ReflectionException("\"createInstance\" request arguments must contain an even number of type-values");
			}

			// create the argument types array
			Type[] ctorArgumentTypes = new Type[args.Count / 2];
			for (int i = 0, j = 0; i < args.Count; i += 2, j++) {
				ctorArgumentTypes[j] = InstanceRegistry.lookupType((string)args[i]);
			}

			// create the argument values array
			object[] ctorArguments = new object[args.Count / 2];
			for (int i = 1, j = 0; i < args.Count; i += 2, j++) {
				JObject arg = (JObject)args[i];
				if (arg["valueHnd"] != null) {
					ctorArguments[j] = InstanceRegistry.getInstance((string)arg["valueHnd"]);
				} else if (ctorArgumentTypes[j] == typeof(Uri)) {
					ctorArguments[j] = new Uri((string)arg["valuePrimitive"], UriKind.RelativeOrAbsolute);
				} else {
					ctorArguments[j] = ((JValue)arg["valuePrimitive"]).Value;
				}
				if (ctorArguments[j] != null) {
					ctorArguments[j] = Convert.ChangeType(ctorArguments[j], ctorArgumentTypes[j]);
				}
			}

			// Invoke the constructor and return the result
			var instance = classType.GetConstructor(ctorArgumentTypes).Invoke(ctorArguments);

			TiResponse response = new TiResponse();
			response["handle"] = InstanceRegistry.createHandle(instance);
			return response;
		}

		private TiResponse destroy(TiRequestParams data) {
			if (!data.ContainsKey("handle")) {
				throw new ReflectionException("\"invokeMethod\" request missing \"handle\" param");
			}

			string handle = (string)data["handle"];
			object instance = InstanceRegistry.getInstance(handle);

			if (instance == null) {
				throw new ReflectionException("\"invokeMethod\" request invalid handle \"" + handle + "\"");
			}

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
			InstanceRegistry.removeInstance(handle);

			return null;
		}

		private TiResponse getEnum(TiRequestParams data) {
			if (!data.ContainsKey("name")) {
				throw new ReflectionException("\"getEnum\" request missing \"name\" param");
			}

			if (!data.ContainsKey("value")) {
				throw new ReflectionException("\"getEnum\" request missing \"value\" param");
			}

			string name = (string)data["name"];
			string value = (string)data["value"];

			Type t = InstanceRegistry.lookupType(name);
			if (t == null) {
				throw new ReflectionException("\"getEnum\" request failed because \"" + name + "\" is an invalid class name");
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

			return InstanceRegistry.createReturnType(val);
		}

		private TiResponse invokeMethod(TiRequestParams data) {
			if (!data.ContainsKey("handle")) {
				throw new ReflectionException("\"invokeMethod\" request missing \"handle\" param");
			}

			string handle = (string)data["handle"];
			object instance = InstanceRegistry.getInstance(handle);

			if (instance == null) {
				throw new ReflectionException("\"invokeMethod\" request invalid handle \"" + handle + "\"");
			}

			if (!data.ContainsKey("method")) {
				throw new ReflectionException("\"invokeMethod\" request missing \"method\" param");
			}

			if (!data.ContainsKey("args")) {
				throw new ReflectionException("\"invokeMethod\" request missing \"args\" param");
			}

			JArray args = (JArray)data["args"];
			if (args.Count % 2 != 0) {
				throw new ReflectionException("\"invokeMethod\" request arguments must contain an even number of type-values");
			}

			// create the argument types array
			Type[] fnArgumentTypes = new Type[args.Count / 2];
			for (int i = 0, j = 0; i < args.Count; i += 2, j++) {
				fnArgumentTypes[j] = InstanceRegistry.lookupType((string)args[i]);
			}

			// get the method info
			MethodInfo methodInfo = instance.GetType().GetMethod((string)data["method"], fnArgumentTypes);

			if (methodInfo.ReturnType.GetInterfaces().Contains(typeof(IAsyncInfo))) {
				throw new Exception("Use invokeMethodAsync() to call this method");
			}

			// create the argument values array
			object[] fnArguments = new object[args.Count / 2];
			for (int i = 1, j = 0; i < args.Count; i += 2, j++) {
				JObject arg = (JObject)args[i];
				if (arg["valueHnd"] != null) {
					fnArguments[j] = InstanceRegistry.getInstance((string)arg["valueHnd"]);
				} else if (fnArgumentTypes[j] == typeof(Uri)) {
					fnArguments[j] = new Uri((string)arg["valuePrimitive"], UriKind.RelativeOrAbsolute);
				} else {
					fnArguments[j] = ((JValue)arg["valuePrimitive"]).Value;
				}
				if (fnArguments[j] != null) {
					IConvertible convertible = fnArguments[j] as IConvertible;
					if (convertible != null) {
						fnArguments[j] = Convert.ChangeType(fnArguments[j], fnArgumentTypes[j]);
					}
				}
			}

			// invoke the method
			var result = methodInfo.Invoke(instance, fnArguments);

			if (methodInfo.ReturnType == typeof(void)) {
				result = null;
			}

			return InstanceRegistry.createReturnType(result);
		}

		private TiResponse invokeMethodAsync(TiRequestParams data) {
			if (!data.ContainsKey("handle")) {
				throw new ReflectionException("\"invokeMethod\" request missing \"handle\" param");
			}

			string handle = (string)data["handle"];
			object instance = InstanceRegistry.getInstance(handle);

			if (instance == null) {
				throw new ReflectionException("\"invokeMethod\" request invalid handle \"" + handle + "\"");
			}

			if (!data.ContainsKey("method")) {
				throw new ReflectionException("\"invokeMethod\" request missing \"method\" param");
			}

			if (!data.ContainsKey("args")) {
				throw new ReflectionException("\"invokeMethod\" request missing \"args\" param");
			}

			JArray args = (JArray)data["args"];
			if (args.Count % 2 != 0) {
				throw new ReflectionException("\"invokeMethod\" request arguments must contain an even number of type-values");
			}

			// create the argument types array
			Type[] fnArgumentTypes = new Type[args.Count / 2];
			for (int i = 0, j = 0; i < args.Count; i += 2, j++) {
				fnArgumentTypes[j] = InstanceRegistry.lookupType((string)args[i]);
			}

			// get the method info
			MethodInfo methodInfo = instance.GetType().GetMethod((string)data["method"], fnArgumentTypes);

			// create the argument values array
			object[] fnArguments = new object[args.Count / 2];
			for (int i = 1, j = 0; i < args.Count; i += 2, j++) {
				JObject arg = (JObject)args[i];
				if (arg["valueHnd"] != null) {
					fnArguments[j] = InstanceRegistry.getInstance((string)arg["valueHnd"]);
				} else if (fnArgumentTypes[j] == typeof(Uri)) {
					fnArguments[j] = new Uri((string)arg["valuePrimitive"], UriKind.RelativeOrAbsolute);
				} else {
					fnArguments[j] = ((JValue)arg["valuePrimitive"]).Value;
				}
				if (fnArguments[j] != null) {
					IConvertible convertible = fnArguments[j] as IConvertible;
					if (convertible != null) {
						fnArguments[j] = Convert.ChangeType(fnArguments[j], fnArgumentTypes[j]);
					}
				}
			}

			TiResponse response = new TiResponse();
			InvokeAsync ia = new InvokeAsync();
			response["handle"] = InstanceRegistry.createHandle(ia);
			ia.run(instance, methodInfo, fnArguments);

			return response;
		}

		private TiResponse invokeStatic(TiRequestParams data) {
			if (!data.ContainsKey("className")) {
				throw new ReflectionException("\"invokeStatic\" request missing \"className\" param");
			}

			string className = (string)data["className"];
			var classType = InstanceRegistry.lookupType(className);
			if (classType == null) {
				throw new ReflectionException("\"invokeStatic\" request invalid classname \"" + className + "\"");
			}

			if (!data.ContainsKey("method")) {
				throw new ReflectionException("\"invokeStatic\" request missing \"method\" param");
			}

			if (!data.ContainsKey("args")) {
				throw new ReflectionException("\"invokeStatic\" request missing \"args\" param");
			}

			JArray args = (JArray)data["args"];
			if (args.Count % 2 != 0) {
				throw new ReflectionException("\"invokeStatic\" request arguments must contain an even number of type-values");
			}

			// create the argument types array
			Type[] fnArgumentTypes = new Type[args.Count / 2];
			for (int i = 0, j = 0; i < args.Count; i += 2, j++) {
				fnArgumentTypes[j] = InstanceRegistry.lookupType((string)args[i]);
			}

			// get the method info
			MethodInfo methodInfo = classType.GetMethod((string)data["method"], fnArgumentTypes);

			if (methodInfo.ReturnType.GetInterfaces().Contains(typeof(IAsyncInfo))) {
				throw new Exception("Use invokeMethodAsync() to call this method");
			}

			// create the argument values array
			object[] fnArguments = new object[args.Count / 2];
			for (int i = 1, j = 0; i < args.Count; i += 2, j++) {
				JObject arg = (JObject)args[i];
				if (arg["valueHnd"] != null) {
					fnArguments[j] = InstanceRegistry.getInstance((string)arg["valueHnd"]);
				} else if (fnArgumentTypes[j] == typeof(Uri)) {
					fnArguments[j] = new Uri((string)arg["valuePrimitive"], UriKind.RelativeOrAbsolute);
				} else {
					fnArguments[j] = ((JValue)arg["valuePrimitive"]).Value;
				}
				if (fnArguments[j] != null) {
					IConvertible convertible = fnArguments[j] as IConvertible;
					if (convertible != null) {
						fnArguments[j] = Convert.ChangeType(fnArguments[j], fnArgumentTypes[j]);
					}
				}
			}

			// invoke the method
			var result = methodInfo.Invoke(null, fnArguments);

			if (methodInfo.ReturnType == typeof(void)) {
				result = null;
			}

			return InstanceRegistry.createReturnType(result);
		}

		private TiResponse invokeStaticAsync(TiRequestParams data) {
			if (!data.ContainsKey("className")) {
				throw new ReflectionException("\"invokeStatic\" request missing \"className\" param");
			}

			string className = (string)data["className"];
			var classType = InstanceRegistry.lookupType(className);
			if (classType == null) {
				throw new ReflectionException("\"invokeStatic\" request invalid classname \"" + className + "\"");
			}

			if (!data.ContainsKey("method")) {
				throw new ReflectionException("\"invokeStatic\" request missing \"method\" param");
			}

			if (!data.ContainsKey("args")) {
				throw new ReflectionException("\"invokeStatic\" request missing \"args\" param");
			}

			JArray args = (JArray)data["args"];
			if (args.Count % 2 != 0) {
				throw new ReflectionException("\"invokeStatic\" request arguments must contain an even number of type-values");
			}

			// create the argument types array
			Type[] fnArgumentTypes = new Type[args.Count / 2];
			for (int i = 0, j = 0; i < args.Count; i += 2, j++) {
				fnArgumentTypes[j] = InstanceRegistry.lookupType((string)args[i]);
			}

			// get the method info
			MethodInfo methodInfo = classType.GetMethod((string)data["method"], fnArgumentTypes);

			// create the argument values array
			object[] fnArguments = new object[args.Count / 2];
			for (int i = 1, j = 0; i < args.Count; i += 2, j++) {
				JObject arg = (JObject)args[i];
				if (arg["valueHnd"] != null) {
					fnArguments[j] = InstanceRegistry.getInstance((string)arg["valueHnd"]);
				} else if (fnArgumentTypes[j] == typeof(Uri)) {
					fnArguments[j] = new Uri((string)arg["valuePrimitive"], UriKind.RelativeOrAbsolute);
				} else {
					fnArguments[j] = ((JValue)arg["valuePrimitive"]).Value;
				}
				if (fnArguments[j] != null) {
					IConvertible convertible = fnArguments[j] as IConvertible;
					if (convertible != null) {
						fnArguments[j] = Convert.ChangeType(fnArguments[j], fnArgumentTypes[j]);
					}
				}
			}

			TiResponse response = new TiResponse();
			InvokeAsync ia = new InvokeAsync();
			response["handle"] = InstanceRegistry.createHandle(ia);
			ia.run(null, methodInfo, fnArguments);

			return response;
		}

		private TiResponse property(TiRequestParams data) {
			if (!data.ContainsKey("handle")) {
				throw new ReflectionException("\"property\" request missing \"handle\" param");
			}

			string handle = (string)data["handle"];
			object instance = InstanceRegistry.getInstance(handle);

			if (instance == null) {
				throw new ReflectionException("\"property\" request invalid handle \"" + handle + "\"");
			}

			if (!data.ContainsKey("name")) {
				throw new ReflectionException("\"property\" request missing \"name\" param");
			}

			var obj = data["name"];
			if (obj == null) {
				throw new ReflectionException("\"property\" request \"name\" is null");
			}

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
							var propertyInfo = instanceType.GetProperty(propName);
							if (propertyInfo == null) {
								throw new ReflectionException("Invalid property \"" + propName + "\"");
							}
							object val = propertyInfo.GetValue(instance);
							value[propName] = InstanceRegistry.createReturnType(val);
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
							if (propertyInfo == null) {
								throw new ReflectionException("Invalid property \"" + prop.Name + "\"");
							}
							JObject value = (JObject)prop.Value;
							if (value["valueHnd"] != null) {
								propertyInfo.SetValue(instance, InstanceRegistry.getInstance((string)value["valueHnd"]));
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
						if (propertyInfo == null) {
							throw new ReflectionException("Invalid property \"" + name + "\"");
						}

						// setting a single prop
						if (data.ContainsKey("valueHnd") && data["valueHnd"] != null) {
							propertyInfo.SetValue(instance, InstanceRegistry.getInstance((string)data["valueHnd"]));
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
						return InstanceRegistry.createReturnType(val);
					}
			}

			return null;
		}

		private TiResponse removeEventListener(TiRequestParams data) {
			if (!data.ContainsKey("handle")) {
				throw new ReflectionException("\"addEventListener\" request missing \"handle\" param");
			}

			string handle = (string)data["handle"];
			object instance = InstanceRegistry.getInstance(handle);

			if (instance == null) {
				throw new ReflectionException("\"addEventListener\" request invalid handle \"" + handle + "\"");
			}

			if (!data.ContainsKey("name")) {
				throw new ReflectionException("\"addEventListener\" request missing \"name\" param");
			}

			string eventName = (string)data["name"];
			var eventInfo = instance.GetType().GetEvent(eventName);
			Delegate handler = InstanceRegistry.getDelegate(handle + "." + eventName);
			if (handler != null) {
				eventInfo.RemoveEventHandler(instance, handler);
				InstanceRegistry.removeDelegate(handle + "." + eventName);
			}

			return null;
		}

		private TiResponse staticProperty(TiRequestParams data) {
			if (!data.ContainsKey("className")) {
				throw new ReflectionException("\"staticProperty\" request missing \"className\" param");
			}

			string className = (string)data["className"];
			var classType = InstanceRegistry.lookupType(className);
			if (classType == null) {
				throw new ReflectionException("\"staticProperty\" request invalid classname \"" + className + "\"");
			}

			if (!data.ContainsKey("property")) {
				throw new ReflectionException("\"staticProperty\" request missing \"property\" param");
			}

			PropertyInfo propertyInfo = classType.GetProperty((string)data["property"]);
			if (propertyInfo == null) {
				throw new ReflectionException("\"staticProperty\" request invalid property \"" + data["property"] + "\"");
			}

			object val = propertyInfo.GetValue(null);
			return InstanceRegistry.createReturnType(val);
		}
	}

	public class InvokeAsync
	{
		public event EventHandler<InvokeAsyncEventArgs> complete;

		public async void run(object instance, MethodInfo methodInfo, object[] fnArguments) {
			SynchronizationContext ctx = SynchronizationContext.Current;

			if (!methodInfo.ReturnType.GetInterfaces().Contains(typeof(IAsyncInfo))) {
				// this should be easy, just run it as if it was synchronous
				var result = methodInfo.Invoke(instance, fnArguments);

				InvokeAsyncEventArgs eventArgs = new InvokeAsyncEventArgs();

				if (methodInfo.ReturnType == typeof(void)) {
					eventArgs.primitiveValue = null;
				} else {
					Type type = result.GetType();
					if (type.IsPrimitive || type == typeof(string) || type == typeof(decimal)) {
						eventArgs.primitiveValue = result;
					} else if (InstanceRegistry.containsInstance(result)) {
						eventArgs.handle = InstanceRegistry.getInstanceHandleByValue(result);
					} else {
						string handle = InstanceRegistry.createHandle(result);
						eventArgs.handle = handle;
					}
				}

				this.OnComplete(eventArgs);
				return;
			}

			MethodInfo castMethod = Type.GetType("TitaniumApp.TiRequestHandlers.AsyncAwaiter").GetMethod("awaitTask");
			castMethod = castMethod.MakeGenericMethod(methodInfo.ReturnType.GenericTypeArguments[0]);

			InvokeAsync _this = this;

			Task.Run(() => {
				var comObject = methodInfo.Invoke(instance, fnArguments);

				Task<object> obj = (Task<object>)castMethod.Invoke(null, new object[] { comObject });
				obj.Wait();
				var result = obj.Result;

				InvokeAsyncEventArgs eventArgs = new InvokeAsyncEventArgs();

				if (methodInfo.ReturnType == typeof(void)) {
					eventArgs.primitiveValue = null;
				} else {
					Type type = result.GetType();
					if (type.IsPrimitive || type == typeof(string) || type == typeof(decimal)) {
						eventArgs.primitiveValue = result;
					} else if (InstanceRegistry.containsInstance(result)) {
						eventArgs.handle = InstanceRegistry.getInstanceHandleByValue(result);
					} else {
						string handle = InstanceRegistry.createHandle(result);
						eventArgs.handle = handle;
					}
				}

				ctx.Post(args => {
					_this.OnComplete((InvokeAsyncEventArgs)args);
				}, eventArgs);
			});
		}

		protected virtual void OnComplete(InvokeAsyncEventArgs e) {
			EventHandler<InvokeAsyncEventArgs> handler = complete;
			if (handler != null) {
				handler(this, e);
			}
		}
	}

	public class InvokeAsyncEventArgs : EventArgs
	{
		public object primitiveValue { get; set; }
		public string handle { get; set; }
	}
}
