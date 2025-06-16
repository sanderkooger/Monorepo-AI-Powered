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
    },
    tflint: {
      cmd: 'tflint',
      version: '0.58.0',
      githubRepo: 'https://github.com/terraform-linters/tflint/',
      homebrew: {
        name: 'tflint'
      },
      postInstallScript: {}
        
    },
  }
}

export default config
