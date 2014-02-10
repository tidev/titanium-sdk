using System.Reflection;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Resources;

// General Information about an assembly is controlled through the following
// set of attributes. Change these attribute values to modify the information
// associated with an assembly.
[assembly: AssemblyTitle("<%= projectName %>")]
[assembly: AssemblyDescription("<%= projectDescription %>")]
[assembly: AssemblyConfiguration("")]
[assembly: AssemblyCompany("<%= company %>")]
[assembly: AssemblyProduct("<%= projectName %>")]
[assembly: AssemblyCopyright("<%= copyright %>")]
[assembly: AssemblyTrademark("")]
[assembly: AssemblyCulture("")]

// Setting ComVisible to false makes the types in this assembly not visible
// to COM components.  If you need to access a type in this assembly from
// COM, set the ComVisible attribute to true on that type.
[assembly: ComVisible(false)]

// The following GUID is for the ID of the typelib if this project is exposed to COM
[assembly: Guid("<%= assemblyGUID %>")]

// Version information for an assembly consists of the following four values:
//
//      Major Version
//      Minor Version
//      Build Number
//      Revision
//
// You can specify all the values or you can default the Revision and Build Numbers
// by using the '*' as shown below:
[assembly: AssemblyVersion("<%= projectVersion %>")]
[assembly: AssemblyFileVersion("<%= projectVersion %>")]
[assembly: NeutralResourcesLanguageAttribute("en-US")]
