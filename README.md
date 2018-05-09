exp-angular
===

Expansive plugin for Angular applications.

### Overview

The exp-angular plugin provides build tooling for Angular applications. It provides the 'angular.html' transform to compile Angular HTML views into pure Javascript. The 'angular.js' transform annotates Angular scripts so they can be minfied and the 'angular.package' transform bundles multiple Angular scripts into a single loadable application file.

### To install:

    pak install exp-angular

### Services

Provides the following transforms:
* angular.html
* angular.js
* angular.package

### Configuration

* compress &mdash; Enable compression of the resultant script file.
* dest &mdash; Destination bundled application file. Defaults to 'all.js'.
* dotmin &mdash; Use '.min.js' as the output extension after minification. Otherwise will be '.js'. Defaults to false.
* minify &mdash; Minify the final application file. Defaults to true.
* options &mdash; Options for the uglify command. Defaults to --mangle if minify is true, and --compress if compress is true.
* scripts &mdash; List of script files to package. Default to null which implies the automatic packaging of compiled scripts and script libraries.

## html

The angular.html transform compiles HTML views into scripts that preload the HTML into the client-side Angular browser cache. This replaces the HTML views with equivalent script files.

If the `minify` configuration is enabled, the script will also be minified.


## angular.js

The angular.js transform processes Angular script files so they can be minified. It does this by including explicit annotations for the Angular dependency injection service. By default, this service compiles files with a '*.js' or '*.js.ng' extension.

To specify the files to process, define the `scripts` property. For example:

```
"services": {
    "angular": {
        "scripts": [
            "**.js",
            '!lib/**.js',
            'lib/angular*/**.js',
            'lib/esp*/**.js'
        ]
    }
}
```

## angular.package

The angular.package transform packages all the Angular script files into a single, loadable application file. This includes compiled HTML views and Javascript libraries.

This transform requires the 'js' service to compute the order of Javascript libraries to include.

## Example

This example demonstrates the configuration for a production release.

```
{
    services: {
        "js": {
            minify: true
        },
        "css": {
            minify: true
        },
        "angular": {
            scripts: [
                "**.js",
                '!lib/**.js',
                'lib/angular*/**.js'
            ],
            "package": true
        },
    }
}
```

### Get Pak from

[https://www.embedthis.com/pak/](https://www.embedthis.com/pak/)
