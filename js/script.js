var $form = $('#ft-form');
var $talk = $('#ft-talk');
var globalClasses = [
    'icon-size',
    'icon-shape',
    'icon-border',
    'icon-shadow',
    'baloon-shape',
    'baloon-border',
    'baloon-shadow',
    'talk-width'
];
var applyStyle = function() {
    var classes = [];
    var globalSettings = [];
    globalClasses.forEach(function(name) {
        var val = $form.find('input[name=' + name + ']:checked').val()
        globalSettings.push([name, val]);
        classes.push('ft-' + name + '-' + val);
    });
    $talk.attr('class', classes.join(' '));
    save('global-settings', globalSettings);
};
var save = function(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
};
var load = function(key) {
    var value = localStorage.getItem(key);
    if (!value) {
        return null;
    }
    return JSON.parse(value);
};
var loadGlobalSettings = function() {
    var globalSettings = load('global-settings');
    if (!globalSettings) {
        return;
    }
    globalSettings.forEach(function(pair) {
        var name = pair[0];
        var value = pair[1];
        $form.find('input[name=' + name + '][value=' + value + ']').trigger('click');
    });
}
loadGlobalSettings();
$form.on('change', 'input', applyStyle);
$form.on('change', '.form-control[name=color]', function() {
    $(this).attr('data-color', this.value);
}).trigger('change');
applyStyle();
