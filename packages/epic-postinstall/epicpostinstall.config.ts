import { EpicPostinstallConfig } from './src/helpers/getConfig'

const config: EpicPostinstallConfig = {
  asdf: {
    version: '0.18.0', // Specify the desired ASDF version
    tools: {
      // Example: 'nodejs': { version: '20.11.0' },
      // 'python': { version: '3.10.0' }
    }
  },
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
    },
    direnv: {
      cmd: 'direnv',
      version: '2.36.0',
      githubRepo: 'https://github.com/direnv/direnv',
      homebrew: {
        name: 'direnv'
      },
      shellUpdate: { 
        bash: {snippet: 'eval "$(direnv hook bash)"' }
      },
      // IMPORTANT: Executing post-install scripts can pose security risks if the script source is untrusted.
      // Ensure that any inline scripts or script paths are from trusted sources.
      postInstallScript: {
        // inline: 'eval "$(direnv hook bash)" >> ~/.bashrc' // Commented out for testing script file
       // path: './scripts/direnv_hook_setup.sh'
      }
    }
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
        path: './scripts/run_python_tests.py',
        args: ['--verbose']
      }
    ]
  },
  scripts: [
    {
      name: 'setup_project',
      path: './scripts/setup.sh'
    }
  ]
}

export default config
