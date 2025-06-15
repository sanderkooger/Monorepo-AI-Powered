import { EpicPostinstallConfig } from './src/index.js'

const config: EpicPostinstallConfig = {
  asdf: {
    version: '0.18.0', // Ensure ASDF is always installed at this version or newer
    tools: {
      // Example: 'nodejs': { version: '20.11.0' },
      // 'python': { version: '3.10.0' }
    }
  },
  direnv: {
    version: '2.36.0', // Specify the desired direnv version
  },
  gitBinaries: {
    
  },
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
  scripts: [
    {
      name: 'setup_project',
      path: './scripts/test_script.sh'
    }
  ]
}

export default config
