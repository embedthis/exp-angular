Expansive.load({
    transforms: [{
        name:       'compile-html',
        input:      'html',
        output:     'html',
        minify:     true,
        compress:   true,
        script: `
            function transform(contents, meta, service) {
                if (meta.isLayout || meta.isPartial) {
                    return contents
                }
                expansive.renderCache.nghtml ||= { js: [] }
                expansive.renderCache.nghtml.js.push(meta.file)

                contents = contents.replace(/$/mg, '\\\\').trim('\\\\')
                contents = contents.replace(/"/mg, '\\\\"')

/* UNUSED
                let url = meta.url.dirname.join(meta.dest.basename.toString())
*/
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
        name:       'compile-ng-js',
        input:      [ 'js', 'ng' ],
        output:     'js',
        files:      null,
        script: `
            let service = expansive.services['compile-ng-js']
            service.files = expansive.directories.source.files(service.files, {relative: true}).unique()

            function transform(contents, meta, service) {
                let match = service.files == null
                for each (file in service.files) {
                    if (meta.file.glob(file)) {
                        match = true
                        break
                    }
                }
                if (!match) {
                    vtrace('Omit', 'Skip annotating', meta.file)
                    return contents
                }
                let na = Cmd.locate('ng-annotate')
                if (!na) {
                    trace('Warn', 'Cannot find ng-annotate')
                    return
                }
                return run('ng-annotate -a -', contents)
            }
        `
    }, {
        name:   'package-ng',
        files:  null,
        dest:   'all.js',
        minify: true,
        compress: true,
        mangle: true,
        dotmin: false,
        script: `
            let service = expansive.services['package-ng']
            if (service.enable) {
                let control = expansive.control
                control.render.js = [ expansive.services['package-ng'].dest ]
            }
            function post(meta, service) {
                /* 
                    Catenate javascript files
                 */
                let documents = expansive.directories.documents
                let all = documents.join(service.dest)
                let files = []
                for (let [pak, def] in expansive.renderCache) {
                    if (!(expansive.control.render && expansive.control.render.html)) {
                        /* Cleanup unwanted html import files */
                        if (!expansive.options.keep) {
                            for each (html in def.html) {
//  UNUSED
                                if (documents.join(html).exists && false) {
                                    documents.join(html).remove()
                                }
                            }
                        }
                    }
                    for each (path in def.js) {
                        if (path == service.dest) {
                            continue
                        }
                        path = expansive.getDest(path)
                        files.push(path)
                    }
                }
                if (service.files) {
                    files += directories.documents.files(service.files)
                }
                for each (let path: Path in files) {
                    all.append('\n/*\n    ' + path.trimComponents(1) + '\n */\n' + path.readString() + '\n')
                    if (!expansive.options.keep) {
                        path.remove()
                        trace('Catenate', path)
                        while (path.dirname != documents) {
                            path = path.dirname
                            if (path.childOf(documents)) {
                                path.remove()
                            }
                        }
                    }
                }
                if (service.minify) {
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
