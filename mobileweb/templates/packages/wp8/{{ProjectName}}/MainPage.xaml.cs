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
            var isBinary = e.Value[0] == 'b';
            var path = e.Value.Substring(1);
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
    }
}