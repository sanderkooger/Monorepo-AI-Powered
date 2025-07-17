import { EpicPostinstallConfig } from '@repo/epic-postinstall'

const config: EpicPostinstallConfig = {
   python: {
    version: '3.13.3',
    virtualEnv: {
      name: '.venv',
      requirementsFile: 'requirements.txt',
      packages: []
    },
    scripts: [
      // {
      //   name: 'example script',
      //   path: './scripts/hello-world.py', // this needs to just echo hello world (python install) in the script
      //   args: ['--verbose']
      // }
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
