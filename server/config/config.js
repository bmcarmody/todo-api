let env = process.env.NODE_ENV || 'development';

if (env === 'development' || 'test') {
    //Uses try catch block for use in heroku, it will crash when it cannot find the config.json file
    try {
        let config = require('./config.json'); 
    } catch(e) {
        return "";
    }
    let envConfig = config[env];
    
    Object.keys(envConfig).forEach((key) => {
        process.env[key] = envConfig[key];
    });
    
}

