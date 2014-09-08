fs     = require 'fs'
{spawn, exec} = require 'child_process'

mergeFiles =(inputFolder, outputFile, minify=false) ->

  # Add directories and extensions to filenames
  inputFiles  = fs.readdirSync(inputFolder)
  outputFile = "lib/#{outputFile}.js"

  appContents = new Array

  for inputFile, index in inputFiles then do (inputFile, index) ->
    exec "cat #{inputFolder}/#{inputFile} >> #{outputFile}"

  process = ->
    
    fs.writeFile outputFile, appContents.join('\n\n'), 'utf8', (err) ->
      throw err if err
      exec "coffee --compile #{outputFile}", (err, stdout, stderr) ->
        throw err if err
        # console.log stdout + stderr
        fs.unlink outputFile, (err) ->
          throw err if err
          
          js = outputFile.replace /coffee$/, 'js'
          console.log js

task 'bake', 'Compile and concatenate CoffeeScript files to JavaScript', ->
  outputFile = 'swagger-client'

  console.log '   : Compiling...'

  fs.readFile 'package.json', 'utf8', (err, fileContents) ->
    obj = JSON.parse(fileContents)
    exec "echo '// #{outputFile}.js' > lib/#{outputFile}.js"
    exec "echo '// version #{obj.version}' >> lib/#{outputFile}.js"

    # shared files
    mergeFiles "src/main/javascript", "#{outputFile}", false

  exec "cp lib/#{outputFile}.js dist/lib/"

  #coffee = spawn 'coffee', ['-c', '-o', 'lib', 'src']
  #coffee.stderr.on 'data', (data) ->
  #  process.stderr.write data.toString()
  #coffee.stdout.on 'data', (data) ->
  #  print data.toString()
  #coffee.on 'exit', (code) ->
  #  callback?() if code is 0

task 'watch', 'Automatically recompile CoffeeScript files to JavaScript', ->
  coffee = spawn 'coffee', ['-cw', '-o', 'lib', 'src']
  coffee.stdout.on 'data', (data) -> console.log data.toString().trim()

task 'dev', "Open source files, run spec in browser, and watch for changes", ->
  exec "$EDITOR ."
  exec "open api-listing-spec.html"
  exec "open execution-spec.html"
  exec "open http-spec.html"
  exec "open operation-spec.html"
  exec "open request-spec.html"
  exec "open model-spec.html"
  coffee = spawn 'coffee', ['-cw', '-o', 'lib', 'src']
  coffee.stdout.on 'data', (data) -> console.log data.toString().trim()