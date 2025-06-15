import { EpicPostinstallConfig } from '@repo/epic-postinstall'

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

  scripts: [
    // {
    //   name: 'setup_project',
    //   path: './scripts/setup.sh'
    // }
  ]
}

export default config
