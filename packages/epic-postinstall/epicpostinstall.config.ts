import { EpicPostinstallConfig } from './src/index.js'

const config: EpicPostinstallConfig = {
  python: {
    version: '3.12.4',
    virtualEnv: {
      name: '.venv',
      requirementsFile: 'requirements.txt',
      packages: ['black', 'flake8']
    },
    scripts: [
      {
        name: 'example script',
        path: './scripts/hello-world.py', // this needs to just echo hello world (python install) in the script
        args: ['--verbose']
      }
    ]
  },

  gitBinaries: {},

  scripts: [
    {
      name: 'setup_project',
      path: './scripts/test_script.sh'
    }
  ]
}

export default config
