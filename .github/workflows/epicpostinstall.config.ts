import { EpicPostinstallConfig } from '@repo/epic-postinstall'

const config: EpicPostinstallConfig = {
  gitBinaries: {

    shellCheck:{
      cmd: 'shellcheck',
      version: '0.10.0',
      githubRepo: "https://github.com/koalaman/shellcheck",
      homebrew:{name: 'shellcheck'},
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
  }
}

export default config
