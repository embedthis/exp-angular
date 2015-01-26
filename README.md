exp-ng
===

Expansive plugin for Angular scripts.

Provides the 'compile-html', 'compile-ng-js', and 'package-ng' services.

### To install:

    pak install exp-ng

### To configure in expansive.json:

* compile-less-css.enable -- Enable the compile-less-css service to process less files.
* compile-less-css.stylesheet -- Primary stylesheet to update if any less file changes.
    If specified, the "dependencies" map will be automatically created.
* compile-less-css.dependencies -- Explicit map of dependencies if not using "stylesheet".
* compile-less-css.documents -- Array of less files to compile.
* prefix-css.enable - Enable running autoprefixer on CSS files to handle browser specific extensions.
* minify-css.enable - Enable minifying CSS files.
* minify-js.enable - Enable minifying script files.
* minify-js.files - Array of files to minify. Files are relative to 'source'.
* minify-js.compress - Enable compression of script files.
* minify-js.mangle - Enable mangling of Javascript variable and function names.
* minify-js.dotmin - Set '.min.js' as the output file extension after minification. Otherwise will be '.js'.
* minify-js.exclude - Array of files to exclude from minification. Files are relative to 'source'.

```
{
    services: {
        'compile-html': {
            enable: true,
            minify: true,
            compress: true
        },
        'compile-ng-js': {
            files: [],
        },
        'package-ng': {
            files:  null,
            dest:   'all.js',
            minify: true,
            compress: true,
            mangle: true,
            dotmin: false,
        }
    }
}
```

### Get Pak from

[https://embedthis.com/pak/](https://embedthis.com/pak/download.html)
