"use strict";

document.querySelector("#advert").innerHTML = chrome.i18n.getMessage("vivaldi") + "<br>" + chrome.runtime.getURL("panel.html");
