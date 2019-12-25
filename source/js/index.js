// GARBAGE
import '../scss/index.scss';
import '../img/camera_icon.png';
import '../img/close_icon.png';
import '../img/favicon.png';
import '../img/menu_icon.png';
import '../img/logo_blue.png';

// SCRIPTS
import User from './store';
import handlers from './handlers';
import render from './render';

// Получаем основной контейнер для разметки
const root = document.getElementById('root');
const user = new User();

// Создаем объект, описывающий поведение отрендеренных секций
const router = {
    welcome: page => {
        const signIn = page.querySelector('#signIn');
        const inputs = page.querySelectorAll('input');

        signIn.addEventListener('click', e => {
            e.preventDefault();
            if (validate(inputs)) {
                const name = page.querySelector('#name').value;
                const nickName = page.querySelector('#nickName').value;

                user.setName(name);
                user.setNickName(nickName);
                root.innerHTML = render('chat', {
                    name: name,
                    nickName: nickName
                });
            }
        });
    },
    chat: page => {
        const sendBtn = page.querySelector('#sendMsg');
        const msgInput = document.getElementById('message');
        const ws = initSockets(page);

        sendBtn.addEventListener('click', e => {
            e.preventDefault();
            const msg = msgInput.value;
            if (!msg == '') {
                ws.send(JSON.stringify({ payload: 'newMsg', data: msg }));
                msgInput.value = '';
            }
        });
    }
};

// Создаем mutation observer
const config = {
    childList: true,
    subtree: true
};

const observer = new MutationObserver(observerCallback);

observer.observe(root, config);

// Рендерим страницу входа (welcome)
window.addEventListener('DOMContentLoaded', () => {
    root.innerHTML = render('welcome');
});

// Функция, выполняющаяся при измении root (передается в mutation observer)
function observerCallback(mutationList, observer) {
    const page = mutationList[0].addedNodes[0];
    if (page) {
        const pageId = page.id;

        if (router[pageId]) {
            router[pageId](page);
        }
    }
}

// Подключаемся к серверу при входе в чат
function initSockets(page) {
    const ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
        console.log('Client here');
        ws.send(JSON.stringify({ payload: 'newUser', data: user }));
    };

    ws.onclose = () => {
        console.log('client switched off');
    };

    ws.onmessage = e => {
        const dataParse = JSON.parse(e.data);
        handlers[dataParse.payload](
            dataParse.data,
            page,
            dataParse.qty,
            dataParse.isAuthor,
            dataParse.author,
            ws
        );
    };

    const logOut = page.querySelector('#logOut');
    logOut.addEventListener('click', e => {
        ws.close();
        root.innerHTML = render('welcome');
    });

    return ws;
}

// Функция, валидирующая форму
function validate(inputs) {
    for (let input of inputs) {
        if (input.value == '') {
            input.nextElementSibling.classList.remove('display-none');
            return false;
        } else {
            input.nextElementSibling.classList.add('display-none');
        }
    }

    return true;
}
