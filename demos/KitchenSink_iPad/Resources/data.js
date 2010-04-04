var testData = {};

testData.windows = [
	{title:'Modal Window',header:'Windows'},
	{title:'Modal Window 2',backgroundColor:'#eee'}
];

testData.views = [
	{title:'View 1',header:'Views'},
	{title:'View 2',backgroundColor:'#eee'}
];

testData.controls = [
	{title:'Controls 1',header:'Controls'},
	{title:'Controls 2',backgroundColor:'#eee'}
];

testData.platform = [
	{title:'Platform 1',header:'Platform'},
	{title:'Platform 2',backgroundColor:'#eee'}
];

testData.device = [
	{title:'Device 1',header:'Device'},
	{title:'Device 2',backgroundColor:'#eee'}
];

function getTestDataForSection(section)
{
	return testData[section];
}
