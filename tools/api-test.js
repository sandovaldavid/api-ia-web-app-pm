/**
 * API Testing Utility
 *
 * This script performs basic tests on the API endpoints to verify they're working correctly.
 * It's a lightweight alternative to running the full test suite.
 */

const axios = require('axios');
const dotenv = require('dotenv');
const chalk = require('chalk');
const readline = require('readline');

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Prompt for user input
const prompt = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};

// Default configuration
const config = {
    apiUrl: process.env.API_URL || 'http://localhost:3000/api',
    email: 'test@example.com',
    password: 'password123',
    token: null,
};

// API client with base configuration
const api = axios.create({
    baseURL: config.apiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
    validateStatus: null, // Don't throw errors for non-2xx status codes
});

// Handle API responses
const handleResponse = (res, successMessage) => {
    if (res.status >= 200 && res.status < 300) {
        console.log(chalk.green(`✅ ${successMessage} (${res.status})`));
        return { success: true, data: res.data };
    } else {
        console.log(chalk.red(`❌ Failed: ${res.status} - ${JSON.stringify(res.data)}`));
        return { success: false, error: res.data };
    }
};

// Test functions
const tests = {
    // Test basic health endpoint
    async testHealth() {
        console.log(chalk.blue('\n📋 Testing Health Endpoint'));
        try {
            const res = await api.get('/health');
            return handleResponse(res, 'Health endpoint is working');
        } catch (error) {
            console.log(chalk.red(`❌ Failed to connect: ${error.message}`));
            return { success: false, error: error.message };
        }
    },

    // Test user registration
    async testRegister() {
        console.log(chalk.blue('\n📋 Testing User Registration'));
        try {
            // Generate a unique email
            const timestamp = Date.now();
            const email = `test+${timestamp}@example.com`;

            const res = await api.post('/users/register', {
                name: 'Test User',
                email,
                password: config.password,
            });

            const result = handleResponse(res, 'User registration successful');
            // Save token if registration was successful
            if (result.success && result.data.token) {
                config.token = result.data.token;
                api.defaults.headers.common['Authorization'] = `Bearer ${config.token}`;
            }

            return result;
        } catch (error) {
            console.log(chalk.red(`❌ Failed to connect: ${error.message}`));
            return { success: false, error: error.message };
        }
    },

    // Test user login
    async testLogin() {
        console.log(chalk.blue('\n📋 Testing User Login'));
        try {
            const email = await prompt(chalk.yellow('Enter email (or press Enter for default): '));
            const password = await prompt(chalk.yellow('Enter password (or press Enter for default): '));

            const res = await api.post('/users/login', {
                email: email || config.email,
                password: password || config.password,
            });

            const result = handleResponse(res, 'User login successful');
            // Save token if login was successful
            if (result.success && result.data.token) {
                config.token = result.data.token;
                api.defaults.headers.common['Authorization'] = `Bearer ${config.token}`;
            }

            return result;
        } catch (error) {
            console.log(chalk.red(`❌ Failed to connect: ${error.message}`));
            return { success: false, error: error.message };
        }
    },

    // Test get current user
    async testGetCurrentUser() {
        console.log(chalk.blue('\n📋 Testing Get Current User'));
        // Ensure we have a token
        if (!config.token) {
            console.log(chalk.yellow('⚠️ No authentication token. Please login first.'));
            return { success: false, error: 'No token' };
        }

        try {
            const res = await api.get('/users/me');
            return handleResponse(res, 'Get current user successful');
        } catch (error) {
            console.log(chalk.red(`❌ Failed to connect: ${error.message}`));
            return { success: false, error: error.message };
        }
    },

    // Test create chat
    async testCreateChat() {
        console.log(chalk.blue('\n📋 Testing Create Chat'));
        // Ensure we have a token
        if (!config.token) {
            console.log(chalk.yellow('⚠️ No authentication token. Please login first.'));
            return { success: false, error: 'No token' };
        }

        try {
            const res = await api.post('/chats', {
                title: `Test Chat ${Date.now()}`,
            });

            const result = handleResponse(res, 'Chat creation successful');
            // Save chat ID for further tests
            if (result.success && result.data.data && result.data.data._id) {
                config.chatId = result.data.data._id;
            }

            return result;
        } catch (error) {
            console.log(chalk.red(`❌ Failed to connect: ${error.message}`));
            return { success: false, error: error.message };
        }
    },

    // Test get chats
    async testGetChats() {
        console.log(chalk.blue('\n📋 Testing Get Chats'));
        // Ensure we have a token
        if (!config.token) {
            console.log(chalk.yellow('⚠️ No authentication token. Please login first.'));
            return { success: false, error: 'No token' };
        }

        try {
            const res = await api.get('/chats');
            return handleResponse(res, 'Get chats successful');
        } catch (error) {
            console.log(chalk.red(`❌ Failed to connect: ${error.message}`));
            return { success: false, error: error.message };
        }
    },

    // Test send message
    async testSendMessage() {
        console.log(chalk.blue('\n📋 Testing Send Message'));
        // Ensure we have a token and chat ID
        if (!config.token) {
            console.log(chalk.yellow('⚠️ No authentication token. Please login first.'));
            return { success: false, error: 'No token' };
        }

        if (!config.chatId) {
            console.log(chalk.yellow('⚠️ No chat ID. Please create a chat first.'));
            return { success: false, error: 'No chat ID' };
        }

        try {
            const prompt = await this.prompt(chalk.yellow('Enter message (or press Enter for default): '));

            const res = await api.post(`/chats/${config.chatId}/messages`, {
                prompt: prompt || 'This is a test message from API Test tool',
            });

            // This might take some time since it needs to call Ollama
            console.log(chalk.blue('Waiting for AI response... This might take a few seconds.'));

            return handleResponse(res, 'Send message successful');
        } catch (error) {
            console.log(chalk.red(`❌ Failed to connect: ${error.message}`));
            return { success: false, error: error.message };
        }
    },

    // Test task parameterization (requires task ID)
    async testTaskParameterization() {
        console.log(chalk.blue('\n📋 Testing Task Parameterization'));
        // Ensure we have a token
        if (!config.token) {
            console.log(chalk.yellow('⚠️ No authentication token. Please login first.'));
            return { success: false, error: 'No token' };
        }

        try {
            const taskId = await prompt(chalk.yellow('Enter task ID from Django: '));

            if (!taskId) {
                console.log(chalk.yellow('⚠️ No task ID provided. Skipping test.'));
                return { success: false, error: 'No task ID' };
            }

            const res = await api.get(`/tasks/${taskId}/parameterize`);
            return handleResponse(res, 'Task parameterization successful');
        } catch (error) {
            console.log(chalk.red(`❌ Failed to connect: ${error.message}`));
            return { success: false, error: error.message };
        }
    },

    // Test resource assignment (requires task ID)
    async testResourceAssignment() {
        console.log(chalk.blue('\n📋 Testing Resource Assignment'));
        // Ensure we have a token
        if (!config.token) {
            console.log(chalk.yellow('⚠️ No authentication token. Please login first.'));
            return { success: false, error: 'No token' };
        }

        try {
            const taskId = await prompt(chalk.yellow('Enter task ID from Django: '));

            if (!taskId) {
                console.log(chalk.yellow('⚠️ No task ID provided. Skipping test.'));
                return { success: false, error: 'No task ID' };
            }

            const res = await api.get(`/resources/assign/${taskId}`);
            return handleResponse(res, 'Resource assignment successful');
        } catch (error) {
            console.log(chalk.red(`❌ Failed to connect: ${error.message}`));
            return { success: false, error: error.message };
        }
    },
};

