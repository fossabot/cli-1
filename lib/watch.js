let Chalk = require('chalk')
let Fs = require('fs')
let Common = require('./common')
let CONST = require('./const')
let Sass = require('node-sass')

/* Writes a css file using node FS */
let writeCss = (name, content) => {
  return new Promise((resolve, reject) => {
    Fs.writeFile(name, content, function (err) {
      if (err) { return reject(new Error(`error while converting scss file to css\n${err}`)) }
      return resolve()
    })
  })
}

/* Watcher prototype to convert scss to css on the go */
let watcherSpm = () => {
  return new Promise((resolve, reject) => {
    let currentPath = Common.getCurrentPath()
    let modulesPath = `${currentPath}/spm_modules`
    let promises = []

    console.log(currentPath, modulesPath)

    Fs.readdir(modulesPath, (err1, files1) => {
      if (err1) { return reject(err1) }
      files1.forEach(file1 => {
        console.log(file1)
        let distPath = `${modulesPath}/${file1}/dist`
        Fs.readdir(distPath, (err2, files2) => {
          if (err2) { return reject(err2) }
          files2.forEach(file2 => {
            if (file2.endsWith('.scss')) {
              console.log(`${file2.substring(0, file2.length - 4)}css`)
              Sass.render({
                file: file2,
                outFile: `${distPath}/${file2.substring(0, file2.length - 4)}css`
              }, function (error, result) {
                if (!error) {
                  promises.push(writeCss(`${distPath}/${file2.substring(0, file2.length - 4)}css`, result.css))
                } else {
                  console.log('node-sass error message', error)
                  return reject(error) // node-sass error message
                }
              })
            }
          })
        })
      })
      Promise.all(promises)
      .then(() => {
        Sass.render({
          file: `${currentPath}/index.scss`,
          outFile: `${currentPath}/index.css`
        }, function (error, result) {
          if (!error) {
            writeCss(`${currentPath}/index.css`, result.css)
            .then(resolve)
            .then(reject)
          } else {
            console.log('node-sass error message')
            return reject(error) // node-sass error message
          }
        })
      })
      .then(resolve)
      .catch(reject)
    })
  })
}

/* Command line for spm watch */
module.exports = (Program) => {
  return new Promise((resolve, reject) => {
    Program
    .command('watch')
    .alias('w')
    .description('watcher')
    .action(() => {
      watcherSpm()
      .then(() => {
        console.log(Chalk.hex(CONST.SUCCESS_COLOR)('changes have been watched'))
        return resolve()
      })
      .catch(reject)
    })
  })
}
