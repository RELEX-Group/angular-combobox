'use strict';

describe('directive: angularCombobox', function() {
    var $scope, $http, $compile, isolatedScope, angularComboboxService, id;
    jasmine.getJSONFixtures().fixturesPath = 'base';

    function createSelect(template) {
        return function() {

            this.element = $compile(template)($scope);
            $scope.$digest();
            isolatedScope = this.element.isolateScope()
        };
    }

    beforeEach(module('angular.combobox'));
    beforeEach(module('templates/template.html'));


    beforeEach(inject(function($injector) {
        $scope = $injector.get('$rootScope').$new();
        $http = $injector.get('$httpBackend');
        $compile = $injector.get('$compile');
        angularComboboxService = $injector.get('angularComboboxService');
        $scope.selectedElements = [];
        var data = getJSONFixture('examples/data/example.json');
        $scope.comboboxOptions = {
            dataListFn: function (item, filterQuery, offset) {
                    if (!item) {
                        return data.locations.root;
                    }
                    for (var i in data) {
                        if (!!data[i][item.key]) {
                            return data[i][item.key];
                        }
                    }
            },
            combobox: "default",
            placeholder: "Select",
            recordsLimit: 6,
            selectedLimit: 10,
            isMultipleSelection: true,
            debounce: 1000,
            lazyLoad: true
        };
        id = $scope.comboboxOptions.combobox;
    }));

    /* --- TESTS --- */
    describe('all', function() {
        var template = '<angular-combobox id="combo1" options="comboboxOptions" ng-model="selectedElements"\
             ng-model-options="{debounce: 1000}"></angular-combobox>';
        var items = [{
            "key": 56,
            "value": "Department1",
            "childrenCount": 0,
            "type": 3
        }, {
            "key": 2,
            "value": "Organization3",
            "childrenCount": 5,
            "type": 1
        }, {
            "key": 25,
            "value": "Org4Fac1",
            "childrenCount": 3,
            "type": 2
        }];

        var parentItem = {
            "key": 3,
            "value": "Organization4",
            "childrenCount": 4,
            "type": 1
        };

        beforeEach(createSelect(template));

        it('clear selection', function() {
            for (var i in items) {
                $scope.selectedElements.push(items[i]);
            }
            expect($scope.selectedElements.length).toEqual(3);
            angularComboboxService.get(id).clearSelection();
            expect($scope.selectedElements.length).toEqual(0);
        });

        it('clear filter', function() {
            isolatedScope.filter.query = "44";
            angularComboboxService.get(id).clearFilter();
            expect(isolatedScope.filter.query == '').toEqual(true);
        });

        it('go to next level and back', function() {
            expect(isolatedScope.breadcrumbs.length).toEqual(0);
            angularComboboxService.get(id).openNextLevel(parentItem);
            expect(isolatedScope.breadcrumbs.length).toEqual(1);
            angularComboboxService.get(id).goBack();
            expect(isolatedScope.breadcrumbs.length).toEqual(0);
        });

        it('load more', function() {
            angularComboboxService.get(id).loadMoreDropdownItems();
            angularComboboxService.get(id).loadMoreSelectedItems();
        });
    });
});