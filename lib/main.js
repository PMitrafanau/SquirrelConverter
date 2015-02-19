var data = require('sdk/self').data;
var buttons = require('sdk/ui/button/toggle');
var panels = require('sdk/panel');
var pageMods = require('sdk/page-mod');
var ss = require('sdk/simple-storage');
var hotkeys = require('sdk/hotkeys');

var ENABLE_CONVERSION_EVENT = "enable.event";
var CHANGE_CURRENCY_EVENT = "change.currency.event";
var CHANGE_RATE_USD_EVENT = "change.rate.usd.event";
var CHANGE_RATE_EUR_EVENT = "change.rate.eur.event";
var ENABLE_IFRAMES_CONVERSION_EVENT = "iframes.enable.event";
var CHANGE_RATE_EVENT = "change.rate.event";
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

var currency = { usd : "USD", eur : "EUR" };
var changeStateEventHandlers = getChangeStateEventHandlers();

var iconSet = {'16': data.url('icon-16.png'), '32': data.url('icon-32.png')};
var iconTurnedSet = {'16': data.url('icon-16-on.png'), '32': data.url('icon-32-on.png')};

initDefaultOptions();

var turnedOn = ss.storage[ENABLED_PROP] || false;
var pageMod = null;
var pageModOptions = null;
var workers = [];

var mainButton = initMainButton();
var menu = initMenu();
var hotkey = initHotkey();

if (turnedOn) {
    pageMod = createNewPageMod();
}

function initMainButton() {
    var mainButton = buttons.ToggleButton({
        id: 'SqC-main-link',
        label: 'Convert squirrels',
        icon: turnedOn ? iconTurnedSet : iconSet,
        onChange: function(state) {
            if (state.checked) {
                menu.show();
            }
        }
    });

    return mainButton;
}

function initMenu() {
    var menu = panels.Panel({
        contentURL: data.url('menu.html'),
        contentScriptOptions: getMenuOptions(),
        position: mainButton,
        height: 400,
        onHide: function() {
            updateMainBtnIcon(false);
        }
    });

    menu.port.on('change-state-event', function(event) {
        changeStateEventHandlers[event.type](event.data);
    });

    return menu;
}

function initHotkey() {
    if (ss.storage[HOTKEY_ENABLED_PROP]) {
        return hotkeys.Hotkey({
            combo: getHotkeyCombo(),
            onPress: function() {
                changeStateEventHandlers[ENABLE_CONVERSION_EVENT](!turnedOn, true);
            }
        });
    } else {
        return null;
    }
}

function destroyHotkey() {
    if (hotkey != null) {
        hotkey.destroy();
        hotkey = null;
    }
}

function getHotkeyCombo() {
    console.log((ss.storage[HOTKEY_MODIFIERS_PROP] & 2 ? 'accel-' : '') +
    (ss.storage[HOTKEY_MODIFIERS_PROP] & 1 ? 'alt-' : '') +
    (ss.storage[HOTKEY_MODIFIERS_PROP] & 4 ? 'shift-' : '') + ss.storage[HOTKEY_KEY_PROP].toLowerCase());
    return (ss.storage[HOTKEY_MODIFIERS_PROP] & 2 ? 'accel-' : '') +
           (ss.storage[HOTKEY_MODIFIERS_PROP] & 1 ? 'alt-' : '') +
           (ss.storage[HOTKEY_MODIFIERS_PROP] & 4 ? 'shift-' : '') + ss.storage[HOTKEY_KEY_PROP].toLowerCase();
}

function createNewPageMod() {
    console.log("[ADDON] createNewPageMod()");

    pageModOptions = getPageModeOptions();
    var attachTargets = ["existing", "top"];

    if (ss.storage[CONVERT_IFRAMES_PROP]) {
        attachTargets.push("frame");
    }

    return pageMods.PageMod({
        include: '*.onliner.by',
        contentScriptFile: [data.url('jquery-1.11.2.min.js'), data.url('common.js'), data.url('onlinerBy_catalog.js')],
        contentStyleFile: data.url('common.css'),
        attachTo: attachTargets,
        contentScriptWhen: 'ready',
        contentScriptOptions: pageModOptions,
        onAttach: function(worker) {
            console.log('[ADDON] New worker attached');
            console.log('[ADDON] Existing workers: ' + workers);

            workers.push(worker);

            worker.on('detach', function () {
                console.log('[ADDON] Recieved detach from PageMod');

                detachWorker(this, workers);
            });
        }
    });
}

function destroyPageMod() {
    console.log("[ADDON] destroyPageMod()");

    for (var i = 0; i < workers.length; ++i) {
        workers[i].port.emit('detach-custom', {});
        workers[i].destroy(); // Sends 'detach' message to content scripts
    }

    pageMod.destroy(); // Doesn't send detach message to workers as well as to scripts
    pageMod = null;
    pageModOptions = null;
    workers = [];
}

