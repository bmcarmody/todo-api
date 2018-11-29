let env = process.env.NODE_ENV || 'development';

if (env === 'development' || 'test') {
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

