import { execSync } from 'child_process';
import fs from 'fs';
import { select } from '@inquirer/prompts';

const devFolder = 'src/dev';

const runScript = async () => {
    let scriptName = process.argv[2];

    if (!scriptName) {
        const files = fs.readdirSync(devFolder).filter(file => file.endsWith('.js'));

        if (files.length === 0) {
            console.error('No scripts found in the dev folder.');
            process.exit(1);
        }

        const answer = await select({
            message: 'Select a script to run:',
            choices: files.map(file => ({ name: file, value: file.replace('.js', '') }))
        });

        scriptName = answer;
    }

    try {
        execSync(`node ${devFolder}/${scriptName}.js`, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Failed to run script: ${scriptName}.js`);
        process.exit(1);
    }
};

runScript();