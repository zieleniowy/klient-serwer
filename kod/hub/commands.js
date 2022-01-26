const commands = {};

const register = (name, fn) => commands[name] = fn
const use = async ({name, token, payload, socketID}) => ({ token, payload: await commands[name](payload, socketID) });

module.exports = {
    register,
    use,
    exists: (name) => Boolean(commands[name]) 
}