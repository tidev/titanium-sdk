function list_v2_index_bar(_args) {
	var win = Ti.UI.createWindow({
		title:'Index Bar',
	});

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

	var indices = [
	{index:0,title:'Fru'},
	{index:1,title:'Veg'},
	{index:2,title:'Fis'},
	{index:3,title:'Ani'}
	];
	
	listView.sectionIndexTitles = indices;
	
	win.add(listView);
	
	return win;
};

module.exports = list_v2_index_bar;