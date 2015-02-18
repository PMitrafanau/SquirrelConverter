/*
var jqEnableHotkey = $('.enable-hotkey');
var jqHotkeyModifier = $('.hotkey-modifier');
var jqKey = $('.key');

$('.tab').on('click', function () {
    var jqThis = $(this);
    var jqActive = $('.tab.active');

    if (jqThis.hasClass('active')) {
        return;
    }

    jqActive.removeClass('active');
    $('#' + jqActive.attr('tab-contents-id')).hide();

    jqThis.addClass('active');
    $('#' + jqThis.attr('tab-contents-id')).show();
});

jqKey.on('keydown', function (e) {
    if (e.which != 8 && ($(this).val().length == 1 || !isAllowedKeyCode(e.which))) {
        e.preventDefault();
    }
});

jqKey.on('keyup', function () {
    changeEnableHotkeyState(this, false);
    this.value = this.value.replace(/[а-яё]/i, "").toUpperCase();
});

jqHotkeyModifier.on('change', function() {
    changeEnableHotkeyState(this, false);
});

jqEnableHotkey.on('change', function() {
    if (!isEnableHotkeyCanBeChecked(this)) {
        $(this).prop('checked', false);
    } else {
        // TODO: place some logic here (emit message)
    }
});

*/
/**
 * Checks whether passed enable hotkey checkbox can be checked
 * (it depends on corresponding modifiers and input for key)
 *//*

function isEnableHotkeyCanBeChecked(enableHotkeyCheckbox) {
    var jqFieldset = $(enableHotkeyCheckbox).parent().parent();
    return jqFieldset.find('.hotkey-modifier:checked').size() > 0 && */
/* at least one modifier should be checked *//*

        jqFieldset.find('.key').val().length == 1; // the input for key shouldn't be empty
}

*/
/**
 * Changes the state of the enable hotkey checkbox which is in respect with hotkeyComponent
 *//*

function changeEnableHotkeyState(hotkeyComponent, checked) {
    $(hotkeyComponent).parent().parent().find('.enable-hotkey').prop('checked', checked);

    if (checked) {

    } else {

    }
}

*/
/**
 * The key code is allowed if it has one of the following values:
 * [65-90], [97-122]
 *//*

function isAllowedKeyCode(code) {
    return !((code > 90 && code < 97) ||
    (code < 65 || code > 122));
}*/


/*    var jqEnableHotkey = $('.enable-hotkey');
 var jqHotkeyModifier = $('.hotkey-modifier');
 var jqKey = $('.key');

 $('.tab').on('click', function () {
 var jqThis = $(this);
 var jqActive = $('.tab.active');

 if (jqThis.hasClass('active')) {
 return;
 }

 jqActive.removeClass('active');
 $('#' + jqActive.attr('tab-contents-id')).hide();

 jqThis.addClass('active');
 $('#' + jqThis.attr('tab-contents-id')).show();
 });

 jqKey.on('keydown', function (e) {
 if (e.which != 8 && ($(this).val().length == 1 || !isAllowedKeyCode(e.which))) {
 e.preventDefault();
 }
 });

 jqKey.on('keyup', function () {
 jqEnableHotkey.prop('checked', false);
 this.value = this.value.replace(/[а-яё]/i, "").toUpperCase();
 });

 jqHotkeyModifier.on('change', function() {
 jqEnableHotkey.prop('checked', false);
 });

 jqEnableHotkey.on('change', function() {
 if (jqHotkeyModifier.filter(':checked').size() == 0 || jqKey.val().length != 1) {
 jqEnableHotkey.prop('checked', false);
 } else {
 // TODO: place some logic here (emit message)
 }
 });*/

/*    *//**
 * The key code is allowed if it has one of the following values:
 * [65-90], [97-122]
 *//*
 function isAllowedKeyCode(code) {
 return !((code > 90 && code < 97) ||
 (code < 65 || code > 122));
 }*/