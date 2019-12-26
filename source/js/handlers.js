import render from './render';

const handlers = {
    // Подключение нового пользователя
    newUser: (msg, page, qty, isAuthor, author, ws) => {
        const msgContainer = page.querySelector('.main__msg');
        const listContainer = page.querySelector('.aside__list');

        userJoined(author, msgContainer, true);
        createParticipant(author, listContainer, isAuthor);
        countParticipants(qty, page);

        //Обрабатываем добавление фото
        const authorLi = page.querySelector('.author__item');
        const photo = authorLi.querySelector('.card__photo');
        photo.addEventListener('click', e => {
            const popupContainer = page.querySelector('#photo-popup');
            const currentPhoto = e.target.src;
            const fileReader = new FileReader();

            popupContainer.innerHTML = render('photo', {
                ava: currentPhoto
            });
            popupContainer.style.display = 'block';

            const photoInput = popupContainer.querySelector('#choosePhoto');
            const image = popupContainer.querySelector('.photoEditor__img');
            const savePhoto = popupContainer.querySelector('#savePhoto');
            const cancelPhoto = popupContainer.querySelector('#cancelPhoto');
            const dragArea = document.getElementById('dragArea');

            fileReader.addEventListener('load', () => {
                image.src = fileReader.result;
            });
            photoInput.addEventListener('change', e => {
                const files = e.target.files;

                handleFiles(files, fileReader);
            });

            // Обрабатываем DnD
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(
                eventName => {
                    dragArea.addEventListener(
                        eventName,
                        preventDefaults,
                        false
                    );
                }
            );

            dragArea.addEventListener(
                'drop',
                e => {
                    let dt = e.dataTransfer;
                    let files = dt.files;

                    handleFiles(files, fileReader);
                },
                false
            );

            // Обрабатываем кнопки
            savePhoto.addEventListener('click', e => {
                e.preventDefault();
                if (fileReader.result) {
                    ws.send(
                        JSON.stringify({
                            payload: 'newPhoto',
                            data: fileReader.result
                        })
                    );
                    popupContainer.innerHTML = '';
                    popupContainer.style.display = 'none';
                } else {
                    console.log('картинка не выбрана');
                }
            });

            cancelPhoto.addEventListener('click', e => {
                e.preventDefault();
                popupContainer.innerHTML = '';
                popupContainer.style.display = 'none';
            });
        });
    },
    // Получение списка всех пользователей
    getUsers: (users, page) => {
        const listContainer = page.querySelector('.aside__list');

        users.forEach(user => {
            if (user) {
                createParticipant(user, listContainer);
            }
        });
    },

    // Получение сообщения
    newMsg: (msg, page, qty, isAuthor, author) => {
        const msgContainer = page.querySelector('.main__msg');
        addMessage(msg, msgContainer, isAuthor, author);
    },
    // Отключение пользователя
    closeUser: (msg, page, qty, isAuthor, author) => {
        const msgContainer = page.querySelector('.main__msg');
        const userList = page.querySelector('.aside__list');

        deleteFromList(author, userList);
        userJoined(author, msgContainer, false);
        countParticipants(qty, page);
    },
    // Получение добавленного фото с сервера
    newPhoto: (msg, page, qty, isAuthor, author) => {
        const userList = page.querySelector('.aside__list');
        const msgContainer = page.querySelector('.main__msg');

        addPhotoToList(author, userList);
        addPhotoToMsg(author, msgContainer);
    },
    getMsgs: (msgList, page, qty, isAuthor, author) => {
        const msgContainer = page.querySelector('.main__msg');

        msgList.forEach(message => {
            let isAuthor = message.user.id == author.id ? true : false;

            addMessage(message.msg, msgContainer, isAuthor, message.user);
        });
    }
};

export default handlers;

// Функция, добавляющая пользователя в список
function createParticipant(user, container, isAuthor) {
    const newParticipant = render('participant', {
        name: user.name,
        nickName: user.nickName,
        ava: user.ava
    });
    const newLi = document.createElement('li');
    newLi.classList.add('aside__item');
    newLi.dataset.userId = user.id;
    newLi.innerHTML = newParticipant;
    if (isAuthor) {
        newLi.classList.add('author__item');
    }
    container.appendChild(newLi);
}

// Функция, создающая сообщение о подключении пользователя
function userJoined(user, container, isJoin) {
    const joinedMsg = render('serviceMsg', {
        name: user.name,
        nickName: user.nickName,
        joinChat: isJoin
    });
    const serviceMsg = document.createElement('div');
    serviceMsg.classList.add('message');
    serviceMsg.classList.add('message-service');
    serviceMsg.innerHTML = joinedMsg;
    container.appendChild(serviceMsg);
}

// Функция, добавляющая сообщение
function createMsg(msg, isAuthor, author, msgContainer) {
    const msgBlock = document.createElement('div');
    const date = new Date();
    const renderedMsg = render('msg', {
        msgText: msg,
        msgDate: `${date.getHours()}:${date.getMinutes()}`,
        authorName: author.name,
        authorNickName: author.nickName,
        ava: author.ava
    });
    msgBlock.classList.add('message');
    if (isAuthor) {
        msgBlock.classList.add('message--author');
    }
    msgBlock.dataset.userId = author.id;
    msgBlock.innerHTML = renderedMsg;
    msgContainer.appendChild(msgBlock);
}

// Функция, добавляющая короткое сообщение
function createShortMsg(msg, lastMsg) {
    const msgBlock = document.createElement('div');
    const date = new Date();
    const renderedMsg = render('short_msg', {
        msgText: msg,
        msgDate: `${date.getHours()}:${date.getMinutes()}`
    });
    msgBlock.classList.add('message__wrapper');
    msgBlock.innerHTML = renderedMsg;
    lastMsg.appendChild(msgBlock);
}

// Функция, которая находит и удаляет нужного пользователя из списка при его отключении
function deleteFromList(author, list) {
    const users = list.querySelectorAll('.aside__item');

    for (let user of users) {
        if (user.dataset.userId == author.id) {
            user.remove();
        }
    }
}

// Функция, которая возвращает количество участников в чате
function countParticipants(qty, page) {
    const qtyContainer = page.querySelector('.main__qty');

    qtyContainer.textContent = `Участников в чате: ${qty}`;
}

function addPhotoToList(author, list) {
    const items = list.querySelectorAll('.aside__item');
    const id = author.id;

    for (let item of items) {
        if (item.dataset.userId == id) {
            const photo = item.querySelector('.card__img');
            photo.src = author.ava;
        }
    }
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Добавляем выбранное фото в fileReader
function handleFiles(files, fileReader) {
    const [file] = files;

    if (file) {
        if (file.size > 1024 * 1024 || file.type !== 'image/jpeg') {
            console.log(`Размер файла ${file.size}, тип файла ${file.type}`);
            return;
        }
        fileReader.readAsDataURL(file);
    }
}

// Функция, которая добавляет сообщение
function addMessage(msg, msgContainer, isAuthor, author) {
    const lastMsg = msgContainer.lastElementChild;
    if (lastMsg && lastMsg.dataset.userId == author.id) {
        createShortMsg(msg, lastMsg);
    } else {
        createMsg(msg, isAuthor, author, msgContainer);
    }
}

// Функция, добавляющая фото в сообщения юзера
function addPhotoToMsg(author, msgContainer) {
    const msgs = msgContainer.querySelectorAll('.message');

    msgs.forEach(msg => {
        if (msg.dataset.userId == author.id) {
            const avaBlock = msg.querySelector('.message__ava');
            const img = avaBlock.querySelector('img');

            img.src = author.ava;
        }
    });
}