function refreshPageMod(eventType, eventData) {
    console.log("[ADDON] refreshPageMod()");

    for (var i = 0; i < workers.length; ++i) {
        workers[i].port.emit('change-state-event', {'type': eventType, 'data': eventData});
    }
}

function detachWorker(worker, workerArray) {
    console.log("[ADDON] detachWorker()");

    var index = workerArray.indexOf(worker);

    if(index != -1) {
        workerArray.splice(index, 1);
    }
}

function getChangeStateEventHandlers() {
    var handlers = {};

    handlers[ENABLE_CONVERSION_EVENT] = function(enabled, uncheckMainBtn) {
        console.log("[ADDON] Received enable-conversion message: " + enabled);

        ss.storage[ENABLED_PROP] = enabled;
        turnedOn = enabled;
        updateMainBtnIcon(!uncheckMainBtn);

        if (enabled) {
            pageMod = createNewPageMod();
        } else if (pageMod) {
            destroyPageMod();
        }
    };

    handlers[CHANGE_CURRENCY_EVENT] = function(newCurrency) {
        console.log("[ADDON] Received change-currency message: " + newCurrency);

        ss.storage[CURRENCY_PROP] = newCurrency;
        var rate = newCurrency == currency.usd ? ss.storage[RATE_USD_PROP] : ss.storage[RATE_EUR_PROP];

        if (turnedOn) {
            refreshPageMod(CHANGE_CURRENCY_EVENT, {"currency" : newCurrency, "rate" : rate});
            pageModOptions.currency = newCurrency;
            pageModOptions.rate = rate;
        }
    };

    handlers[CHANGE_RATE_USD_EVENT] = function(rate) {
        console.log("[ADDON] Received change-rate-usd message");

        ss.storage[RATE_USD_PROP] = rate;

        if (turnedOn && ss.storage[CURRENCY_PROP] == currency.usd) {
            refreshPageMod(CHANGE_RATE_EVENT, rate);
            pageModOptions.rate = rate;
        }
    };

    handlers[CHANGE_RATE_EUR_EVENT] = function(rate) {
        console.log("[ADDON] Received change-rate-eur message");

        ss.storage[RATE_EUR_PROP] = rate;

        if (turnedOn && ss.storage[CURRENCY_PROP] == currency.eur) {
            refreshPageMod(CHANGE_RATE_EVENT, rate);
            pageModOptions.rate = rate;
        }
    };

    handlers[ENABLE_IFRAMES_CONVERSION_EVENT] = function(checked) {
        console.log("[ADDON] Recieved enable-iframes-conversion event" + checked);

        ss.storage[CONVERT_IFRAMES_PROP] = checked;

        if (turnedOn) {
            destroyPageMod();
            pageMod = createNewPageMod();
        }
    };

    handlers[CHANGE_REGEXP_EVENT] = function(regexpData) {
        console.log("[ADDON] Recieved change-regexp event: " + JSON.stringify(regexpData));

        ss.storage[REGEXP_STR_PROP] = regexpData.str;
        ss.storage[REGEXP_FLAGS_PROP] = regexpData.flags;

        if (turnedOn) {
            refreshPageMod(CHANGE_REGEXP_EVENT, regexpData);
            pageModOptions["regexp.str"] = regexpData.str;    // todo: hardcoded strings!
            pageModOptions["regexp.flags"] = regexpData.flags; // todo: hardcoded strings!
        }
    };

    handlers[CHANGE_SELECTOR_EVENT] = function(newSelector) {
        console.log("[ADDON] Recieved change-selector event: " + newSelector);

        ss.storage[SELECTOR_PROP] = newSelector;

        if (turnedOn) {
            refreshPageMod(CHANGE_SELECTOR_EVENT, newSelector);
            pageModOptions.selector = newSelector; // todo: change selector to [] with corresponding property
        }
    };

    handlers[ENABLE_HOTKEY_EVENT] = function(data) {
        console.log("[ADDON] Recieved enable-hotkey event: " + JSON.stringify(data));

        ss.storage[HOTKEY_ENABLED_PROP] = data.enabled;
        ss.storage[HOTKEY_MODIFIERS_PROP] = data.modifiers;
        ss.storage[HOTKEY_KEY_PROP] = data.key;

        if (data.enabled) {
            hotkey = initHotkey();
        } else {
            destroyHotkey();
        }
    };

    return handlers;
}

