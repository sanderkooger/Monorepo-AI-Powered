import { EpicPostinstallConfig } from '@repo/epic-postinstall'

const config: EpicPostinstallConfig = {
  gitBinaries: {
    opentofu: {
      cmd: 'tofu',
      version: '1.9.1',
      githubRepo: 'https://github.com/opentofu/opentofu',
      homebrew: {
        name: 'opentofu'
      },

      postInstallScript: {
        // inline: 'eval "$(direnv hook bash)" >> ~/.bashrc' // Commented out for testing script file
        // path: './scripts/direnv_hook_setup.sh'
      }
    }
  }
}

export default config
