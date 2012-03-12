fs     = require 'fs'
{spawn, exec} = require 'child_process'

mergeFiles =(inputFiles, outputFile, minify=false) ->

  # Add directories and extensions to filenames
  inputFiles = for f in inputFiles
    "src/#{f}.coffee"
  outputFile = "lib/#{outputFile}.coffee"

  remaining = inputFiles.length
  appContents = new Array

  for inputFile, index in inputFiles then do (inputFile, index) ->
    fs.readFile inputFile, 'utf8', (err, fileContents) ->
      throw err if err
      appContents[index]= fileContents
      process() if --remaining is 0

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
          if minify
            js_output_file = js.replace /\.js$/, '.min.js'
            exec "java -jar '/users/zeke/.jars/compiler.jar' --js #{js} --js_output_file #{js_output_file}", (err, stdout, stderr) ->
              throw err if err
              console.log js_output_file

# task 'bake', 'Compile and concatenate CoffeeScript files to JavaScript, and create minified versions', ->
#   mergeFiles ['reqwest', 'swagger'], 'swagger', false

task 'watch', 'Automatically recompile CoffeeScript files to JavaScript', ->
  coffee = spawn 'coffee', ['-cw', '-o', 'lib', 'src']
  coffee.stdout.on 'data', (data) -> console.log data.toString().trim()
  
task 'dev', "Open source files, run spec in browser, and watch for changes", ->
  exec "$EDITOR ."
  exec "open spec.html"
  coffee = spawn 'coffee', ['-cw', '-o', 'lib', 'src']
  coffee.stdout.on 'data', (data) -> console.log data.toString().trim()