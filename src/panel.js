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

async function addImages(images){
    const [oldsection] = document.getElementsByTagName('section');
    if(oldsection){
        document.body.removeChild(oldsection)
    }
    const section = document.createElement('section');
    const added = [];
    for (let i = 0; i < images.length; i++) {
        try {
            const thisimg = images[i];
            const imghash = await digestMessage(thisimg.src);
            let newimg;
            if(added.indexOf(imghash) >= 0){
                continue;
            }
            if(thisimg.src.indexOf('<svg')===0){
                const tmp = document.createElement('div');
                tmp.innerHTML = thisimg.src;
                newimg = tmp.firstChild;
            } else {
                newimg = document.createElement('img');
                newimg.src = thisimg.src;
            }
            newimg.id = imghash;
            section.appendChild(newimg);
            added.push(imghash);
        } catch (e) {
            console.warn(e);
            // there was an error adding this one image,
            // fail silently, but keep adding the others
        }
    }
    document.body.appendChild(section);
    document.querySelector('#btn-img span').innerText = added.length
}

function logRequest(details){
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

function onMessage(message){
    if(document.hidden){
        return;
    }
    if(message.images){
        // TODO handle this new set of page resources
        addImages(message.images);
        // TODO efficiency - add all to shadow el then add at once
        // TODO duplicate handling?
        // TODO split up resource types
    }

    if(message.request){
        // logRequest(message.request);
    }
}

function onTabChange(tab){
    if(document.hidden){
        return;
    }
    chrome.tabs.sendMessage(tab.tabId, {panelWantsMedia:true})
    .catch(error => {
        // The tab that was opened does not have an active content script, the tab needs to be refreshed
        // or it is stuck somehow, e.g. slow js from page, in which case the next run should work fine.
    });
}

function onWebRequestComplete(requestDetail){
    if(document.hidden){
        return;
    }
    chrome.tabs.sendMessage(requestDetail.tabId, {request: requestDetail})
    .catch(error => {
        // The tab that was opened does not have an active content script, the tab needs to be refreshed
        // or it is stuck somehow, e.g. slow js from page, in which case the next run should work fine.
    });
}

/**
 * click handler to allow instant download
 * @param {mouseevent} e
 */
function onClick(e){
    if(e.ctrlKey){
        chrome.downloads.download({
            url: e.target.src,
            saveAs: false
        })
    }
}

const WR_FILTER = {
    urls: [
        '<all_urls>'
    ],
    types: [
        'image',
        'font',
        'media',
        'object',
    ]
}

// chrome.webRequest.onCompleted.addListener(onWebRequestComplete, WR_FILTER, []); // TODO disabled for now
chrome.runtime.onMessage.addListener(onMessage);
chrome.tabs.onActivated.addListener(onTabChange);
document.addEventListener("click", onClick);

document.title = chrome.i18n.getMessage("name");
document.getElementById('filter').innerText = chrome.i18n.getMessage("filter");
document.getElementById('btn-img').firstChild.innerText = chrome.i18n.getMessage("img");
document.getElementById('btn-media').firstChild.innerText = chrome.i18n.getMessage("media");
document.getElementById('btn-font').firstChild.innerText = chrome.i18n.getMessage("font");
document.getElementById('btn-other').firstChild.innerText = chrome.i18n.getMessage("other");
