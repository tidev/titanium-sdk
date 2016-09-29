using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Win32;

namespace AppLauncher
{
    class Program
    {
        static int Main(string[] args)
        {
            var appName = args[0];
            var appVersion = args[1];
            String appUserModelId = null;

            // Find the app id
            var appListKey = Registry.CurrentUser.OpenSubKey("Software\\Classes\\ActivatableClasses\\Package");
            foreach (var appKeyName in appListKey.GetSubKeyNames())
            {
                if (appKeyName.IndexOf(appName + "_" + appVersion + "_") == 0)
                {
                    var appKey = appListKey.OpenSubKey(appKeyName);
                    var subKey = appKey.OpenSubKey("Server\\App.wwa");
                    appUserModelId = (String)subKey.GetValue("AppUserModelId");
                }
            }
            if (appUserModelId == null)
            {
                Console.Error.WriteLine("Could not find version " + appVersion + " of application " + appName + " in the registry. Is the application installed?");
                return 1;
            }

            // Activate the application
            var aam = new ApplicationActivationManager();
            UInt32 id;
            aam.ActivateApplication(appUserModelId, null, ActivateOptions.None, out id);
            return 0;
        }
    }
}
