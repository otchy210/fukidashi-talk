"use strict";

// utils
var save = function(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
};
var load = function(key, defaultValue) {
    var value = localStorage.getItem(key);
    if (!value) {
        return defaultValue;
    }
    return JSON.parse(value);
};
var isAcceptableType = function(type) {
    switch(type) {
        case 'image/png':
        case 'image/jpeg':
        case 'image/gif':
            return true;
    }
    return false;
}

// global objects
var $body = $('body');
var $alert = $('#ft-alert');
var $form = $('#ft-form');
var $talk = $('#ft-talk');
var $talkUl = $talk.find('ul');
var canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 256;
var ctx = canvas.getContext('2d');
var nullImageData = ctx.createImageData(256, 256);

// templates
var templates = {
    alert: Handlebars.compile($('#alert-template').html()),
    character: Handlebars.compile($('#character-template').html()),
    baloon: Handlebars.compile($('#baloon-template').html())
};

// alerts
var addAlert = function(type, text) {
    var html = templates.alert({
        type: type, text: text
    });
    $alert.append(html);
};

// global config
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
    autosize.update($talk.find('textarea'));
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
applyStyle();

// add character
var characterCounter = 0;
var $characters = $('#ft-characters');
var addCharacter = function(file) {
    var message = file.name + " のキャラクター名を指定して下さい。";
    var name;
    do {
        name = prompt(message, file.name);
    } while (!name);
    var html = templates.character({name: name});
    $characters.append(html);
    var $tr = $characters.find('tr:last-child');
    characterCounter++;
    var characterId = 'ft-character-' + characterCounter;
    $tr.attr('id', characterId);
    addIcon($tr, file);
};
var iconCounter = 0;
var addIcon = function($tr, file) {
    var fileReader = new FileReader();
    $(fileReader).on('load', function(e) {
        var $img = $('<img>').addClass('ft-loading-image');
        $img.on('load', function() {
            var w = $img.width();
            var h = $img.height();
            var target = {
                x: 0,
                y: 0,
                w: 0,
                h: 0
            }
            if (w > h) {
                target.w = 256;
                target.h = (256 / w) * h;
                target.y = 128 - target.h / 2;
            } else {
                target.h = 256;
                target.w = (256 / h) * w;
                target.x = 128 - target.w / 2;
            }
            ctx.putImageData(nullImageData, 0, 0);
            ctx.drawImage($img.get(0), 0, 0, w, h, target.x, target.y, target.w, target.h);
            // $img.attr('src', canvas.toDataURL());
            $img.remove();
            iconCounter++;
            var iconClass = 'ft-icon-' + iconCounter;
            var styleId = 'ft-icon-' + iconCounter + '-style';
            var $style = $('<style>')
                .attr('id', styleId)
                .html('.' + iconClass + '{background-image:url(' + canvas.toDataURL() + ')}')
            $body.append($style);
            var $span = $('<span>').addClass(iconClass).data('characterId', $tr.attr('id'));
            $tr.find('.ft-characters-icon')
                .append($span);
        });
        $body.append($img);
        $img.attr('src', e.target.result);
    });
    fileReader.readAsDataURL(file);
};
var stopEvent = function(e) {
    e.preventDefault();
    e.stopPropagation();
};
var onDragenter = function(e) {
    stopEvent(e);
    $(e.target).addClass('ft-dragging');
};
var onDragleave = function(e) {
    stopEvent(e);
    $(e.target).removeClass('ft-dragging');
};
var onDrop = function(e, fileHandler) {
    onDragleave(e);
    var files = e.originalEvent.dataTransfer.files;
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (!isAcceptableType(file.type)) {
            addAlert('warning', file.name + ' は対応可能な画像形式ではありません。png/jpeg/gif のいずれかを指定して下さい。')
            continue;
        }
        fileHandler(file);
    }
};
$('#ft-add-character')
.on('dragenter', onDragenter)
.on('dragover', stopEvent)
.on('dragleave', onDragleave)
.on('drop', function(e) {
    onDrop(e, addCharacter);
});
$characters
.on('dragenter', '.ft-droppable', onDragenter)
.on('dragover', '.ft-droppable', stopEvent)
.on('dragleave', '.ft-droppable', onDragleave)
.on('drop', '.ft-droppable', function(e) {
    var $tr = $(this).closest('tr');
    onDrop(e, function(file) {
        addIcon($tr, file);
    });
});

