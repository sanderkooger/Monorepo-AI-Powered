import { EpicPostinstallConfig } from '@repo/epic-postinstall'

const config: EpicPostinstallConfig = {
  asdf: {
    version: '0.18.0', // Specify the desired ASDF version
    tools: {
      // Example: 'nodejs': { version: '20.11.0' },
      // 'python': { version: '3.10.0' }
    }
  },
  gitBinaries: {
    direnv: {
      cmd: 'direnv',
      version: '2.36.0',
      githubRepo: 'https://github.com/direnv/direnv',
      homebrew: {
        name: 'direnv'
      },
      shellUpdate: {
        bash: {
          snippets: ['eval "$(direnv hook bash)"']
        }
      },

      postInstallScript: {
        // inline: 'eval "$(direnv hook bash)" >> ~/.bashrc' // Commented out for testing script file
       // path: './scripts/direnv_hook_setup.sh'
      }
    }
  },
  
  scripts: [
    {
      name: 'setup_project',
      path: './scripts/setup.sh'
    }
  ]
}

export default config
