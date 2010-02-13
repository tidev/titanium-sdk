Titanium.include('soap_client_library.js');


var url = "http://www.webservicex.net/CurrencyConvertor.asmx";
var pl = new SOAPClientParameters();

SOAPClient.invoke(url,"ConversionRate",pl,true,function(r)
{
	Ti.API.info('r.length ' + r.length)
	var data = [];
	var letter = null;
	for (var c=0;c<r.length;c++)
	{
		// this is particular to this webservice which has multiple lists - just break at ALL
		if (!r[c].CurrencyName)
		{
			break;
		}
		data[c] = {title:r[c].CurrencyName+' ('+r[c].CurrencyShortName+')'};
		try
		{
			if (r[c] && (letter == null || letter!=r[c].CurrencyName.charAt(0)))
			{
				letter = r[c].CurrencyName.charAt(0);
				data[c].header = letter;
			}
		}
		catch(X)
		{
			console.error(X);
		}
	}
	var tableView = Titanium.UI.createTableView({data:data});
	Titanium.UI.currentWindow.add(tableView);
});