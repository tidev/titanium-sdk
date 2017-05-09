using System;
using System.Runtime.InteropServices;
using Microsoft.VisualStudio.Setup.Configuration;

namespace vs2017support
{
    class Program
    {
        private const int REGDB_E_CLASSNOTREG = unchecked((int)0x80040154);

        static void Main(string[] args)
        {
            Console.WriteLine("{");

            try
            {
                var config = GetSetupConfiguration();
                var instances = config.EnumAllInstances();

                Console.WriteLine("\"visualstudio\": {");

                int fetched;
                int count = 0;
                var setups = new ISetupInstance[1];
                do
                {
                    instances.Next(1, setups, out fetched);
                    if (fetched > 0)
                    {
                        if (count > 0)
                        {
                            Console.WriteLine(",");
                        }

                        var instance = (ISetupInstance2)setups[0];

                        Console.Write("\t\"" + SanitizeForJSON(instance.GetDisplayName()) + "\": {");
                        Console.Write("\n\t\t\"version\": \"" + SanitizeForJSON(instance.GetDisplayName()) + "\",");
                        Console.Write("\n\t\t\"supported\": \"" + (instance.IsComplete() ? "true" : "false") + "\",");
                        Console.Write("\n\t\t\"msbuildVersion\": \"" + instance.GetInstallationVersion() + "\",");
                        Console.Write("\n\t\t\"path\": \"" + SanitizeForJSON(instance.GetInstallationPath().Replace("\\", "\\\\")) + "\"");
                        Console.Write("\n\t}");
                        count++;
                    }
                }
                while (fetched > 0);

                Console.WriteLine("\n}");
            }
            catch (Exception e)
            {
                Console.Write("\"issues\": [");
                Console.Write("\n\t{");
                Console.Write("\n\t\t\"id\": \"WINDOWS_VISUALSTUDIO_2017_DETECT\",");
                Console.Write("\n\t\t\"type\": \"error\",");
                Console.Write("\n\t\t\"message\": \"" + SanitizeForJSON(e.Message) + "\"");
                Console.Write("\n\t}");
                Console.WriteLine("\n]");

            }

            Console.WriteLine("}");

        }

        static String SanitizeForJSON(String str)
        {
            return str.Replace("\"", "\\\"").Replace("\r", "\\r").Replace("\n", "\\n");
        }

        static ISetupConfiguration2 GetSetupConfiguration()
        {
            try
            {
                return new SetupConfiguration();
            }
            catch (COMException e) when (e.HResult == REGDB_E_CLASSNOTREG)
            {
                ISetupConfiguration config;
                if (GetSetupConfiguration(out config, IntPtr.Zero) < 0)
                {
                    return null;
                }
                return (ISetupConfiguration2)config;
            }
        }

        [DllImport("Microsoft.VisualStudio.Setup.Configuration.Native.dll", ExactSpelling = true, PreserveSig = true)]
        private static extern int GetSetupConfiguration(
            [MarshalAs(UnmanagedType.Interface), Out] out ISetupConfiguration configuration,
            IntPtr reserved);

    }
}
