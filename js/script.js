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
var remove = function(key) {
    localStorage.removeItem(key);
};
var addAlert = function(type, text) {
    var html = templates.alert({
        type: type, text: text
    });
    $alert.append(html);
};
var isAcceptableType = function(type) {
    switch(type) {
        case 'image/png':
        case 'image/jpeg':
        case 'image/gif':
            return true;
    }
    return false;
};
var hash = function(str) {
    var hash = 0;
    if (str.length === 0) return '00000000';
    for (var i = 0; i < str.length; i++) {
        var chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return ('0000000' + hash.toString(16)).slice(-8);
};
var generateUid = function() {
    var ts = (new Date()).getTime();
    var r = Math.pow(2, 64) * Math.random();
    var uid = hash(ts.toString());
    uid += hash(r.toString(16));
    return uid;
};
var arrayRemove = function(array, item) {
    var index = array.indexOf(item);
    if (index >= 0) {
        array.splice(index, 1);
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
    icon: Handlebars.compile($('#icon-template').html()),
    baloon: Handlebars.compile($('#baloon-template').html())
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
};
loadGlobalSettings();
$form.on('change', 'input', applyStyle);
applyStyle();

// add character
var $characters = $('#ft-characters');
var addCharacter = function(file) {
    var message = file.name + " のキャラクター名を指定して下さい。";
    var name;
    do {
        name = prompt(message, file.name);
    } while (!name);
    var $tr = addCharacter_(name);
    addIcon($tr, file);
};
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
            $img.remove();
            var imageData = canvas.toDataURL();
            addIcon_($tr, imageData);
        });
        $body.append($img);
        $img.attr('src', e.target.result);
    });
    fileReader.readAsDataURL(file);
};
var characterCounter = 0;
var addCharacter_ = function(name, uid) {
    characterCounter++;
    var characterId = 'ft-character-' + characterCounter;
    if (!uid) {
        uid = generateUid();
    }
    var html = templates.character({name: name, id: characterId, uid: uid});
    $characters.append(html);
    if (!arguments[1]) {
        save(uid, {name:name});
        var characters = load('characters', []);
        characters.push(uid);
        save('characters', characters);
    }
    return $characters.find('tr:last-child');
};
var iconCounter = 0;
var addIcon_ = function($tr, imageData, uid) {
    iconCounter++;
    var iconClass = 'ft-icon-' + iconCounter;
    var styleId = 'ft-icon-' + iconCounter + '-style';
    if (!uid) {
        uid = generateUid();
    }
    var $style = $('<style>')
        .attr('id', styleId)
        .html('.' + iconClass + '{background-image:url(' + imageData + ')}')
    $body.append($style);
    var html = templates.icon({'class': iconClass, characterId: $tr.attr('id'), uid: uid});
    $tr.find('.ft-characters-icon').append(html);
    if (!arguments[2]) {
        save(uid, imageData);
        var iconsKey = $tr.data('uid') + '-icons';
        var icons = load(iconsKey, []);
        icons.push(uid);
        save(iconsKey, icons);
    }
};
var deleteIcon_ = function($span, $icons, iconClass) {
    var iconUid = $span.data('uid');
    var characterUid = $span.closest('tr').data('uid');
    var $style = $('#' + iconClass);
    $style.remove();
    $span.remove();
    $icons.each(function() {
        $(this).closest('li').remove();
    });
    var iconsKey = characterUid + '-icons';
    var icons = load(iconsKey, []);
    if (arrayRemove(icons, iconUid)) {
        save(iconsKey, icons);
    }
    remove(iconUid);
};
var deleteCharacter_ = function($tr) {
    var uid = $tr.data('uid');
    var $icons = $tr.find('.ft-characters-icon > span');
    var classes = [];
    $icons.each(function() {
        classes.push($(this).attr('class'));
    });
    var selector = '.' + classes.join(', .');
    $talk.find(selector).each(function() {
        $(this).closest('li').remove();
    });
    $tr.remove();
    var iconsKey = uid + '-icons';
    load(iconsKey, []).forEach(function(iconUid) {
        remove(iconUid);
    });
    remove(iconsKey);
    remove(uid);
    var characters = load('characters', []);
    if (arrayRemove(characters, uid)) {
        save('characters', characters);
    }
}
var loadCharacters = function() {
    var characters = load('characters', []);
    characters.forEach(function(uid){
        var character = load(uid, {});
        var $tr = addCharacter_(character.name, uid);
        var icons = load(uid + '-icons', []);
        icons.forEach(function(uid) {
            var imageData = load(uid, '');
            addIcon_($tr, imageData, uid);
        });
    });
};
loadCharacters();
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
}).on('change', 'input[name=name]', function() {
    var $input = $(this);
    var $tr = $input.closest('tr');
    var uid = $tr.data('uid');
    var data = load(uid, {});
    data.name = $input.val();
    save(uid, data);
}).on('click', '.ft-delete-icon', function() {
    var $span = $(this).parent();
    var $tr = $span.closest('tr');
    var $characterIcons = $tr.find('.ft-characters-icon > span');
    if ($characterIcons.length <= 1) {
        addAlert('warning', '全てのアイコンを削除する事は出来ません。');
        return;
    }
    var iconClass = $span.attr('class');
    var $icons = $talk.find('.' + iconClass);
    if ($icons.length > 0) {
        bootbox.confirm('アイコンを使用している吹き出しも同時に削除されます。よろしいですか？', function(result) {
            if (result) {
                deleteIcon_($span, $icons, iconClass);
            }
        });
    } else {
        deleteIcon_($span, $icons, iconClass);
    }
}).on('click', '.ft-delete-character', function() {
    var self = this;
    bootbox.confirm('全てのアイコン画像、アイコンを使用している吹き出しも同時に削除されます。よろしいですか？', function(result) {
        if (result) {
            var $tr = $(self).closest('tr');
            deleteCharacter_($tr);
        }
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
    var $iconSpan = $characters.find('.' + iconClass);
    var characterId = $iconSpan.data('character-id');
    var $characterTr = $('#' + characterId);
    var $icons = $characterTr.find('.ft-characters-icon > span');
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
// initialize
$('#ft-initialize').on('click', function() {
    bootbox.confirm('全てのデータを削除し再読込を行います。よろしいですか？', function(result) {
        if (!result) {
            return;
        }
        localStorage.clear();
        location.href = '/';
    });
});