using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;

namespace TitaniumApp
{
	public static class InstanceRegistry
	{
		private static Dictionary<string, Type> cachedTypes = new Dictionary<string, Type>();
		private static Dictionary<string, object> instances = new Dictionary<string, object>();
		private static UInt64 instanceCount = 0;
		private static Dictionary<string, Delegate> delegates = new Dictionary<string, Delegate>();

		public static Type lookupType(string className) {
			if (cachedTypes.ContainsKey(className)) {
				return cachedTypes[className];
			}

			/* If we don't find the type right away, we try again with a specific assembly version.
			 * To determine the assembly name to try, first run the app with the following code,
			 * then add it below.
			 *
			 *     Type t = typeof(Windows.Storage.ApplicationData);
			 *     string s = t.Assembly.FullName.ToString();
			 *     System.Diagnostics.Debug.WriteLine(s);
			 */

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
			} else if (className.StartsWith("Windows.")) {
				className += ", Windows, Version=255.255.255.255, Culture=neutral, PublicKeyToken=null, ContentType=WindowsRuntime";
			}

			return cachedTypes[className] = Type.GetType(className);
		}

		[Conditional("DEBUG")]
		public static void dumpInstances() {
			if (instances.Count == 1) {
				Logger.log("InstanceRegistry", "1 instance:");
			} else {
				Logger.log("InstanceRegistry", instances.Count + " instances:");
			}
			foreach (string key in instances.Keys.ToList()) {
				if (instances[key] == null) {
					Logger.log("InstanceRegistry", "    " + key + ": null");
				} else {
					Logger.log("InstanceRegistry", "    " + key + ": " + instances[key].GetType().ToString());
				}
			}
		}

		public static void addInstance(string handle, object instance) {
			Logger.log("InstanceRegistry", "Adding instance " + handle + ": " + instance.ToString());
			instances[handle] = instance;
			dumpInstances();
		}

		public static object getInstance(string handle) {
			return instances.ContainsKey(handle) ? instances[handle] : null;
		}

		public static string getInstanceHandleByValue(object value) {
			return instances.FirstOrDefault(x => x.Value == value).Key;
		}

		public static bool containsInstance(object value) {
			return instances.ContainsValue(value);
		}

		public static void removeInstance(string handle) {
			if (instances.ContainsKey(handle)) {
				Logger.log("InstanceRegistry", "Removing instance " + handle + ": " + instances[handle].ToString());
				instances.Remove(handle);
				dumpInstances();
			}
		}

		public static string createHandle(object instance) {
			string handle = instanceCount++.ToString();
			if (instanceCount > UInt64.MaxValue) {
				throw new Exception("Reflection Handler Exception: Maximum instance count exceeded");
			}
			Logger.log("InstanceRegistry", "Creating instance handle " + handle + ": " + instance.ToString());
			instances[handle] = instance;
			dumpInstances();
			return handle;
		}

		public static void addDelegate(string name, Delegate lambda) {
			delegates[name] = lambda;
		}

		public static Delegate getDelegate(string name) {
			return delegates.ContainsKey(name) ? delegates[name] : null;
		}

		public static void removeDelegate(string handle) {
			delegates.Remove(handle);
		}

		public static TiResponse createReturnType(object value) {
			Type type = value == null ? null : value.GetType();
			TiResponse response = new TiResponse();

			if (value == null || type.IsPrimitive || type == typeof(string) || type == typeof(decimal)) {
				response["primitiveValue"] = value;
				return response;
			}

			if (instances.ContainsValue(value)) {
				response["handle"] = instances.FirstOrDefault(x => x.Value == value).Key;
				return response;
			}

			string handle = createHandle(value);
			response["handle"] = handle;
			return response;
		}
		
	}
}
