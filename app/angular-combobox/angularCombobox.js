angular.module('angular.combobox', []);
angular.module('angular.combobox')
/**
 * Angular Combobox Service provides open api for developers.
 *
 * cancelPendingRequests()		    Cancels all pending requests
 * clearFilter()				    Cleans filter query
 * showHideDropdownList()		    Toggles dropdown list visibility
 * clearSelection()				    Cleans selectedItems
 * goBack()						    Goes to prev level
 * openNextLevel(item)			    Goes to next level
 * isSelected(item)				    Returns true if item is selected
 * loadMoreDropdownItems()		    Loads more data for dropdownList
 * loadMoreSelectedItems()		    Increases selected items limit on page
 *
 * composeKey(item, filterQuery)    Generates key for internalModel. May be override if all keys are not unique
 */
    .service('angularComboboxService', function(){
        var comboboxes = {};

        return {
            /*
             * Returns current combobox functions by id
             */
            get: function (id) {
                if (!comboboxes[id]) {
                    comboboxes[id] = {}
                }
                return comboboxes[id];
            }
        }
    })
/**
 * Angular Combobox Provider contains combobox options
 */
    .provider('angularCombobox', function () {
        return {
            options: {
                debounce: 500,                      // Delay before loading filtered data
                recordsLimit: 100,                  // Max count of items on dropdownList page
                selectedLimit: 100,                 // Max count of items on selectedItems page
                isMultipleSelection: false,         // If true, user can select a few items, otherwise user can select only one item
                showSearchBox: true,                // True if need add search box
                placeholder: '',                    // This text will be written in combobox if selectedItems is empty
                lazyLoad: false,                    // False if loaded data should be cached
                closeList: false,                   // If true, list will be closed after user select item
                combobox: "default",                // This field use for getting categories list
                fields: {                           // Item fields
                    key: 'key',
                    title: 'value',
                    childrenCount: 'childrenCount',
                    type: 'type'
                },
                categories: {                       // Categories accordance to items types
                    'default': {
                        '1': {
                            title: 'First level',
                            style: 'label-danger'
                        },
                        '2': {
                            title: 'Second level',
                            style: 'label-info'
                        },
                        '3': {
                            title: 'Third level',
                            style: 'label-warning'
                        },
                        '4': {
                            title: 'Fourth level',
                            style: 'label-primary'
                        }
                    }
                }
            },
            setOptions: function (optionsToExtend) {
                this.options = angular.merge(this.options, optionsToExtend);
            },
            $get: function () {
                return {
                    options: this.options
                };
            }
        };
    })
