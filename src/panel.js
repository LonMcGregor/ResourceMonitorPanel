"use strict";

const EXTAB = chrome.runtime.getURL("");

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
async function digestMessage(message) {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
}

function makeElement(details, hash){
    // just show one preview per media file
    if(document.getElementById(hash)){
        return;
    }

    let el;
    switch (details.type) {
        case 'image':
            el = document.createElement('img');
            el.src = details.url;
            break;
        default:
            // note object-src is not permitted by CSP, so will need to just display the URL as a link
            el = document.createElement('a');
            el.href = details.url;
            el.innerText = details.url;
            break;
    }
    el.id = hash;
    document.body.appendChild(el);
}

function onMessage(details){
    // Don't listen to requests by this tab, get stuck in a loop
    if(EXTAB.indexOf(details.initator) === 0){
        return;
    }

    console.log(details);
    // TODO for debug

    // don't try to load anything that failed
    if(details.statusCode > 399){
        return;
    }

    digestMessage(details.url).then(hash => {makeElement(details, hash);});
}

chrome.runtime.onMessage.addListener(onMessage);
