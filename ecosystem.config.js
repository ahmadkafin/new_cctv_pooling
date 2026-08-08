module.exports = {
    apps: [
        {
            name: "new_api_pooling",
            script: "./server.js",
            interpreter: process.env.INTERPRETER,
            env: {
                NODE_ENV: "development",
                PORT: 3002
            }
        }
    ]
}