function initDefaultOptions() {
    console.log('[ADDON] initDefaultOptions() ss.storage: ' + JSON.stringify(ss.storage));

    if (ss.storage[REGEXP_STR_DEFAULT_PROP] == undefined) {
        ss.storage[REGEXP_STR_DEFAULT_PROP] = "(\\d(?:\\d|\\s|&nbsp;|\\.)*)(?:\\s|&nbsp;)*(?:<\\/\\w*>)?(тыс|тысяч|млн|миллион|млрд|миллиард)?(?:\\s|&nbsp;)*((?:(?:<\\w*>)?(?:\\s|&nbsp;)*руб\\.?)|-|–)";
    }

    if (ss.storage[REGEXP_FLAGS_DEFAULT_PROP] == undefined) {
        ss.storage[REGEXP_FLAGS_DEFAULT_PROP] = "gim";
    }

    if (ss.storage[SELECTOR_DEFAULT_PROP] == undefined) {
        ss.storage[SELECTOR_DEFAULT_PROP] = ".pprice_byr,.pprice,.price,.cost,.b-seller-block-1__sellers>ul>li>a,tr.pline2:last>td:not(.pdinfohead),.b-offers-desc__info-price,sup,.b-offers-desc__info-price a";
    }

    if (ss.storage[ENABLED_PROP] == undefined) {
        ss.storage[ENABLED_PROP] = false;
    }

    if (ss.storage[RATE_USD_PROP] == undefined) {
        ss.storage[RATE_USD_PROP] = 15000;
    }

    if (ss.storage[RATE_EUR_PROP] == undefined) {
        ss.storage[RATE_EUR_PROP] = 15000;
    }

    if (ss.storage[CURRENCY_PROP] == undefined) {
        ss.storage[CURRENCY_PROP] = currency.usd;
    }

    if (ss.storage[REGEXP_STR_PROP] == undefined) {
        ss.storage[REGEXP_STR_PROP] = ss.storage[REGEXP_STR_DEFAULT_PROP];
    }

    if (ss.storage[REGEXP_FLAGS_PROP] == undefined) {
        ss.storage[REGEXP_FLAGS_PROP] = ss.storage[REGEXP_FLAGS_DEFAULT_PROP];
    }

    if (ss.storage[SELECTOR_PROP] == undefined) {
        ss.storage[SELECTOR_PROP] = ss.storage[SELECTOR_DEFAULT_PROP];
    }

    if (ss.storage[CONVERT_IFRAMES_PROP] == undefined) {
        ss.storage[CONVERT_IFRAMES_PROP] = false;
    }

    if (ss.storage[HOTKEY_ENABLED_PROP] == undefined) {
        ss.storage[HOTKEY_ENABLED_PROP] = false;
    }

    if (ss.storage[HOTKEY_MODIFIERS_PROP] == undefined) {
        ss.storage[HOTKEY_MODIFIERS_PROP] = 0; // 000 in binary representation carrying the following sense: shift-false, accel-false, alt-false
    }

    if (ss.storage[HOTKEY_KEY_PROP] == undefined) {
        ss.storage[HOTKEY_KEY_PROP] = "";
    }
}

function getPageModeOptions() {
    return {
        "rate" : getRateForCurrentCurrency(),
        "currency" : ss.storage[CURRENCY_PROP],
        "regexp.str" : ss.storage[REGEXP_STR_PROP],
        "regexp.flags" : ss.storage[REGEXP_FLAGS_PROP],
        "selector" : ss.storage[SELECTOR_PROP]
    };
}

function getMenuOptions() {
    return {
        "enabled" : ss.storage[ENABLED_PROP],
        "rate.usd" : ss.storage[RATE_USD_PROP],
        "rate.eur" : ss.storage[RATE_EUR_PROP],
        "currency" : ss.storage[CURRENCY_PROP],
        "regexp.str" : ss.storage[REGEXP_STR_PROP],
        "regexp.str.default" : ss.storage[REGEXP_STR_DEFAULT_PROP],
        "regexp.flags" : ss.storage[REGEXP_FLAGS_PROP],
        "regexp.flags.default" : ss.storage[REGEXP_FLAGS_DEFAULT_PROP],
        "selector" : ss.storage[SELECTOR_PROP],
        "selector.default" : ss.storage[SELECTOR_DEFAULT_PROP],
        "convert_iframes" : ss.storage[CONVERT_IFRAMES_PROP],
        "hotkey.enabled": ss.storage[HOTKEY_ENABLED_PROP],
        "hotkey.modifiers" : ss.storage[HOTKEY_MODIFIERS_PROP],
        "hotkey.key" : ss.storage[HOTKEY_KEY_PROP]
    };
}

function updateMainBtnIcon(checked) {
    mainButton.state('window', {
        icon: turnedOn ? iconTurnedSet : iconSet,
        checked: checked
    });
}

function getRateForCurrentCurrency() {
    var rateProp = ss.storage[CURRENCY_PROP] == currency.usd ? RATE_USD_PROP : RATE_EUR_PROP;
    return ss.storage[rateProp];
}