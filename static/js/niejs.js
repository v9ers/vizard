var render = function(selector, locals) {
        if (!$(selector).size()) {
                throw new Error('jQuery selector is empty - no ejs to compile. Selector=' + $(selector).selector);
        }

        locals.params = locals;

        return new EJS({text:$(selector).text() || $(selector).html()}).render(locals);
};