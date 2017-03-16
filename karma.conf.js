'use strict';

module.exports = function(config) {

    config.set({

        //// base path, that will be used to resolve files and exclude
        basePath: '',

        // testing framework to use (jasmine/mocha/qunit/...)
        frameworks: ['jasmine-jquery', 'jasmine'],

        // list of files / patterns to load in the browser
        files: [
            'http://ajax.googleapis.com/ajax/libs/angularjs/1.6.2/angular.min.js',
            'http://ajax.googleapis.com/ajax/libs/angularjs/1.6.2/angular-mocks.js',

            'angular-combobox/*.js',
            'templates/*.html',
            'tests/*.js',

            {pattern:  'examples/data/*.json', watched: true, served: true, included: false}
        ],

        // list of files / patterns to exclude
        exclude: [],

        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
        reporters: ['progress'],

        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,
        browsers: ['Chrome'],

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: true,

        preprocessors: {
            'templates/*.html': 'ng-html2js'
        },

        plugins: [
            'karma-jasmine',
            'karma-chrome-launcher',
            'karma-jasmine-jquery',
            'karma-ng-html2js-preprocessor'
        ]
    });

};