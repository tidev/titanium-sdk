using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Navigation;
using Microsoft.Phone.Controls;
using Microsoft.Phone.Shell;
using <%= projectName %>.Resources;
using System.IO.IsolatedStorage;
using System.IO;
using System.Windows.Resources;
using System.Text.RegularExpressions;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Reflection;

namespace <%= projectName %>
{
    public partial class MainPage : PhoneApplicationPage
    {
        private Regex fileRequestRegex = new Regex("^([0-9]*)\\:(.*)$");

        // Constructor
        public MainPage()
        {
            InitializeComponent();
        }

        private void browser_Loaded(object sender, RoutedEventArgs e)
        {
            browser.Navigate(new Uri("App/index.html", UriKind.Relative));
        }

        private void browser_ScriptNotify(object sender, NotifyEventArgs e)
        {
            var type = e.Value[0]; // f for file, l for log
            if (type == 'f')
            {
                var isBinary = e.Value[1] == 'b';
                var path = e.Value.Substring(2);
                string fileContents = "";
                try
                {
                    if (isBinary)
                    {
                        var filestream = new FileStream("App/" + path, FileMode.Open);
                        byte[] data = new byte[filestream.Length];
                        filestream.Read(data, 0, (int)filestream.Length);
                        fileContents = Convert.ToBase64String(data);
                    }
                    else
                    {
                        fileContents = (new StreamReader("App/" + path)).ReadToEnd();
                    }
                    browser.InvokeScript("handleFileResponse", path, "s" + fileContents);
                }
                catch
                {
                    browser.InvokeScript("handleFileResponse", path, "f");
                }
            }
            else if (type == 'l')
            {
                System.Diagnostics.Debug.WriteLine(e.Value.Substring(1));
            }
            else if (type == 'r')
            {
                var action = e.Value.Substring(1, 2);
                var value = e.Value.Substring(3);
                string returnInfo;
                if (action == "gr")
                {
                    returnInfo = getRootGrid(value);
                }
                else if (action == "ci")
                {
                    returnInfo = createInstance(value);
                }
                else if (action == "in")
                {
                    returnInfo = invoke(value);
                }
                else if (action == "gp")
                {
                    returnInfo = getProp(value);
                }
                else if (action == "sp")
                {
                    returnInfo = setProp(value);
                }
                else if (action == "gi")
                {
                    throw new NotImplementedException();
                }
                else if (action == "si")
                {
                    throw new NotImplementedException();
                }
                else if (action == "ge")
                {
                    throw new NotImplementedException();
                }
                else if (action == "de")
                {
                    throw new NotImplementedException();
                }
                else if (action == "ae")
                {
                    throw new NotImplementedException();
                }
                else if (action == "re")
                {
                    throw new NotImplementedException();
                }
                else
                {
                    throw new ArgumentException("Invalid Windows Phone 8 reflection action " + action);
                }
                try
                {
                    browser.InvokeScript("handleProxyResponse", returnInfo);
                }
                catch(Exception) { }
            }
        }

        private Dictionary<string, Type> cachedTypes = new Dictionary<string, Type>();
        private Dictionary<string, object> instances = new Dictionary<string, object>();

        private Type lookupType(string className)
        {
            if (cachedTypes.ContainsKey(className))
            {
                return cachedTypes[className];
            }

            if (className.StartsWith("System.Windows"))
            {
                className += ", System.Windows, Version=2.0.6.0, Culture=neutral, PublicKeyToken=7cec85d7bea7798e";
            }
            else if (className.StartsWith("Microsoft.Phone"))
            {
                className += ", Microsoft.Phone, Version=8.0.0.0, Culture=neutral, PublicKeyToken=24eec0d8c86cda1e";
            }

            return cachedTypes[className] = Type.GetType(className);
        }

        private string createReturnType(Type type, object value)
        {
            string result;
            if (type.IsPrimitive || type == typeof(decimal) || value == null)
            {
                result = "{ \"primitiveValue\": " + value.ToString() + " }";
            }
            else if (type == typeof(string))
            {
                result = "{ \"primitiveValue\": \"" + value.ToString() + "\" }";
            }
            else if (instances.ContainsValue(value))
            {
                result = "{ \"hnd\": \"" + instances.FirstOrDefault(x => x.Value == value).Key + "\" }";
            }
            else
            {
                result = "{ \"hnd\": \"" + instances.Count.ToString() + "\" }";
                instances[instances.Count.ToString()] = value;
            }
            return result;
        }

        private string getRootGrid(string value)
        {
            // Add the root to the list of instances if it isn't already there
            if (!instances.ContainsKey("root"))
            {
                instances["root"] = root;
            }

            // Return the info
            return "root";
        }

        [DataContract]
        private class ValuePayload
        {
            [DataMember(Name = "valueHnd")]
            public string valueHnd { get; set; }
            [DataMember(Name = "valuePrimitive")]
            public object valuePrimitive { get; set; }
        }

