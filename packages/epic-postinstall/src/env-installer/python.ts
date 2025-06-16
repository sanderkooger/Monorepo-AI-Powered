import { EpicPostinstallConfig } from '../index.js';
import { executeCommand } from '../helpers/executeCommand/index.js';
import logger from '../logger/index.js';
import { createDirenvFile } from '../helpers/direnv/index.js';
import * as path from 'path';

// Define default environment variables that are always allowed for direnv files
const ALLOWED_ENV_VARS = ['VIRTUAL_ENV'];

export async function installPythonEnvironment(fullConfig: EpicPostinstallConfig, projectRoot: string): Promise<void> {
  logger.info('Starting Python environment installation...');

  const config = fullConfig.python; // Get the python specific config

  if (!config) {
    logger.error('Python configuration is missing. Skipping Python environment installation.');
    return;
  }

  const pythonVersion = config.version;
  const venvName = config.virtualEnv?.name;
  const requirementsFile = config.virtualEnv?.requirementsFile;
  const extraPackages = config.virtualEnv?.packages;

  if (!pythonVersion) {
    logger.error('Python version is not specified in the configuration. Skipping Python environment installation.');
    return;
  }

  if (!venvName) {
    logger.error('Virtual environment name is not specified in the configuration. Skipping Python environment installation.');
    return;
  }

  // 1. ASDF Python Plugin Check/Installation
  logger.info('Checking for asdf-python plugin...');
  const { stdout: asdfPlugins } = await executeCommand('asdf plugin list');
  if (!asdfPlugins.includes('python')) {
    logger.info('asdf-python plugin not found. Installing...');
    await executeCommand('asdf plugin add python');
    logger.info('asdf-python plugin installed.');
  } else {
    logger.info('asdf-python plugin already installed.');
  }

  // 2. ASDF Python Version Installation & Path Retrieval
  logger.info(`Checking for Python version ${pythonVersion} with asdf...`);
  const { stdout: installedPythonVersions } = await executeCommand(`asdf list python`);
  if (!installedPythonVersions.includes(pythonVersion as string)) {
    logger.info(`Python version ${pythonVersion} not found. Installing with asdf...`);
    await executeCommand(`asdf install python ${pythonVersion}`);
    logger.info(`Python version ${pythonVersion} installed.`);
  } else {
    logger.info(`Python version ${pythonVersion} already installed.`);
  }

  logger.info(`Setting local Python version to ${pythonVersion} with asdf...`);
  await executeCommand(`asdf set python ${pythonVersion}`, projectRoot);
  logger.info(`Local Python version set to ${pythonVersion}.`);

  // 3. Virtual Environment Creation
  const venvPath = `${projectRoot}/${venvName}`;
  logger.info(`Creating virtual environment at ${venvPath}...`);
  // When asdf local is set, 'python' command will resolve to the correct version
  await executeCommand(`python -m venv ${venvPath}`, projectRoot);
  logger.info('Virtual environment created.');

  // 4. Requirements Installation
  if (requirementsFile) {
    const fullRequirementsPath = `${projectRoot}/${requirementsFile}`;
    logger.info(`Installing requirements from ${fullRequirementsPath}...`);
    await executeCommand(`${venvPath}/bin/pip install -r ${fullRequirementsPath}`);
    logger.info('Requirements installed.');
  }

  // 5. Extra Packages Installation
  if (extraPackages && extraPackages.length > 0) {
    logger.info(`Installing extra packages: ${extraPackages.join(', ')}...`);
    await executeCommand(`${venvPath}/bin/pip install ${extraPackages.join(' ')}`);
    logger.info('Extra packages installed.');
  }

  // 6. Execute Python Scripts
  if (config.scripts && config.scripts.length > 0) {
    logger.info('Executing Python scripts...');
    for (const script of config.scripts) {
      const scriptPath = path.join(projectRoot, script.path);
      const scriptArgs = script.args ? script.args.join(' ') : '';
      logger.info(`Running script: ${script.name} at ${scriptPath} ${scriptArgs}`);
      try {
        await executeCommand(`${venvPath}/bin/python ${scriptPath} ${scriptArgs}`);
        logger.success(`Script '${script.name}' executed successfully.`);
      } catch (error) {
        logger.error(`Script '${script.name}' failed: ${(error as Error).message}`);
      }
    }
    logger.info('Python scripts execution complete.');
  }

  // 7. Direnv file creation
  logger.info('Checking and creating .envrc file...');
  const relativeVenvPath = path.relative(projectRoot, venvPath);
  const direnvContent = `#!/bin/bash\nexport VIRTUAL_ENV="${relativeVenvPath}"\nlayout python3`;
  await createDirenvFile(projectRoot, direnvContent, fullConfig, ALLOWED_ENV_VARS); // Pass the full config and default allowed env vars
  logger.info('Python environment installation complete.');
}