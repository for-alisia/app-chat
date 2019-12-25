const WebSocket = require('ws');
const uuidv1 = require('uuid/v1');

const wss = new WebSocket.Server({ port: 3000 });

const users = [];

const messages = [];

const handlers = {
    newUser: (user, ws) => {
        const userSaved = getUserFromUsers(user);

        if (!userSaved) {
            user.id = uuidv1();
            users.push(user);
            console.log('new user');
        } else {
            user.id = userSaved.id;
            user.ava = userSaved.ava;
            console.log('old user');
        }

        ws.user = user;
        broadcast(
            {
                payload: 'newUser'
            },
            ws
        );
        ws.send(
            JSON.stringify({
                payload: 'getUsers',
                data: getCurrentClients(ws)
            })
        );
        if (userSaved) {
            ws.send(
                JSON.stringify({
                    payload: 'getMsgs',
                    data: messages,
                    author: user
                })
            );
        }
    },
    newMsg: (msg, ws) => {
        messages.push({
            msg: msg,
            user: ws.user
        });

        broadcast(
            {
                payload: 'newMsg',
                data: msg
            },
            ws
        );
    },
    closeUser: ws => {
        broadcast(
            {
                payload: 'closeUser'
            },
            ws
        );
    },
    newPhoto: (photo, ws) => {
        const user = getUserFromUsers(ws.user);
        user.ava = photo;
        ws.user.ava = photo;
        broadcast(
            {
                payload: 'newPhoto'
            },
            ws
        );
    }
};

wss.on('connection', function connection(ws) {
    console.log('Подключение');
    ws.on('close', () => {
        console.log('Отключение');
        handlers.closeUser(ws);
    });

    ws.on('message', data => {
        const dataParse = JSON.parse(data);

        handlers[dataParse.payload](dataParse.data, ws);
    });
});

function broadcast(message, ws) {
    let author = ws.user;
    wss.clients.forEach(client => {
        let isAuthor = client === ws ? true : false;
        client.send(
            JSON.stringify({
                payload: message.payload,
                data: message.data,
                qty: getUsersQty(),
                isAuthor: isAuthor,
                author: author
            })
        );
    });
}

function getCurrentClients(ws) {
    const users = [];
    wss.clients.forEach(client => {
        if (client !== ws) {
            users.push(client.user);
        }
    });

    return users;
}

function getUsersQty() {
    return wss.clients.size;
}

function getUserFromUsers(user) {
    let savedUser;
    users.forEach(item => {
        if (item.name == user.name && item.nickName == user.nickName) {
            savedUser = item;
        }
    });

    return savedUser;
}
