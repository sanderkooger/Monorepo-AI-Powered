import { EpicPostinstallConfig } from '@repo/epic-postinstall'

const config: EpicPostinstallConfig = {
  gitBinaries: {
   actionlint: {
      cmd: 'actionlint',
      version: '1.7.7',
      githubRepo: 'https://github.com/rhysd/actionlint',
      homebrew: {
        name: 'actionlint',
        tap: 'rhysd/actionlint'
      }
    },
  }
}

export default config
