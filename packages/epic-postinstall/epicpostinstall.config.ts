import { EpicPostinstallConfig } from './src/index.js'

const config: EpicPostinstallConfig = {
  asdf: {
    version: '0.18.0', // Specify the desired ASDF version
    tools: {
      // Example: 'nodejs': { version: '20.11.0' },
      // 'python': { version: '3.10.0' }
    }
  },
  gitBinaries: {
    
  },
  python: {
    version: '3.1',
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
  scripts: [
    {
      name: 'setup_project',
      path: './scripts/test_script.sh'
    }
  ]
}

export default config
