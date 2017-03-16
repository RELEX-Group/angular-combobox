angular.module('ng-combo')
    .controller("ComboboxUsageCtrl", ['$scope', "$http", 'angularComboboxService',
        function($scope, $http, angularComboboxService) {
            $scope.selectedElements = [];
            $scope.comboboxOptions = {
                dataListFn: function (item, filterQuery, offset) {
                    return $http.get('data/example.json').then(function (result) {
                        var data = result.data;
                        if (!!filterQuery && filterQuery != '') {
                            return $scope.filterData(data, filterQuery);
                        }
                        if (!item) {
                            return data.locations.root;
                        }
                        for (var i in data) {
                            if (!!data[i][item.key]) {
                                return data[i][item.key];
                            }
                        }
                    });
                },
                placeholder: "Select",
                combobox: "comboExample",
                recordsLimit: 10,
                selectedLimit: 5,
                isMultipleSelection: true,
                debounce: 1000,
                lazyLoad: true,
                categories: {
                    'comboExample': {
                        '1': {
                            title: 'Organization',
                            style: 'label-danger'
                        },
                        '2': {
                            title: 'Facility',
                            style: 'label-info'
                        },
                        '3': {
                            title: 'Department',
                            style: 'label-warning'
                        },
                        '4': {
                            title: 'Sub-Department',
                            style: 'label-primary'
                        }
                    }
                }
            };

            $scope.filterData = function(data, filter) {
                var newData = [];
                angular.forEach(data, function (arr) {
                    angular.forEach(arr, function(level) {
                        angular.forEach(level.data, function(item) {
                            if (item.value.toLowerCase().indexOf(filter.toLowerCase()) != -1) {
                                newData.push(item);
                            }
                        });
                    });
                });
                return {data: newData, totalCount: newData.length};
            }
        }]);