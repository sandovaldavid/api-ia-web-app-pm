/**
 * Configuration validation utility
 *
 * This script checks if all required environment variables are set
 * and if connections to external services (MongoDB, Django, Ollama) are working.
 */

const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const chalk = require('chalk');

// Make sure chalk is working
if (typeof chalk !== 'function' && !chalk.blue) {
    // Fallback to plain console if chalk isn't working
    chalk = {
        blue: (text) => `\x1b[34m${text}\x1b[0m`,
        green: (text) => `\x1b[32m${text}\x1b[0m`,
        red: (text) => `\x1b[31m${text}\x1b[0m`,
        yellow: (text) => `\x1b[33m${text}\x1b[0m`,
        gray: (text) => `\x1b[90m${text}\x1b[0m`,
        bold: {
            blue: (text) => `\x1b[1m\x1b[34m${text}\x1b[0m`,
            green: (text) => `\x1b[1m\x1b[32m${text}\x1b[0m`,
            red: (text) => `\x1b[1m\x1b[31m${text}\x1b[0m`,
        },
    };
}

// Load environment variables
dotenv.config();

const checkEnvVars = () => {
    console.log(chalk.blue('📋 Checking environment variables...'));

    const requiredVars = [
        'PORT',
        'NODE_ENV',
        'MONGODB_URI',
        'JWT_SECRET',
        'JWT_EXPIRE',
        'DJANGO_API_URL',
        'DJANGO_API_TOKEN',
        'OLLAMA_API_URL',
        'OLLAMA_MODEL',
    ];

    const missingVars = [];

    requiredVars.forEach((varName) => {
        if (!process.env[varName]) {
            missingVars.push(varName);
        }
    });

    if (missingVars.length === 0) {
        console.log(chalk.green('✅ All required environment variables are set.'));
        return true;
    } else {
        console.log(chalk.red(`❌ Missing environment variables: ${missingVars.join(', ')}`));
        console.log(chalk.yellow('💡 Tip: Copy .env.example to .env and fill in the missing values.'));
        return false;
    }
};

const checkMongoDB = async () => {
    console.log(chalk.blue('📋 Checking MongoDB connection...'));

    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log(chalk.green('✅ Successfully connected to MongoDB.'));
        await mongoose.connection.close();
        return true;
    } catch (error) {
        console.log(chalk.red(`❌ Failed to connect to MongoDB: ${error.message}`));
        console.log(chalk.yellow('💡 Tip: Make sure MongoDB is running and the connection URI is correct.'));
        return false;
    }
};

const checkDjangoAPI = async () => {
    console.log(chalk.blue('📋 Checking Django API connection...'));

    try {
        const response = await axios.get(`${process.env.DJANGO_API_URL}/health`, {
            headers: {
                Authorization: `Token ${process.env.DJANGO_API_TOKEN}`,
            },
            timeout: 5000,
        });

        if (response.status === 200) {
            console.log(chalk.green('✅ Successfully connected to Django API.'));
            return true;
        } else {
            console.log(chalk.red(`❌ Django API returned status code ${response.status}.`));
            return false;
        }
    } catch (error) {
        console.log(chalk.red(`❌ Failed to connect to Django API: ${error.message}`));
        console.log(chalk.yellow('💡 Tip: Make sure the Django API is running and the token is valid.'));
        return false;
    }
};

const checkOllamaAPI = async () => {
    console.log(chalk.blue('📋 Checking Ollama API connection...'));

    try {
        const response = await axios.post(
            `${process.env.OLLAMA_API_URL}/generate`,
            {
                model: process.env.OLLAMA_MODEL,
                prompt: 'Hello',
                stream: false,
                options: {
                    temperature: 0.1,
                    num_predict: 10,
                },
            },
            { timeout: 10000 }
        );

        if (response.data && response.data.response) {
            console.log(chalk.green('✅ Successfully connected to Ollama API.'));
            console.log(chalk.gray(`   Response: "${response.data.response.substring(0, 50)}..."`));
            return true;
        } else {
            console.log(chalk.red('❌ Ollama API returned an invalid response.'));
            return false;
        }
    } catch (error) {
        console.log(chalk.red(`❌ Failed to connect to Ollama API: ${error.message}`));
        console.log(chalk.yellow('💡 Tip: Make sure Ollama is running and the model is available.'));
        console.log(chalk.yellow(`   You might need to run: ollama pull ${process.env.OLLAMA_MODEL}`));
        return false;
    }
};