// add baloon
var $addBaloon = $('#ft-add-baloon');
var $addBaloonDropdown = $addBaloon.find('.dropdown-menu');
var $baloonMenu = $('#ft-baloon-menu').remove();
$addBaloon.on('show.bs.dropdown', function () {
    $addBaloonDropdown.empty();
    $characters.find('tr').each(function() {
        var $tr = $(this);
        var $a = $('<a>');
        var $li = $('<li>').append($a);
        var name = $tr.find('input[name=name]').val();
        var clazz = $tr.find('.ft-characters-icon span:first-child').attr('class');
        $a.text(name).data('icon-class', clazz);
        $addBaloonDropdown.append($li);
    });
});
$addBaloonDropdown.on('click', 'a', function() {
    var $a = $(this);
    var html = templates.baloon({'icon-class': $a.data('icon-class')});
    var $li = $(html);
    $talkUl.append($li);
    autosize($li.find('textarea'));
});
var initBaloonManu = function() {
    $baloonMenu.on('change', 'input', function() {
        var $input = $(this);
        var $li = $input.closest('li');
        var classes = $li.attr('class').split(' ');
        var prefix = 'ft-' + $input.attr('name') + '-';
        for (var i = 0; i < classes.length; i++) {
            if (classes[i].indexOf(prefix) === 0) {
                classes[i] = prefix + $input.val();
                break;
            }
        }
        $li.attr('class', classes.join(' '));
    });
}
var menuClassRegex = /^ft-([a-z-]+)-([a-z]+)/;
$talkUl.on('click', 'li', function(e) {
    if ($(e.target).closest('#ft-baloon-menu').size() > 0) {
        return;
    }
    $baloonMenu.remove();
    var $li = $(this);
    $li.append($baloonMenu);
    var classes = $li.attr('class').split(' ');
    for (var i = 0; i < classes.length; i++) {
        var match;
        if (!(match = menuClassRegex.exec(classes[i]))) {
            continue;
        }
        var selector = '[name=' + match[1] + '][value=' + match[2] + ']';
        $baloonMenu.find(selector).trigger('click');
    }
    initBaloonManu();
}).on('click', '.ft-close', function(e) {
    $baloonMenu.remove();
    stopEvent(e);
}).on('click', '.ft-icon', function(e) {
    var $target = $(e.target);
    var $icon = $(this);
    var classes = $icon.attr('class').split(' ');
    var newClasses = [];
    var iconClass;
    for (var i = 0; i < classes.length; i++) {
        if (classes[i].indexOf('ft-icon-') === 0) {
            iconClass = classes[i];
            continue;
        }
        newClasses.push(classes[i]);
    }
    var iconSpan = $characters.find('.' + iconClass);
    var characterId = iconSpan.data('characterId');
    var $characterTr = $('#' + characterId);
    var $icons = $characterTr.find('.ft-characters-icon span');
    var $currentIcon = $characterTr.find('.' + iconClass);
    var nextIndex = ($currentIcon.index() + ($target.hasClass('ft-icon-next') ? 1 : -1)) % $icons.size();
    var newClass = $($icons.get(nextIndex)).attr('class');
    newClasses.push(newClass);
    $icon.attr('class', newClasses.join(' '));
});
$body.on('click', function(e) {
    var $talk = $(e.target).closest('#ft-talk');
    if ($talk.length > 0) {
        return;
    }
    $baloonMenu.remove();
});
// export
var $exportModal = $('#ft-export-modal');
var $exportPre = $exportModal.find('pre');
var initialCss = $('#ft-css').html();
var selectPre = function() {
    var $pre = $exportModal.find('pre');
    var range = document.createRange();
    range.selectNodeContents($pre.get(0));
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
};
$exportModal.on('show.bs.modal', function () {
    var $pre = $exportModal.find('pre').empty();
    var css = initialCss + '\n';
    var result = '';
    $characters.find('.ft-characters-icon > span').each(function() {
        var $iconSpan = $(this);
        var iconClass = $iconSpan.attr('class');
        if ($talkUl.find('.' + iconClass).size() === 0) {
            return;
        }
        var $style = $('#' + iconClass + '-style');
        css += '#ft-talk ' + $style.html() + '\n';
    });
    result += '<style>\n';
    result += css;
    result += '</style>\n';
    result += '<div id="' + $talk.attr('id') + '" class="' + $talk.attr('class') + '" >\n';
    result += '  <ul>\n';
    $talkUl.children().each(function() {
        var $li = $(this);
        result += '    <li class="' + $li.attr('class') + '">\n';
        result += '      <div class="' + $li.find('.ft-icon').attr('class') + '"></div>\n';
        result += '      <div class="' + $li.find('.ft-baloon').attr('class') + '">\n';
        $li.find('textarea').val().split('\n').forEach(function(line) {
            result += '        ' + line + '<br>\n';
        });
        result += '      </div>\n';
        result += '    </li>\n';
    });
    result += '  </ul>\n';
    result += '<div class="ft-note">この HTML は<a href="http://fukidashi-talk.otchy.net/" target="_blank">フキダシトーク</a>で出力されました。</div>\n';
    result += '</div>\n';
    $pre.text(result);
}).on('shown.bs.modal', function() {
    selectPre();
}).on('click', '#ft-copy', function() {
    selectPre();
    try {
        document.execCommand("copy")
    } catch (e) {
        addAlert('warning', 'コピー失敗');
    }
});
