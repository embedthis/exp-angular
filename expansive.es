Expansive.load({
    transforms: [{
        /*
            Compile angular html files into js files with js extension.
            Don't require users to name html files '.js.html' because debug mode will not use this step
         */
        name:       'ng-compile-html',
        mappings:   'html',
        minify:     true,
        compress:   true,
        script: `
            let service = expansive.services['ng-compile-html']
            service.html = []

            function resolve(path: Path, service): Path? {
                return path.joinExt('js', true)
            }

            function transform(contents, meta, service) {
                if (meta.isLayout || meta.isPartial) {
                    return contents
                }
                service.html.push(meta.destPath)
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
                for (let [key,value] in service.files) {
                    if (value.startsWith('contents/')) {
                        trace('Warn', 'ng-compile has file with "contents/" prefix', value)
                        services.files[key] = expansive.getSourcePath(value)
                    }
                }
                service.files = expansive.directories.contents.files(service.files, 
                    {directories: false, relative: true}).unique()
            }
            service.scripts = []

            function transform(contents, meta, service) {
                let match = (service.files == null)
                for each (file in service.files) {
                    if (meta.sourcePath == file) {
                        match = true
                        break
                    }
                }
                if (!match) {
                    vtrace('Omit', 'Skip annotating', meta.sourcePath)
                    return contents
                }
                service.scripts.push(meta.destPath)
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
            function post(meta, service) {
                /*
                    Catenate javascript files
                 */
                let dist = directories.dist
                let all = dist.join(service.dest)
                let files
                if (service.files) {
                    files = directories.dist.files(service.files, {directories: false, relative: true})
                } else {
                    files = []
                    for each (path in expansive.services['ng-compile-js'].scripts) {
                        files.push(path)
                    }
                    for each (path in expansive.services['ng-compile-html'].html) {
                        files.push(path)
                    }
                }
                files = expansive.orderFiles(files, "js")

                for each (let file: Path in files) {
                    trace('Catenate', file)
                    //  DEPRECATE
                    if (file.startsWith('contents/')) {
                        trace('Warn', 'ng-package has file with "contents/" prefix', file)
                        file = expansive.getSourcePath(file)
                    }
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