// Main function to run tests
async function runTests() {
    console.log(chalk.bgBlue.white('\n\n📊 API Intermediaria Test Tool\n'));

    // Display menu
    console.log(chalk.cyan('Select a test to run:'));
    console.log('1. Test Health Endpoint');
    console.log('2. Register new user');
    console.log('3. Login user');
    console.log('4. Get current user');
    console.log('5. Create chat');
    console.log('6. Get user chats');
    console.log('7. Send message to chat');
    console.log('8. Test task parameterization');
    console.log('9. Test resource assignment');
    console.log('10. Run all basic tests');
    console.log('0. Exit');

    // Get user choice
    const choice = await prompt(chalk.yellow('\nEnter your choice: '));

    // Execute selected test
    switch (choice) {
        case '1':
            await tests.testHealth();
            break;
        case '2':
            await tests.testRegister();
            break;
        case '3':
            await tests.testLogin();
            break;
        case '4':
            await tests.testGetCurrentUser();
            break;
        case '5':
            await tests.testCreateChat();
            break;
        case '6':
            await tests.testGetChats();
            break;
        case '7':
            await tests.testSendMessage();
            break;
        case '8':
            await tests.testTaskParameterization();
            break;
        case '9':
            await tests.testResourceAssignment();
            break;
        case '10':
            console.log(chalk.bgBlue.white('\n\n🚀 Running all basic tests\n'));
            await tests.testHealth();
            await tests.testRegister();
            await tests.testGetCurrentUser();
            await tests.testCreateChat();
            await tests.testGetChats();
            await tests.testSendMessage();
            break;
        case '0':
            console.log(chalk.green('👋 Goodbye!'));
            rl.close();
            return;
        default:
            console.log(chalk.red('❌ Invalid choice'));
            break;
    }

    // Ask if user wants to run another test
    const runAnother = await prompt(chalk.yellow('\nRun another test? (y/n): '));
    if (runAnother.toLowerCase() === 'y') {
        await runTests();
    } else {
        console.log(chalk.green('👋 Goodbye!'));
        rl.close();
    }
}

// Run the tests
if (require.main === module) {
    runTests().catch((error) => {
        console.error(chalk.red(`❌ Unexpected error: ${error.message}`));
        rl.close();
        process.exit(1);
    });
}

module.exports = tests;
