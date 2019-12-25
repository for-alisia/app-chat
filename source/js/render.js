function render(templateName, data = '') {
    return require(`../views/${templateName}.hbs`)(data);
}

export default render;