const checkFilesPermissions = () => {
    console.log(chalk.blue('📋 Checking file permissions...'));

    const requiredDirs = ['logs', 'uploads'];

    let allOk = true;

    requiredDirs.forEach((dir) => {
        const dirPath = path.join(__dirname, '..', dir);

        if (!fs.existsSync(dirPath)) {
            console.log(chalk.yellow(`⚠️ Directory "${dir}" does not exist. Creating it...`));
            try {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(chalk.green(`✅ Created directory "${dir}".`));
            } catch (error) {
                console.log(chalk.red(`❌ Failed to create directory "${dir}": ${error.message}`));
                allOk = false;
            }
        } else {
            try {
                // Check if directory is writable by writing a temp file
                const testFile = path.join(dirPath, '.write-test');
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
                console.log(chalk.green(`✅ Directory "${dir}" is writable.`));
            } catch (error) {
                console.log(chalk.red(`❌ Directory "${dir}" is not writable: ${error.message}`));
                allOk = false;
            }
        }
    });

    return allOk;
};

const checkDependencies = () => {
    console.log(chalk.blue('📋 Checking package dependencies...'));

    try {
        const packageJson = require('../package.json');
        const nodeVersion = process.version;

        // Check Node.js version
        const requiredNode = packageJson.engines && packageJson.engines.node;
        if (requiredNode) {
            if (nodeVersion.startsWith('v' + requiredNode.replace(/[^\d.]/g, ''))) {
                console.log(chalk.green(`✅ Node.js version is compatible (${nodeVersion}).`));
            } else {
                console.log(
                    chalk.yellow(
                        `⚠️ Node.js version (${nodeVersion}) might not be compatible with required version (${requiredNode}).`
                    )
                );
            }
        }

        // Check for critical dependencies
        const criticalDeps = ['express', 'mongoose', 'jsonwebtoken', 'axios'];
        const missingDeps = [];

        criticalDeps.forEach((dep) => {
            try {
                require(dep);
            } catch (error) {
                missingDeps.push(dep);
            }
        });

        if (missingDeps.length === 0) {
            console.log(chalk.green('✅ All critical dependencies are installed.'));
            return true;
        } else {
            console.log(chalk.red(`❌ Missing critical dependencies: ${missingDeps.join(', ')}`));
            console.log(chalk.yellow('💡 Tip: Run "npm install" to install the required dependencies.'));
            return false;
        }
    } catch (error) {
        console.log(chalk.red(`❌ Failed to check dependencies: ${error.message}`));
        return false;
    }
};

const runChecks = async () => {
    console.log(chalk.bold.blue('🚀 Starting API Intermediaria configuration check\n'));

    const envOk = checkEnvVars();
    const filesOk = checkFilesPermissions();
    const depsOk = checkDependencies();

    // Only check connections if env vars are set
    let mongoOk = false;
    let djangoOk = false;
    let ollamaOk = false;

    if (envOk) {
        mongoOk = await checkMongoDB();
        djangoOk = await checkDjangoAPI();
        ollamaOk = await checkOllamaAPI();
    }

    console.log('\n' + chalk.bold.blue('📊 Configuration check summary:'));
    console.log(`Environment Variables: ${envOk ? chalk.green('✅ OK') : chalk.red('❌ FAILED')}`);
    console.log(`File Permissions: ${filesOk ? chalk.green('✅ OK') : chalk.red('❌ FAILED')}`);
    console.log(`Dependencies: ${depsOk ? chalk.green('✅ OK') : chalk.red('❌ FAILED')}`);

    if (envOk) {
        console.log(`MongoDB Connection: ${mongoOk ? chalk.green('✅ OK') : chalk.red('❌ FAILED')}`);
        console.log(`Django API Connection: ${djangoOk ? chalk.green('✅ OK') : chalk.red('❌ FAILED')}`);
        console.log(`Ollama API Connection: ${ollamaOk ? chalk.green('✅ OK') : chalk.red('❌ FAILED')}`);
    }

    const allOk = envOk && filesOk && depsOk && mongoOk && djangoOk && ollamaOk;

    console.log(
        '\n' +
            (allOk
                ? chalk.bold.green('✅ All checks passed! The system is correctly configured.')
                : chalk.bold.red('❌ Some checks failed. Please fix the issues before starting the API.'))
    );

    return allOk;
};

// Run checks if script is executed directly
if (require.main === module) {
    runChecks()
        .then((result) => {
            process.exit(result ? 0 : 1);
        })
        .catch((error) => {
            console.error(chalk.red(`❌ Unexpected error: ${error.message}`));
            process.exit(1);
        });
}

module.exports = { runChecks };
