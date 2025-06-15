import { EpicPostinstallConfig } from '@repo/epic-postinstall'

const config: EpicPostinstallConfig = {
  python: {
    version: '3.13',
    virtualEnv: {
      name: '.venv',
      requirementsFile: 'requirements.txt',
      packages: ['black', 'flake8']
    },
    scripts: [
      {
        name: 'run_tests',
        path: './scripts/run_python_tests.py', // this needs to just echo hello world (python install) in the script
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
