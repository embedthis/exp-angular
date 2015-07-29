Expansive.load({
    transforms: [{
        /*
            Compile angular html files into script (keep html extension)
         */
        name:       'ng-compile-html',
        mappings:   'html',
        minify:     true,
        compress:   true,
        script: `
            let service = expansive.services['ng-compile-html']
            service.cache = []

            function transform(contents, meta, service) {
                if (meta.isLayout || meta.isPartial) {
                    return contents
                }
                service.cache.push(meta.dest)
                contents = contents.replace(/$/mg, '\\\\').trim('\\\\')
                contents = contents.replace(/"/mg, '\\\\"')
                let url = meta.url
                contents = 'angular.module("app").run(["Esp", "$templateCache", function(Esp, $templateCache) {\n' +
                       '    $templateCache.put(Esp.url("/' + url + '"), "' + contents + '");\n}]);\n'
                let minify = Cmd.locate('uglifyjs')
                let cmd = minify
                if (service.compress) {
                    cmd += ' --compress'
                }
                if (service.minify) {
                    cmd += ' --mangle'
                }
                if (cmd) {
                    contents = run(cmd, contents)
                }
                return contents
            }
        `
    }, {
        /*
            Compile angular script files by using ng-annotate
         */
        name:       'ng-compile-js',
        mappings: {
            js: 'js'
            ng: 'js',
        }
        files:      null,
        script: `
            let service = expansive.services['ng-compile-js']
            if (service.files) {
                service.files = expansive.directories.top.files(service.files, {directories: false, relative: true}).unique()
            }
            service.cache = []

            function transform(contents, meta, service) {
                let match = (service.files == null)
                for each (file in service.files) {
                    if (meta.source == file) {
                        match = true
                        break
                    }
                }
                if (!match) {
                    vtrace('Omit', 'Skip annotating', meta.path)
                    return contents
                }
                service.cache.push(meta.dest)
                let na = Cmd.locate('ng-annotate')
                if (!na) {
                    trace('Warn', 'Cannot find ng-annotate')
                    return
                }
                return run('ng-annotate -a -', contents)
            }
        `
    }, {
        /*
            Package angular applications by catentating script files
         */
        name:   'ng-package',
        files:  null,
        dest:   'all.js',
        minify: true,
        compress: true,
        mangle: true,
        dotmin: false,
        script: `
            let service = expansive.services['ng-package']
            if (service.enable) {
                let collections = expansive.control.collections
                collections.scripts ||= []
                collections.scripts.push(service.dest)
            }
            function post(meta, service) {
                /*
                    Catenate javascript files
                 */
                let dist = expansive.directories.dist
                let all = dist.join(service.dest)
                let files
                if (service.files) {
                    files = expansive.directories.dist.files(service.files, {directories: false, relative: true})
                } else {
                    files = []
                    for each (path in expansive.collections.scripts) {
                        if (path != service.dest) {
                            path = expansive.directories.dist.join(path)
                            files.push(path)
                        }
                    }
                    for each (path in expansive.services['ng-compile-html'].cache) {
                        files.push(path)
                    }
                }
                for each (let path: Path in files) {
                    trace('Catenate', path)
                    let filename = expansive.trimPath(path, expansive.directories.dist)
                    all.append('\n/*\n    ' + filename + '\n */\n' + path.readString() + '\n')
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
                if (service.minify && all.exists) {
                    let minify = Cmd.locate('uglifyjs')
                    if (!minify) {
                        trace('Warn', 'Cannot find uglifyjs')
                        return
                    }
                    let cmd = minify + ' ' + all
                    if (service.compress) {
                        cmd += ' --compress'
                    }
                    if (service.mangle) {
                        cmd += ' --mangle'
                    }
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
        `
    }]
})
