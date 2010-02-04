var win = Titanium.UI.currentWindow;

var search = Titanium.UI.createSearchBar({
	barColor:'#000', 
	showCancel:true,
	height:43,
	top:0
});

win.add(search);

// dynamically set value
search.value = 'foo';

// change event listener
search.addEventListener('change', function(e)
{
	Titanium.API.info('search bar: you type ' + e.value);
	
});
search.addEventListener('cancel', function(e)
{
	Titanium.API.info('search bar cancel fired');
   	search.blur();
});
search.addEventListener('return', function(e)
{
	Titanium.UI.createAlertDialog({title:'Search Bar', message:'You typed ' + e.value }).show();
   	search.blur();
});
search.addEventListener('focus', function(e)
{
   	Titanium.API.info('search bar: focus received')
});
search.addEventListener('blur', function(e)
{
   	Titanium.API.info('search bar:blur received')
});
