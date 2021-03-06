const path = require('path');
const paths = require('../../config/paths');
const fs = require('fs-extra');
const prompts = require('prompts');
const os = require('os');
const { runScript } = require('../../utils');
const VARIABLES = require('../../config/variables.config');
const chalk = require('chalk');


async function modeSelection() {
    const onCancel = () => {
        console.log(`${chalk.red('Canceled!')}`);
        process.exit(1);
    };

    const chooseModes = VARIABLES.modesTypes.map(mode => ({
        type: "select",
        name: mode,
        message: `Choose ${mode}:`,
        choices: VARIABLES.modes[mode].map(value => ({title: value, value})),
        initial: 0,
    }));

    return await prompts(chooseModes, {onCancel});
}

(async () => {
    const runStart = () => require('./start');
    const isFilesExist = [paths.appConfig, paths.appEnv].map(file => fs.existsSync(file)).every(Boolean);

    if (!isFilesExist) {
        console.log(chalk`{blue It appears to be the first time you run serve in this project.
We will ask you several questions to set up the environment. If you don't know an answer feel free to choose the default option.
Don't worry, you can easily change your answers when you need to.}`);

        const modes = await modeSelection();
        createConfigFiles(paths.appTest, modes);

        return runScript(path.resolve(__dirname, './update-client.js'), runStart);
    } else {
        const envJson = require(paths.appEnv);
        const env = envJson.env[envJson.modes.bundlerEnv];

        console.log(chalk`{blue Found local serve configuration. 
        Current environment: ${env.bundler}
        Player version: ${envJson.modes.bundler === "uiConf" ? 'uiConf' : envJson.bundler.customPlayerVersion}

To modify them read 'test/readme.md' file}.`);

    }
    runStart();
})();

function createConfigFiles(appTestFolder, modes) {
    const configFilePath = path.resolve(__dirname, '../../config/config.json');
    const envFile = require(path.resolve(__dirname, '../../config/env.json'));

    envFile.modes = modes;

    fs.writeFileSync(
        path.join(appTestFolder, 'env.json'),
        JSON.stringify(envFile, null, 2) + os.EOL
    );

    [configFilePath].forEach(file => fs.copyFileSync(file, `${appTestFolder}/${path.basename(file)}`));

    console.log(`Config files were created successfully.
    For more info read the Readme at test/readme.md
    `);
}


