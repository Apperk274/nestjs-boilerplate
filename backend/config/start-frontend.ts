import { spawn } from 'child_process'
import { resolve } from 'path'

export function startFrontend() {
  const frontendDir = resolve(process.cwd(), 'frontend')
  const child = spawn('npm run dev', { cwd: frontendDir, shell: true })

  child.stdout.setEncoding('utf8')
  child.stdout.on('data', function (data) {
    console.log('' + data.replaceAll('\n', '\n[frontend] '))
  })

  child.stderr.setEncoding('utf8')
  child.stderr.on('data', function (error) {
    console.log('stderr: ' + error)
  })

  child.on('close', function (code) {
    console.log('Frontend closed with code: ' + code)
  })
}
