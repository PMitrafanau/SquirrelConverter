$(function() {
    console.log("[MENU] Entered the script");

    var ENABLE_CONVERSION_EVENT = "enable.event";
    var CHANGE_CURRENCY_EVENT = "change.currency.event";
    var CHANGE_RATE_USD_EVENT = "change.rate.usd.event";
    var CHANGE_RATE_EUR_EVENT = "change.rate.eur.event";
    var ENABLE_IFRAMES_CONVERSION_EVENT = "iframes.enable.event";
    var CHANGE_SELECTOR_EVENT = "change.selector.event";
    var CHANGE_REGEXP_EVENT = "change.regexp.event";
    var ENABLE_HOTKEY_EVENT = "hotkey.enable";

    var ENABLED_PROP = "enabled";
    var RATE_USD_PROP = "rate.usd";
    var RATE_EUR_PROP = "rate.eur";
    var CURRENCY_PROP = "currency";
    var REGEXP_STR_PROP = "regexp.str";
    var REGEXP_STR_DEFAULT_PROP = "regexp.str.default";
    var REGEXP_FLAGS_PROP = "regexp.flags";
    var REGEXP_FLAGS_DEFAULT_PROP = "regexp.flags.default";
    var SELECTOR_PROP = "selector";
    var SELECTOR_DEFAULT_PROP = "selector.default";
    var CONVERT_IFRAMES_PROP = "convert_iframes";
    var HOTKEY_ENABLED_PROP = "hotkey.enabled";
    var HOTKEY_MODIFIERS_PROP = "hotkey.modifiers";
    var HOTKEY_KEY_PROP = "hotkey.key";

    var regexpDefaultStr;
    var regexpDefaultFlags;
    var defaultSelector;

    init();

    $('#enable-conversion').on('change', function() {
        sendChangeState(ENABLE_CONVERSION_EVENT, this.checked);
    });

    $('input[type=radio][name=currency]').on('change', function() {
        sendChangeState(CHANGE_CURRENCY_EVENT, $(this).attr('value'));
    });

    $('.save-rate').on('click', function() {
        var rateCurrency = $(this).parent().attr('currency');
        var event = rateCurrency == 'usd' ? CHANGE_RATE_USD_EVENT : CHANGE_RATE_EUR_EVENT;
        sendChangeState(event, parseFloat( $('#rate-' + rateCurrency).val() ));
    });

    $('#enable-iframes').on('change', function() {
        sendChangeState(ENABLE_IFRAMES_CONVERSION_EVENT, this.checked);
    });

    $('#save-regexp').on('click', function() {
        sendChangeState(CHANGE_REGEXP_EVENT, {"str" : $('#regexp-str').val(), "flags" : $('#regexp-flags').val()});
    });

    $('#default-regexp').on('click', function() {
        $('#regexp-str').val(regexpDefaultStr);
        $('#regexp-flags').val(regexpDefaultFlags);
    });

    $('#save-selector').on('click', function() {
        sendChangeState(CHANGE_SELECTOR_EVENT, $('#selector').val());
    });

    $('#default-selector').on('click', function() {
        $('#selector').val(defaultSelector);
    });

    function init() {
        regexpDefaultStr = addon.options[REGEXP_STR_DEFAULT_PROP];
        regexpDefaultFlags = addon.options[REGEXP_FLAGS_DEFAULT_PROP];
        defaultSelector = addon.options[SELECTOR_DEFAULT_PROP];

        $('#enable-conversion').prop('checked', addon.options[ENABLED_PROP]);
        $('input[type=radio][name=currency][value=' + addon.options[CURRENCY_PROP].toUpperCase() + ']').prop('checked', true);
        $('#rate-usd').val(addon.options[RATE_USD_PROP]);
        $('#rate-eur').val(addon.options[RATE_EUR_PROP]);
        $('#enable-iframes').prop('checked', addon.options[CONVERT_IFRAMES_PROP]);
        $('#enable-conversion-hotkey').prop('checked', addon.options[HOTKEY_ENABLED_PROP]);
        $('.shift .hotkey-modifier').prop('checked', addon.options[HOTKEY_MODIFIERS_PROP] & 4);
        $('.accel .hotkey-modifier').prop('checked', addon.options[HOTKEY_MODIFIERS_PROP] & 2);
        $('.alt .hotkey-modifier').prop('checked', addon.options[HOTKEY_MODIFIERS_PROP] & 1);
        $('#hotkey-key').val(addon.options[HOTKEY_KEY_PROP]);
        $('#regexp-str').val(addon.options[REGEXP_STR_PROP]);
        $('#regexp-flags').val(addon.options[REGEXP_FLAGS_PROP]);
        $('#selector').val(addon.options[SELECTOR_PROP]);
    }

    function sendChangeState(eventType, eventData) {
        addon.port.emit('change-state-event', {"type" : eventType, "data" : eventData});
    }

    /// TODO: REFACTOR
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
        this.value = this.value.replace(/[а-яё]/i, "").toUpperCase();
        changeEnableHotkeyState(this, false);
    });

    jqHotkeyModifier.on('change', function() {
        changeEnableHotkeyState(this, false);
    });

    jqEnableHotkey.on('change', function() {
        if (this.checked && !isEnableHotkeyCanBeChecked(this)) {
            $(this).prop('checked', false); // does it changes this.checked immediately?
        }

        sendChangeState(ENABLE_HOTKEY_EVENT, getEnableHotkeyEventData(this.checked)); // TODO: it sends modifiers and key even if we just disable the checkbox, so it's quite inefficient
    });

    /**
     * Checks whether passed enable hotkey checkbox can be checked
     * (it depends on corresponding modifiers and input for key)
     */
    function isEnableHotkeyCanBeChecked(enableHotkeyCheckbox) {
        var jqFieldset = $(enableHotkeyCheckbox).parent().parent();
        return jqFieldset.find('.hotkey-modifier:checked').size() > 0 && /* at least one modifier should be checked */
            jqFieldset.find('.key').val().length == 1; // the input for key shouldn't be empty
    }

    /**
     * Changes the state of the enable hotkey checkbox which is in respect with hotkeyComponent
     */
    function changeEnableHotkeyState(hotkeyComponent, checked) {
        $(hotkeyComponent).parent().parent().find('.enable-hotkey').prop('checked', checked);
        sendChangeState(ENABLE_HOTKEY_EVENT, getEnableHotkeyEventData(checked));
    }

    function getEnableHotkeyEventData(checked) {
        return {
            'enabled' : checked,
            'modifiers' : getHotkeyModifiers(),
            'key' : $('#hotkey-key').val()
        }
    }

    function getHotkeyModifiers() {
        return (jqHotkeyModifier.filter('.shift').prop('checked') ? 4 : 0) +
               (jqHotkeyModifier.filter('.accel').prop('checked') ? 2 : 0) +
               (jqHotkeyModifier.filter('.alt').prop('checked') ? 1 : 0);
    }

    /**
     * The key code is allowed if it has one of the following values:
     * [65-90], [97-122]
     */
    function isAllowedKeyCode(code) {
        return !((code > 90 && code < 97) ||
        (code < 65 || code > 122));
    }
});