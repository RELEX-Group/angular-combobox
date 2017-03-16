#angular-combobox — AngularJS directive for selecting items from tree.

## Dependences

**[anular](http://angularjs.org)**
**[bootstrap v3.3.7](http://getbootstrap.com/)**

## Options

* dataListFn(item, filterQuery, offset)	Implement this function. It used for getting data and should return data or promise

Default values

* debounce: 500 - Delay before loading filtered data
* recordsLimit: 100 - Max count of items on dropdownList page
* selectedLimit: 100 - Max count of items on selectedItems page
* isMultipleSelection: false - If true, user can select a few items, otherwise user can select only one item
* showSearchBox: true - True if need add search box
* placeholder: '' - This text will be written in combobox if selectedItems is empty
* lazyLoad: false - False if loaded data should be cached
* closeList: false - If true, list will be closed after user select item
* combobox: "default" - This field use for getting categories list
* fields: {key: 'key', title: 'value', childrenCount: 'childrenCount', type: 'type'} - Item fields
* categories: {'default': {
'1': {title: 'First level', style: 'label-danger'},
'2': {title: 'Second level', style: 'label-info'},
'3': {title: 'Third level', style: 'label-warning'},
'4': {title: 'Fourth level', style: 'label-primary'}}} - Categories accordance to items types

## Open API


* cancelPendingRequests()		    Cancels all pending requests
* clearFilter()					    Cleans filter query
* showHideDropdownList()			Toggles dropdown list visibility
* clearSelection()				    Cleans selectedItems
* goBack()						    Goes to prev level
* openNextLevel(item)			    Goes to next level
* isSelected(item)				    Returns true if item is selected
* loadMoreDropdownItems()		    Loads more data for dropdownList
* loadMoreSelectedItems()		    Increases selected items limit on page
* composeKey(item, filterQuery)		You may override this function if your data contains items with not unique keys. It generates key for internal model
