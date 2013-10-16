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
            var matches = fileRequestRegex.Match(e.Value);
            var id = matches.Groups[1].Value;
            var file = matches.Groups[2].Value;
            var streamReader = new StreamReader("App/" + file);
            var fileContents = streamReader.ReadToEnd();
            browser.InvokeScript("handleMessage", id, fileContents);
        }
    }
}