/**
 * Angular Combobox Directive controls combobox
 */
    .directive('angularCombobox', ['$document', '$timeout', '$q', 'angularCombobox', 'angularComboboxService',
        function ($document, $timeout, $q, angularCombobox, angularComboboxService) {
            /**
             * Checks if second array contains all items from first array
             * @param arr1 first array for check
             * @param arr2 second array for check
             * @param fields item fields
             * @returns True if second array contains all items from first array, false otherwise
             */
            function arrayContainsAll(arr1, arr2, fields) {
                if (arr1.length == 0 && arr2.length > 0) {
                    return false;
                }
                for (var i in arr1) {
                    if (!arrayContains(arr2, arr1[i], fields))
                        return false;
                }
                return true;
            }

            /**
             * Checks if array contains item
             * @param arr array
             * @param elem item
             * @param fields item fields
             * @returns True if array contains item, false otherwise
             */
            function arrayContains(arr, elem, fields){
                if (!arr || arr.length == 0){
                    return false;
                }
                for (var i in arr){
                    if (isEquals(arr[i], elem, fields)){
                        return true;
                    }
                }
                return false;
            }

            /**
             * Checks if items are equals
             * @param item1 first item
             * @param item2 second item
             * @param fields item fields
             * @returns True if items are equals, false otherwise
             */
            function isEquals(item1, item2, fields) {
                for (var i in fields) {
                    if (item1[fields[i]] != item2[fields[i]]) {
                        return false;
                    }
                }
                return true;
            }

            return {
                restrict: 'E',
                require: 'ngModel',
                scope: {
                    comboboxOptions: "=options"
                },
                templateUrl: "../templates/template.html",
                controller: ['$scope', function ($scope) {
                    $scope.options = {};
                    $scope.selectedItems = [];
                    $scope.internalModel = {};
                    $scope.dropdownList = [];
                    $scope.currentInternalModelItem = null;
                    $scope.breadcrumbs = [];
                    $scope.dropdownVisible = false;
                    $scope.forcedServerRequest = false;
                    $scope.filter = {
                        query: ''
                    };

                    var id = $scope.comboboxOptions.combobox;

                    // Developer may override this function
                    if (!angularComboboxService.get(id).composeKey) {
                        /**
                         * Generates key for internalModel
                         * @param item parent item
                         * @param filterQuery query from searchBox
                         * @returns Generated key
                         */
                        angularComboboxService.get(id).composeKey = function (item, filterQuery) {
                            return (item && (item[$scope.fields.key] || item[$scope.fields.key]==0) ? item[$scope.fields.key] : 'root') + (filterQuery ? filterQuery : $scope.filter.query);
                        };
                    }

                    /**
                     * Cancels all pending requests
                     */
                    angularComboboxService.get(id).cancelPendingRequests = function () {
                        for (var item in $scope.internalModel) {
                            if ($scope.internalModel[item].deferredObject != null) {
                                $scope.internalModel[item].deferredObject.reject("cancelled");
                            }
                        }
                    };

                    $scope.$watch(function () {
                        return $scope.filter.query;
                    }, function (newValue, oldValue) {
                        if (newValue != oldValue) {
                            angularComboboxService.get(id).cancelPendingRequests();
                            $scope.getData(null, newValue);
                        }
                    });

                    /**
                     * Cleans filter query
                     * @type {Function}
                     */
                    $scope.clearFilter = angularComboboxService.get(id).clearFilter = function () {
                        $scope.filter.query = '';
                    };

                    /**
                     * Check if data has already been loaded
                     * @returns Returns true if data have already been loaded, false otherwisw
                     */
                    $scope.isDataLoading = function () {
                        return $scope.currentInternalModelItem && $scope.currentInternalModelItem.deferredObject != null;
                    };

                    /**
                     * Fill internal model
                     * @param item parent item
                     * @param filterQuery query from searchBox
                     * @param offset offset for pagination
                     * @returns promise
                     */
                    $scope.getData = function (item, filterQuery, offset) {
                        var itemKey = angularComboboxService.get(id).composeKey(item, filterQuery);
                        var deferred = $q.defer();

                        var dataOrPromise = null;
                        if ($scope.internalModel[itemKey] == null || $scope.forcedServerRequest || $scope.options.lazyLoad ||
                            !!offset && offset != 0 && $scope.dropdownList.length < (offset + $scope.options.recordsLimit)) {
                            if (!offset || offset == 0) {
                                $scope.internalModel[itemKey] = {
                                    title: item ? item[$scope.fields.title] : null,
                                    deferredObject: deferred,
                                    data: [],
                                    totalCount: 0
                                };
                            }
                            dataOrPromise = $scope.options.dataListFn(item, filterQuery, offset);
                        }else{
                            dataOrPromise = $scope.internalModel[itemKey];
                        }
                        $scope.currentInternalModelItem = $scope.internalModel[itemKey];
                        if (!item) {
                            $scope.breadcrumbs = [];
                        }
                        var promise = $q.when(dataOrPromise);
                        promise.then(function (data) {
                            // we have received the data from outbound promise
                            return deferred.resolve(data);
                        });

                        deferred.promise.then(function (result) {
                            if (!!offset && offset != 0){
                                $scope.internalModel[itemKey].recordsLimit += $scope.options.recordsLimit;
                                if ($scope.dropdownList.length < $scope.internalModel[itemKey].recordsLimit) {
                                    $scope.dropdownList = $scope.dropdownList.concat(result.data);
                                    $scope.internalModel[itemKey].data = $scope.internalModel[itemKey].data.concat(result.data);
                                }
                            } else {
                                $scope.dropdownList = result.data;
                                $scope.internalModel[itemKey].data = result.data;
                                $scope.internalModel[itemKey].recordsLimit = result.recordsLimit || $scope.options.recordsLimit;
                            }
                            $scope.countRecordsLimit = $scope.internalModel[itemKey].recordsLimit;
                            $scope.internalModel[itemKey].totalCount = result.totalCount;
                        }).catch(function (reason) {
                            delete $scope.internalModel[itemKey];
                            return $q.reject(reason);
                        }).finally(function () {
                            $scope.internalModel[itemKey].deferredObject = null;
                        });
                        return deferred.promise;
                    };

                    /**
                     * Toggles dropdown list visibility
                     * @type {Function}
                     */
                    $scope.showHideDropdownList = angularComboboxService.get(id).showHideDropdownList = function () {
                        $scope.dropdownVisible = !$scope.dropdownVisible;
                    };

                    /**
                     * Gets labels class
                     * @param item item
                     * @returns labels class
                     */
                    $scope.getLabelClass = function (item) {
                        var categoryType = item[$scope.fields.type];
                        return angular.isDefined(categoryType) && $scope.category[categoryType] ? $scope.category[categoryType].style : 'label-brand';
                    };

                    /**
                     * Gets labels title
                     * @param item item
                     * @returns labels title
                     */
                    $scope.getLabelTitle = function (item) {
                        var categoryType = item[$scope.fields.type];
                        return angular.isDefined(categoryType) && $scope.category[categoryType] ? $scope.category[categoryType].title : '';
                    };

                    /**
                     * Goes to prev level
                     * @type {Function}
                     */
                    $scope.goBack = angularComboboxService.get(id).goBack = function ($event) {
                        if (!!$event) {
                            $event.stopPropagation();
                        }
                        angularComboboxService.get(id).cancelPendingRequests();
                        $scope.breadcrumbs.splice(-1, 1);
                        $scope.getData($scope.breadcrumbs[$scope.breadcrumbs.length - 1]);
                    };

                    /**
                     * Goes to next level
                     * @type {Function}
                     */
                    $scope.openNextLevel = angularComboboxService.get(id).openNextLevel = function (item, $event) {
                        if (!!$event) {
                            $event.stopPropagation();
                        }
                        $scope.breadcrumbs.push(item);
                        $scope.getData(item);
                    };

                    /**
                     * Removes selected item if its parent is selected too
                     * @param item parent item
                     */
                    function removeSelectedChildren(item) {
                        var itemKey = angularComboboxService.get(id).composeKey(item, $scope.filter.query);
                        if ($scope.internalModel[itemKey]) {
                            angular.forEach($scope.internalModel[itemKey].data, function (value) {
                                removeSelectedChildren(value);
                                var index = indexOfItem(value);
                                if (index != -1) {
                                    $scope.selectedItems.splice(index, 1);
                                }
                            });
                        }
                    }

                    /**
                     * Finds item in selectedItems
                     * @param item item
                     * @returns index
                     */
                    function indexOfItem(item) {
                        for (var i in $scope.selectedItems) {
                            if (isEquals($scope.selectedItems[i], item, $scope.fields)) {
                                return i;
                            }
                        }
                        return -1;
                    }

                    /**
                     * Adds item to selectedItems
                     * @param item item gor adding
                     */
                    $scope.selectItem = function (item) {
                        if (!$scope.isMultipleSelection && $scope.selectedItems.length > 0) {
                            $scope.selectedItems.splice(0, $scope.selectedItems.length);
                        }
                        removeSelectedChildren(item);
                        $scope.selectedItems.push(item);
                        if (!$scope.isMultipleSelection || $scope.options.closeList) {
                            $scope.dropdownVisible = false;
                        }
                        $scope.setViewValue($scope.selectedItems);
                    };

                    /**
                     * Removes item from selectedItems
                     * @param $event click event
                     * @param item item for romoving
                     */
                    $scope.removeItem = function ($event, item) {
                        if (!!$event) {
                            $event.stopPropagation();
                        }
                        $scope.selectedItems.splice(indexOfItem(item), 1);
                        $scope.dropdownVisible = true;
                        $scope.setViewValue($scope.selectedItems);
                    };

                    /**
                     * Cleans selectedItems
                     * @type {Function}
                     */
                    $scope.clearSelection = angularComboboxService.get(id).clearSelection = function ($event) {
                        if (!!$event) {
                            $event.stopPropagation();
                        }
                        $scope.selectedItems.splice(0, $scope.selectedItems.length);
                        $scope.countSelectedLimit = $scope.options.selectedLimit;
                        $scope.setViewValue($scope.selectedItems);
                    };

                    /**
                     * Check if item is selected
                     * @returns True if item is selected
                     * @type {Function}
                     */
                    $scope.isSelected = angularComboboxService.get(id).isSelected = function (item) {
                        var selectedItems = $scope.selectedItems;
                        for (var i=0; i<selectedItems.length; i++){
                            if (isEquals(selectedItems[i], item, $scope.fields)){
                                return true;
                            }
                        }
                        return false;
                    };

                    /**
                     * Loads more data for dropdownList
                     * @type {Function}
                     */
                    $scope.loadMoreDropdownItems = angularComboboxService.get(id).loadMoreDropdownItems = function() {
                        $scope.getData(
                            $scope.breadcrumbs.length > 0 ? $scope.breadcrumbs[$scope.breadcrumbs.length - 1] : null,
                            $scope.filter.query,
                            $scope.countRecordsLimit);
                    };

                    /**
                     * Check if dropdownList is empty
                     * @returns True if dropdownList is empty
                     */
                    $scope.isEmpty = function () {
                        return $scope.dropdownList && ($scope.dropdownList.length == 0 || arrayContainsAll($scope.dropdownList, $scope.selectedItems, $scope.fields));
                    };

                    /**
                     * Increases selected items limit on page
                     * @type {Function}
                     */
                    $scope.loadMoreSelectedItems = angularComboboxService.get(id).loadMoreSelectedItems = function($event){
                        if (!!$event) {
                            $event.preventDefault();
                            $event.stopPropagation();
                        }
                        $scope.countSelectedLimit += $scope.options.selectedLimit;
                    };

                    /**
                     * Changes text if it contains html tags for output text
                     * @param itemWithHtmlTags Item wich contains html tags
                     * @returns item without html tags
                     */
                    $scope.escapeHtmlTags = function (itemWithHtmlTags) {
                        var itemWithoutHtmlTags;
                        if (angular.isObject(itemWithHtmlTags)){
                            itemWithoutHtmlTags=new Object();
                            angular.forEach(itemWithHtmlTags,function(value, key){
                                itemWithoutHtmlTags[key]=$scope.escapeHtmlTags(value);
                            });
                        }else {
                            itemWithoutHtmlTags = angular.element('<html></html>').text(itemWithHtmlTags).html();
                        }
                        return itemWithoutHtmlTags;
                    }
                }],
                link: function ($scope, element, attrs, ctrl) {
                    angular.extend($scope.options, angularCombobox.options, $scope.comboboxOptions);
                    $scope.countSelectedLimit = $scope.options.selectedLimit;
                    $scope.category = $scope.options.combobox && $scope.options.categories[$scope.options.combobox]
                        ? $scope.options.categories[$scope.options.combobox] : $scope.options.categories.default;
                    $scope.hasCategories = $scope.options.combobox && angular.isDefined($scope.options.categories[$scope.options.combobox]) &&
                        Object.getOwnPropertyNames($scope.options.categories[$scope.options.combobox]).length > 0;
                    $scope.isMultipleSelection = $scope.options.isMultipleSelection;
                    $scope.fields = $scope.options.fields;

                    $scope.recordsLimit = $scope.options.recordsLimit;
                    ctrl.$render = function () {
                        $scope.selectedItems = ctrl.$modelValue;
                    };

                    /**
                     * Closes dropdownList if user clicks on other place
                     * @param event Click event
                     */
                    var onClick = function (event) {
                        var isChild = element[0].contains(event.target);
                        var isSelf = element[0] == event.target;
                        var isInside = isChild || isSelf;
                        if (!isInside) {
                            $scope.dropdownVisible = false;
                            $scope.$apply()
                        }
                    };

                    /**
                     * Sets view value
                     * @param model view value
                     */
                    $scope.setViewValue = function(model){
                        ctrl.$setViewValue([].concat(model));
                    };

                    /**
                     * Overrides ngModel.isEmpty
                     * @param value
                     * @returns True if ngModel is empty
                     */
                    ctrl.$isEmpty = function(value) {
                        return angular.isArray(value) && value.length == 0;
                    };

                    $scope.$watch(function () {
                        return $scope.dropdownVisible
                    }, function (newValue, oldValue) {
                        if (newValue != oldValue) {
                            if (newValue) {
                                $document.on('click', onClick);
                                $timeout(function () {
                                    if ($scope.options.lazyLoad) {
                                        $scope.getData().then(function() {
                                            setFocus();
                                        })
                                    } else {element[0].focus();
                                        setFocus();
                                    }
                                });
                            } else {
                                $scope.filter.query = '';
                                $document.off('click', onClick);
                            }
                        }
                    });

                    /**
                     * Loads data only if not need lazy load
                     */
                    if (!$scope.options.lazyLoad) {
                        $scope.getData();
                    }

                    /**
                     * Set focus on filter
                     */
                    var setFocus = function () {
                        angular.forEach(angular.element(element).find('input'), function (element) {
                            if (element.id == "search-box") {
                                element.focus();
                            }
                        })
                    }
                }
            };
        }])
/**
 * Search filter marked query in item
 */
    .filter('searchFilter', function () {
        return function (input, filterQuery) {
            if (!angular.isDefined(filterQuery) || filterQuery === '') {
                return input;
            }
            return input.replace(new RegExp('(' + filterQuery + ')', 'gi'), '<b>$1</b>');
        }
    });