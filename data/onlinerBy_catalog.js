console.log("[ONLINER] Entered the script");

$(function() {
    var CHANGE_CURRENCY_EVENT = "change.currency.event";
    var CHANGE_RATE_EVENT = "change.rate.event";
    var CHANGE_SELECTOR_EVENT = "change.selector.event";
    var CHANGE_REGEXP_EVENT = "change.regexp.event";

    var RATE_PROP = "rate";
    var CURRENCY_PROP = "currency";
    var REGEXP_STR_PROP = "regexp.str";
    var REGEXP_FLAGS_PROP = "regexp.flags";
    var SELECTOR_PROP = "selector";

    var sourceHtmlAttr = 'source-html';
    var generalSelector = self.options[SELECTOR_PROP];
    var generalRegExp = new RegExp(self.options[REGEXP_STR_PROP], self.options[REGEXP_FLAGS_PROP]);
    var rate = self.options[RATE_PROP];
    var currency = self.options[CURRENCY_PROP];

    convertPricesHTML(generalRegExp, generalSelector, rate, currency);

    self.port.on('change-state-event', function (event) {
        console.log("[ONLINER] Received new-data message: " + JSON.stringify(event));

        switch (event.type) {
            case CHANGE_CURRENCY_EVENT:
                currency = event.data.currency;
                rate = event.data.rate;
                break;

            case CHANGE_RATE_EVENT:
                rate = event.data;
                break;

            case CHANGE_SELECTOR_EVENT:
                restoreSourcePricesHTML(generalSelector);
                generalSelector = event.data;
                convertPricesHTML(generalRegExp, generalSelector, rate, currency);
                return; // TODO: be aware about return operator!

            case CHANGE_REGEXP_EVENT:
                generalRegExp = new RegExp(event.data.str, event.data.flags);
                break;
        }

        restoreSourcePricesHTML(generalSelector);
        convertPricesHTML(generalRegExp, generalSelector, rate, currency);
    });

    self.port.on('detach-custom', function () {
        restoreSourcePricesHTML(generalSelector);
    });

    function convertPricesHTML(regExp, selector, rate, currency) {
        $(selector).each(function () {
            var jqThis = $(this);
            var sourceHtml = jqThis.html();

            jqThis.data(sourceHtmlAttr, sourceHtml);
            $(this).html(convertPriceString(regExp, sourceHtml, rate, currency));
        });
    }

    function restoreSourcePricesHTML(selector) {
        $(selector).each(function () {
            var jqThis = $(this);
            jqThis.html(jqThis.data(sourceHtmlAttr));
        });
    }
});