        [DataContract]
        private class CreateInstancePayload
        {
            [DataMember(Name = "className")]
            public string className { get; set; }
            [DataMember(Name = "argTypes")]
            public string[] argTypes { get; set; }
            [DataMember(Name = "argValues")]
            public ValuePayload[] argValues { get; set; }
        }
        private string createInstance(string value)
        {
            // Deserialize the data
            DataContractJsonSerializer ser = new DataContractJsonSerializer(typeof(CreateInstancePayload));
            var payload = (CreateInstancePayload)ser.ReadObject(new MemoryStream(Encoding.UTF8.GetBytes(value)));

            // Create the argument types array
            Type[] ctorArgumentTypes = new Type[payload.argTypes.Length];
            for (int i = 0; i < ctorArgumentTypes.Length; i++)
            {
                ctorArgumentTypes[i] = lookupType(payload.argTypes[i]);
            }

            // Create the arguments object
            object[] ctorArguments = new object[payload.argValues.Length];
            for (int i = 0; i < payload.argValues.Length; i++)
            {
                if (payload.argValues[i].valueHnd != null)
                {
                    ctorArguments[i] = instances[(string)payload.argValues[i].valueHnd];
                }
                else
                {
                    ctorArguments[i] = payload.argValues[i].valuePrimitive;
                }
                ctorArguments[i] = Convert.ChangeType(ctorArguments[i], ctorArgumentTypes[i]);
            }

            // Invoke the constructor and return the result
            var instance = lookupType(payload.className).GetConstructor(ctorArgumentTypes).Invoke(ctorArguments);
            var hnd = instances.Count.ToString();
            instances[hnd] = instance;
            return hnd;
        }

        [DataContract]
        private class InvokePayload
        {
            [DataMember(Name = "hnd")]
            public string hnd { get; set; }
            [DataMember(Name = "name")]
            public string name { get; set; }
            [DataMember(Name = "argTypes")]
            public string[] argTypes { get; set; }
            [DataMember(Name = "argValues")]
            public ValuePayload[] argValues { get; set; }
        }
        private string invoke(string value)
        {
            // Deserialize the data
            DataContractJsonSerializer ser = new DataContractJsonSerializer(typeof(InvokePayload));
            var payload = (InvokePayload)ser.ReadObject(new MemoryStream(Encoding.UTF8.GetBytes(value)));

            // Create the argument types array
            Type[] fnArgumentTypes = new Type[payload.argTypes.Length];
            for (int i = 0; i < fnArgumentTypes.Length; i++)
            {
                fnArgumentTypes[i] = lookupType(payload.argTypes[i]);
            }

            // Create the arguments object
            object[] fnArguments = new object[payload.argValues.Length];
            for (int i = 0; i < payload.argValues.Length; i++)
            {
                if (payload.argValues[i].valueHnd != null)
                {
                    fnArguments[i] = instances[(string)payload.argValues[i].valueHnd];
                }
                else
                {
                    fnArguments[i] = payload.argValues[i].valuePrimitive;
                }
                fnArguments[i] = Convert.ChangeType(fnArguments[i], fnArgumentTypes[i]);
            }

            // Get the method info
            MethodInfo methodInfo = instances[payload.hnd].GetType().GetMethod(payload.name, fnArgumentTypes);

            // Invoke the method
            var result = methodInfo.Invoke(instances[payload.hnd], fnArguments);
            return methodInfo.ReturnType == typeof(void) ? "{ \"primitiveValue\": null }" : createReturnType(result.GetType(), result);
        }

        [DataContract]
        private class GetPropPayload
        {
            [DataMember(Name = "hnd")]
            public string hnd { get; set; }
            [DataMember(Name = "name")]
            public string name { get; set; }
            [DataMember(Name = "isAttached")]
            public bool isAttached { get; set; }
        }
        private string getProp(string value)
        {
            // Deserialize the data
            DataContractJsonSerializer ser = new DataContractJsonSerializer(typeof(GetPropPayload));
            var payload = (GetPropPayload)ser.ReadObject(new MemoryStream(Encoding.UTF8.GetBytes(value)));

            // Get the property
            var prop = instances[payload.hnd].GetType().GetProperty(payload.name).GetValue(instances[payload.hnd]);
            var propType = prop.GetType();

            // Convert the result to the appropriate string and return it
            return createReturnType(propType, prop);
        }

        [DataContract]
        private class SetPropPayload
        {
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
        private string setProp(string value)
        {
            // Deserialize the data
            DataContractJsonSerializer ser = new DataContractJsonSerializer(typeof(SetPropPayload));
            var payload = (SetPropPayload)ser.ReadObject(new MemoryStream(Encoding.UTF8.GetBytes(value)));

            // Get the property type
            var propertyInfo = instances[payload.hnd].GetType().GetProperty(payload.name);

            // Set the property type, looking up the handle if necessary
            if (payload.valueHnd == null)
            {
                propertyInfo.SetValue(instances[payload.hnd], Convert.ChangeType(payload.valuePrimitive, propertyInfo.PropertyType));
            }
            else
            {
                propertyInfo.SetValue(instances[payload.hnd], instances[payload.valueHnd]);
            }

            return "{}";
        }
    }
}