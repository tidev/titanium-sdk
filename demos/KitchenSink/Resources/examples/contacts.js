var win = Titanium.UI.currentWindow;

// build contacts table view
var data = [{label:'Add Contact', backgroundColor:'#13386c',rowHeight:40,layout:[{top:5,name:'label',textAlign:'center',color:'#fff'}]}];
var contacts = Titanium.Contacts.getAllContacts();
for (var i=0;i<contacts.length;i++)
{
	var c = contacts[i]
	Ti.API.info('name ' + c.firstName)
	data.push({contact:c.firstName,hasChild:true});
}

var template = {
	rowHeight:50,
 	layout:[
   		{type:'text', name:'contact', top:10, left:10},
	]
};
var tableview = Titanium.UI.createTableView({
	data:data,
	template:template
});

tableview.addEventListener('click', function(e)
{
	var fn = Titanium.UI.createTextField({
		width:150
	});
	var ln = Titanium.UI.createTextField({
		width:150
	});
	var email = Titanium.UI.createTextField({
		width:150
	});

	if (e.index != 0)
	{
		fn.value = contacts[e.index].firstName;
		ln.value = contacts[e.index].lastName;
		email.value = contacts[e.index].email;
	}
	var contact = contacts[e.index];

	var inputData = [
		{title:'First Name', input:fn,  fontSize:14},
		{title:'Last Name', input:ln,fontSize:14},
		{title:'Email', input:email,fontSize:14},
	];
	var inputSection = Titanium.UI.iPhone.createGroupedSection({
		header:((e.index==0)?'New Contact':'Edit Contact'),
		type:'input',
		data:inputData,
	});
	var buttonData = [
		{title:'Save Contact', fontSize:16}
	];

	var buttonSection = Titanium.UI.iPhone.createGroupedSection({
		type:'button',
		data:buttonData,
	});
	buttonSection.addEventListener('click', function()
	{
		var contact = Ti.Contacts.createContact();
		contact.firstName = fn.value;
		contact.lastName = ln.value;
		contact.save();
		editWin.close();
		
	});
	
	// create grouped view
	groupedView = Titanium.UI.iPhone.createGroupedView();
	groupedView.addSection(inputSection);
	groupedView.addSection(buttonSection);
	
	var editWin = Titanium.UI.createWindow({title:((e.index==0)?'New Contact':'Edit Contact')});
	editWin.add(groupedView)

	Titanium.UI.currentTab.open(editWin,{animated:true});

});
win.add(tableview);



