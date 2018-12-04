const env = process.env.NODE_ENV || 'development';

if (env === 'development' || 'test') {
    // Uses try catch block for use in heroku, will crash otherwise
    try {
        const config = require('./config.json'); //eslint-disable-line
        const envConfig = config[env];

        Object.keys(envConfig).forEach((key) => {
            process.env[key] = envConfig[key];
        });
    } catch (e) {
        console.log(e);
    }
}
