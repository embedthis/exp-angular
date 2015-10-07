exp-angular
===

Expansive plugin for Angular applications.

### Overview

The exp-angular plugin provides build tooling for Angular applications. It provides the 'ng-compile-html' service to compile Angular HTML views into pure Javascript. The 'ng-compile-js' service annotates Angular scripts so they can be minfied and the 'package-ng' service bundles multiple Angular scripts into a single loadable application file.

### To install:

    pak install exp-angular

### Services

Provides the following services:
* ng-compile-html
* ng-compile-js
* ng-package

## ng-compile-html

The ng-compile-html service compiles HTML views into scripts that preload the HTML into the client-side Angular browser cache. This replaces the HTML views with equivalent script files.

If the `minify` configuration is enabled, the script will also be minified.

### Configuration

* compress &mdash; Enable compression of the resultant script file.
* minify &mdash; Enable minification of the resultant script file.

## ng-compile-js

The ng-compile-js service processes Angular script files so they can be minified. It does this by including explicit annotations for the Angular dependency injection service. By default, this service compiles files with a '*.js' or '*.js.ng' extension.

To specify the files to process, define the `files` property in the expansive.json ng-compile-js section. For example:
```
"services": {
    "ng-compile-js": {
        "files": [
            "contents/**.js",
            "lib/esp*/**.js",
            "lib/angular*/**.js"
        ]
    }
}
```

## ng-package

The ng-package service packages all the Angular script files into a single, loadable application file. This includes compiled HTML views and Javascript libraries.

This service requires the exp-js service to compute the order of Javascript libraries to include.

### Configuration

* files &mdash; List of files to package. Default to null which implies the automatic packaging of compiled scripts and script libraries.
* dest &mdash; Destination bundled application file. Defaults to 'all.js'.
* minify &mdash; Minify the final application file. Defaults to true.
* compress &mdash; Compress the finall application file. Defaults to true.
* mangle &mdash; Manage function and variable names. Defaults to true.
* dotmin &mdash; Use '.min.js' as the output extension after minification. Otherwise will be '.js'. Defaults to true.

## Example

This example demonstrates the configuration for a production release.

```
{
    services: {
        "minify-js": {
            minify: true
        },
        "minify-css": {
            minify: true
        },
        "ng-compile-js": {
            files: [
                "contents/**.js",
                "lib/esp*/**.js",
                "lib/angular*/**.js"
            ]
        },
        "ng-package": true
    }
}
```

### Get Pak from

[https://embedthis.com/pak/](https://embedthis.com/pak/)
