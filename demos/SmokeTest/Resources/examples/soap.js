Titanium.include('suds.js');
var window = Ti.UI.currentWindow;
var label = Ti.UI.createLabel({
    top: 10,
    left: 10,
    width: 'auto',
    height: 'auto',
    text: 'Contacting currency rates web service...'
});

window.add(label);


var url = "http://www.webservicex.net/CurrencyConvertor.asmx";
var callparams = {
    FromCurrency: 'EUR',
    ToCurrency: 'USD'
};

var suds = new SudsClient({
    endpoint: url,
    targetNamespace: 'http://www.webserviceX.NET/'
});

try {
    suds.invoke('ConversionRate', callparams, function(xmlDoc) {
        var results = xmlDoc.documentElement.getElementsByTagName('ConversionRateResult');
        if (results && results.length>0) {
            var result = results.item(0);
            label.text = '1 Euro buys you ' + results.item(0).text + ' U.S. Dollars.';
        } else {
            label.text = 'Oops, could not determine result of SOAP call.';
        }
    });
} catch(e) {
    Ti.API.error('Error: ' + e);
}
