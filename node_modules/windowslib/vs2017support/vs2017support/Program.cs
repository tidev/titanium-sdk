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
                var config = new SetupConfiguration();
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
                if (e.HResult != REGDB_E_CLASSNOTREG)
                {
                    Console.Write("\"issues\": [");
                    Console.Write("\n\t{");
                    Console.Write("\n\t\t\"id\": \"WINDOWS_VISUALSTUDIO_2017_DETECT\",");
                    Console.Write("\n\t\t\"type\": \"error\",");
                    Console.Write("\n\t\t\"message\": \"" + SanitizeForJSON(e.Message) + "\"");
                    Console.Write("\n\t}");
                    Console.WriteLine("\n]");
                }
                else
                {
                    Console.Write("\"issues\": []");
                }
            }
            Console.WriteLine("}");
        }

        static String SanitizeForJSON(String str)
        {
            return str.Replace("\"", "\\\"").Replace("\r", "\\r").Replace("\n", "\\n");
        }
    }
}
