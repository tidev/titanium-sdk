function isValidVar(check){
    if (check !== undefined && check !== null){
        return true;
    }
    return false;
}

function clickHandler(e){
    var message = 'Type:'+e.type+'\nSection title:'+e.section.headerTitle+'\nsectionIndex:'+e.sectionIndex+'\nitemIndex:'+e.itemIndex;
    if(isValidVar(e.bindId)){
        message += '\nbindId:'+e.bindId;
    }
    if(isValidVar(e.itemId)){
        message += '\nitemId:'+e.itemId;
    }
    alert(message);
}

function genTest(win) {
	var sections = [];
	 
	var fruitSection = Ti.UI.createListSection({ headerTitle: 'Fruits'});
	var fruitDataSet = [
	    {properties: { title: 'Apple', searchableText:' Fruits Apple', itemId:'0 0'}},
	    {properties: { title: 'Banana', searchableText:'Fruits Banana', itemId:'0 1'}},
	    {properties: { title: 'Cantaloupe', searchableText:'Fruits Cantaloupe', itemId:'0 2'}},
	    {properties: { title: 'Fig', searchableText:'Fruits Fig', itemId:'0 3'}},
	    {properties: { title: 'Guava', searchableText:'Fruits Guava', itemId:'0 4'}},
	    {properties: { title: 'Kiwi', searchableText:'Fruits Kiwi', itemId:'0 5'}},
	];
	fruitSection.setItems(fruitDataSet);
	sections.push(fruitSection);
	 
	var vegSection = Ti.UI.createListSection({ headerTitle: 'Vegetables'});
	var vegDataSet = [
	    {properties: { title: 'Carrots', searchableText:'Vegetables Carrots', itemId:'1 0'}},
	    {properties: { title: 'Potatoes', searchableText:'Vegetables Potatoes', itemId:'1 1'}},
	    {properties: { title: 'Corn', searchableText:'Vegetables Corn', itemId:'1 2'}},
	    {properties: { title: 'Beans', searchableText:'Vegetables Beans', itemId:'1 3'}},
	    {properties: { title: 'Tomato', searchableText:'Vegetables Tomato', itemId:'1 4'}},
	];
	vegSection.setItems(vegDataSet);
	sections.push(vegSection);
	 
	 
	var fishSection = Ti.UI.createListSection({ headerTitle: 'Fish'});
	var fishDataSet = [
	    {properties: { title: 'Cod', searchableText:'Fish Cod', itemId:'2 0'}},
	    {properties: { title: 'Haddock', searchableText:'Fish Haddock', itemId:'2 1'}},
	    {properties: { title: 'Salmon', searchableText:'Fish Salmon', itemId:'2 2'}},
	    {properties: { title: 'Tuna', searchableText:'Fish Tuna', itemId:'2 3'}},
	];
	fishSection.setItems(fishDataSet);
	sections.push(fishSection);
	
	var animalsSection = Ti.UI.createListSection({ headerTitle: 'Animals'});
	var animalsDataSet = [
	    {properties: { title: 'Deer', searchableText:'Animals Deer', itemId:'3 0'}},
	    {properties: { title: 'Dog', searchableText:'Animals Dog', itemId:'3 1'}},
	    {properties: { title: 'Cat', searchableText:'Animals Cat', itemId:'3 2'}},
	    {properties: { title: 'Elephant', searchableText:'Animals Elephant', itemId:'3 3'}},
	];
	animalsSection.setItems(animalsDataSet);
	sections.push(animalsSection);

	var listView = Ti.UI.createListView();
	listView.sections = sections;
	listView.headerTitle = 'ListView can now show searchView and headerTitle (or headerView) together';
	
	var sv = Titanium.UI.createSearchBar({
	        barColor:'#385292',
	        showCancel:true,
	        hintText:'search'
	    });
	
	listView.searchView = sv;
	
	win.add(listView);
	
	listView.addEventListener('itemclick', clickHandler);

}

function list_v2_search_searchview(_args) {

	var win = Ti.UI.createWindow({
		title:'Basic Search',
	});

	var scrollView = Ti.UI.createScrollView({layout:'vertical'});
	
	var desc = Ti.UI.createLabel({
		text:'This test shows the basic search support in ListView. Basic search is supported by the searchView property of ListView.\n\n'+
		'The searchable content is defined by the searchableText property of the ListItem.\n\n'+
		'The caseInsensitiveSearch property (default true) of ListView controls if the search is case sensitive or not.\n\n'+
		'The searchableText in the following example is set to headerTitle+ +title.\n\n'
	});
	
	scrollView.add(desc);
	
	var button = Ti.UI.createButton({
		top:10,
		title:'I understand'
	});
	
	scrollView.add(button);
	
	button.addEventListener('click',function(){
		win.remove(scrollView);
		genTest(win);
	});
	
	win.add(scrollView);

	return win;

};
module.exports = list_v2_search_searchview;