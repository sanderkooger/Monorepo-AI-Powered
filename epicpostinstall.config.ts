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
    
  },

  scripts: [
    // {
    //   name: 'setup_project',
    //   path: './scripts/setup.sh'
    // }
  ]
}

export default config
