import { EpicPostinstallConfig } from './src/helpers/getConfig'

const config: EpicPostinstallConfig = {
  gitBinaries: {
    shellcheck: {
      cmd: 'shellcheck',
      version: '0.10.0',
      githubRepo: 'https://github.com/koalaman/shellcheck',
      homebrew: {
        name: 'shellcheck'
      }
    },
    opentofu: {
      cmd: 'tofu',
      version: '1.9.1',
      githubRepo: 'https://github.com/opentofu/opentofu',
      homebrew: {
        name: 'opentofu'
      }
    },
    actionlint: {
      cmd: 'actionlint',
      version: '1.7.7',
      githubRepo: 'https://github.com/rhysd/actionlint',
      homebrew: {
        name: 'actionlint',
        tap: 'rhysd/actionlint'
      }
    }
  },
  python: {
    version: '3.9',
    virtualEnv: {
      name: 'epic-env',
      requirementsFile: 'requirements.txt',
      packages: ['black', 'flake8']
    },
    scripts: [
      {
        name: 'run_tests',
        path: './scripts/run_python_tests.py',
        args: ['--verbose']
      }
    ]
  },
  scripts: [
    {
      name: 'setup_project',
      path: './scripts/setup.sh'
    },
    {
      name: 'cleanup_cache',
      path: './scripts/cleanup.sh'
    }
  ]
}

export default config
