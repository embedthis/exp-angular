/*
    Compile angular html files into js files with js extension.
    Don't require users to name html files '.js.html' because debug mode will not use this step
 */
Expansive.load({

    services: {
        name:       'angular',

        compress:   true,
        dest:       Path('all.js'),
        dotmin:     false,
        minify:     true,
        scripts:    null,
    
        transforms: [{

            name:     'html',
            mappings: 'html',

            init: function(transform) {
                let service = transform.service
                if ((service.uglify = Cmd.locate('uglifyjs')) == null) {
                    fatal('Cannot locate uglifyjs for exp-angular')
                }
                service.options = ''
                if (service.minify) {
                    service.options += ' --mangle'
                }
                if (service.compress) {
                    service.options += ' --compress'
                }
                if ((service.annotate = Cmd.locate('ng-annotate')) == null) {
                    fatal('Cannot find ng-annotate')
                }
                if (!service.html) {
                    expansive.transforms['angular-html'].enable = false
                }
                if (!service.js) {
                    expansive.transforms['angular-js'].enable = false
                }
                if (!service.package) {
                    expansive.transforms['angular-package'].enable = false
                }
            },

            resolve: function(path: Path) path.joinExt('js', true),

            pre: function(transform) {
                transform.service.html = []
            },

            render: function(contents, meta, transform) {
                if (meta.isDocument) {
                    let service = transform.service
                    service.html.push(meta.destPath)
                    contents = contents.replace(/$/mg, '\\').trim('\\')
                    contents = contents.replace(/"/mg, '\\"')
                    let url = meta.url
                    if (url.endsWith('.js')) {
                        url = url.trimExt()
                    }
                    contents = 'angular.module("app").run(["Esp", "$templateCache", function(Esp, $templateCache) {\n' +
                           '    $templateCache.put(Esp.url("/' + url + '"), "' + contents + '");\n}]);\n'
                    contents = run(service.uglify + service.options, contents)
                }
                return contents
            },

        }, {
            /*
                Process angular script files with ng-annotate
             */
            name:   'js',
            mappings: {
                js: 'js'
                ng: 'js',
            }

            init: function(transform) {
                let service = transform.service
                if (service.scripts) {
                    for (let [key,value] in service.scripts) {
                        if (value.startsWith('contents/')) {
                            //  DEPRECATE
                            trace('Warn', 'ng-compile has file with "contents/" prefix', value)
                            service.scripts[key] = expansive.getSourcePath(value)
                        }
                    }
                    service.scripts = expansive.directories.contents.files(service.scripts, 
                        {directories: false, relative: true}).unique()
                } else {
                    transform.enable = false
                }
            },

            render: function(contents, meta, transform) {
                let match = false
                let scripts = transform.service.scripts
                for each (file in scripts) {
                    if (meta.sourcePath == file) {
                        match = true
                        break
                    }
                }
                if (match) {
                    scripts.push(meta.destPath)
                    contents = run(transform.service.annotate + ' -a -', contents)
                }
                return contents
            },

        }, {
            /*
                Package angular applications by catentating script files
             */
            name:   'package',

            post: function(transform) {
                /*
                    Catenate javascript files
                 */
                let service = transform.service
                let dist = directories.dist
                let all = dist.join(service.dest)
                let files = []

                for each (path in service.scripts) {
                    files.push(path)
                }
                for each (path in service.html) {
                    files.push(path)
                }
                files = expansive.orderFiles(files, "js")
                for each (let file: Path in files) {
                    trace('Catenate', file)
                    let path = directories.dist.join(file)
                    all.append('\n/*\n    Start of: "' + file + '"\n */\n' + path.readString() + '\n')
                    if (!expansive.options.keep) {
                        if (path.childOf(dist)) {
                            path.remove()
                        }
                        while (path.dirname != dist) {
                            path = path.dirname
                            if (path.childOf(dist)) {
                                path.remove()
                            }
                        }
                    }
                }
                if (all.exists && service.minify) {
                    /* Uglify has options at the end. Ugh! */
                    let cmd = service.uglify + ' ' + all + service.options
                    trace('Minify', all)
                    vtrace('Run', cmd)
                    contents = Cmd.run(cmd)
                    let outfile = all
                    if (service.dotmin && !all.contains('min.js')) {
                        outfile = all.trimExt().joinExt('min.js', true)
                    }
                    outfile.write(contents + '\n')
                    if (all != outfile) {
                        all.remove()
                    }
                    all = outfile
                }
                trace('Created', all)
            }
        }]
    }
})
