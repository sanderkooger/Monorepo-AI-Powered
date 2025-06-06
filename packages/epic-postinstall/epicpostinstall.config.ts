import { EpicPostinstallConfig } from './src/getConfig';

const config: EpicPostinstallConfig = {
  
  "binaries": {
    "shellcheck": {
      "cmd": "shellcheck",
      "version": "0.10.0",
      "githubRepo": "https://github.com/koalaman/shellcheck",
      "homebrew": {
        "name": "shellcheck",
      }
    },
     "opentofu": {
      "cmd": "tofu",
      "version": "1.9.1",
      "githubRepo": "https://github.com/opentofu/opentofu",
      "homebrew": {  
        "name": "opentofu",
      }
    },
     "hciVault": {
      "cmd": "vault",
      "version": "1.15.2",
      "githubRepo": "https://github.com/hashicorp/vault",
      "homebrew": {
        "name": "vault",
        "tap": "hashicorp/tap"
      }
    },
     "actionlint": {
      "cmd": "actionlint",
      "version": "1.7.7",
      "githubRepo": "https://github.com/rhysd/actionlint",
      "homebrew": {
        "name": "actionlint",
        "tap": "rhysd/actionlint"
      }
    }
  },
  "python": {
    "version": "3.9",
    "virtualEnv": {
      "name": "epic-env",
      "requirementsFile": "requirements.txt",
      "packages": ["black", "flake8"]
    },
    "scripts": [
      {
        "name": "run_tests",
        "path": "./scripts/run_python_tests.py",
        "args": ["--verbose"]
      }
    ]
  },
  "scripts": [
    {
      "name": "setup_project",
      "path": "./scripts/setup.sh",
      
  
    },
    {
      "name": "cleanup_cache",
      "path": "./scripts/cleanup.sh",
     
    }
  ]
};

export default config;