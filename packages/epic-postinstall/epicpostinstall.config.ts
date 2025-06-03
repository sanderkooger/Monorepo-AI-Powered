import { EpicPostinstallConfig } from './src/getConfig';

const config: EpicPostinstallConfig = {
  message: "Hello from epic-postinstall configTS!",
  binaries: {
    "shellcheck": {
      "cmd": "shellcheck",
      "version": "0.10.0",
      "githubRepo": "https://github.com/koalaman/shellcheck",
      "homebrewPackageName": "shellcheck"
    },
    "shfmt": {
      "cmd": "shfmt",
      "githubRepo": "https://github.com/mvdan/sh",
      "homebrewPackageName": "shfmt"
    }
  },
  python: {
    version: "3.9",
    virtualEnv: {
      name: "epic-env",
      requirementsFile: "requirements.txt",
      packages: ["black", "flake8"]
    },
    scripts: [
      {
        name: "run_tests",
        path: "./scripts/run_python_tests.py",
        args: ["--verbose"]
      }
    ]
  },
  scripts: [
    {
      name: "setup_project",
      path: "./scripts/setup.sh",
      runOn: ["postinstall"],
      platforms: ["linux", "macos"]
    },
    {
      name: "cleanup_cache",
      path: "./scripts/cleanup.sh",
      runOn: ["always"]
    }
  ]
};

export default config;