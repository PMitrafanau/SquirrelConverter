var priceDelimeter = "-";

var redundantSymbolsRegExp = /(\s|\&nbsp;|\.)/gm;

var curRate;
var curCurrency;

function convertPriceString(generalRegExp, priceStr, rate, currency) {
    curRate = rate;
    curCurrency = currency;

    return priceStr.replace(generalRegExp, convertMatch);
}

function convertMatch(match, group1, group2, group3) {
    var priceStr = group1.trim().replace(redundantSymbolsRegExp, "");

    if (group2 != null) {
        priceStr += getZerosEquivalentForSuffix(group2);
    }

    return Math.ceil(convertSquirrels(priceStr, curRate)) +
        ((group3 == '-' || group3 == '–') ? ' ' + group3 + ' ' : ' ' + curCurrency);
}

function getZerosEquivalentForSuffix(suffix) {
    switch (suffix) {
        case "тыс":
        case "тысяч":
            return "000";

        case "млн":
        case "миллион":
            return "000000";

        case "млрд":
        case "миллиард":
            return "000000000";
    }
}

function convertSquirrels(squirrelsStr, rate) {
    var num = parseFloat(squirrelsStr);
    return num / rate;
}