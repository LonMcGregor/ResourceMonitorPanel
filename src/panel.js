"use strict";

const EXTAB = chrome.runtime.getURL("");

const CURRENT = {
    IMAGES: [],
    MEDIA: [],
    FONTS: [],
    OTHER: []
};

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

async function dedupAndRecordResources(resources, storekey, labelid){
    const addedhashes = [];
    const added = [];
    for (let i = 0; i < resources.length; i++) {
        try {
            const thisres = resources[i];
            const thishash = await digestMessage(thisres.src);
            if(addedhashes.indexOf(thishash) < 0){
                addedhashes.push(thishash);
                added.push(thisres);
            }
        } catch (e) {
            console.warn(e);
            // there was an error deduping this one resource,
            // fail with a warn, but keep adding the others
        }
    }
    document.getElementById(labelid).innerText = added.length
    CURRENT[storekey] = added;
}

function renderImages(){
    const section = document.createElement('section');
    for (let i = 0; i < CURRENT.IMAGES.length; i++) {
        const thisimg = CURRENT.IMAGES[i];
        let newimg;
        try {
            if(thisimg.src.indexOf('<svg')===0){
                const tmp = document.createElement('div');
                tmp.innerHTML = thisimg.src;
                newimg = tmp.firstChild;
            } else {
                newimg = document.createElement('img');
                newimg.src = thisimg.src;
            }
            newimg.addEventListener('click',onClick);
            section.appendChild(newimg);
        } catch (e) {
            console.warn(e);
            // there was an error adding this one image,
            // fail silently, but keep adding the others
        }
    }
    const main = document.body.children[1];
    try{
        const oldimgs = document.getElementById('images');
        main.removeChild(oldimgs);
    } catch {} // try removing the old images, it will fail on first run because there are no images
    section.id = 'images';
    main.appendChild(section);
}

function renderMedia(){
    const section = document.createElement('section');
    for (let i = 0; i < CURRENT.MEDIA.length; i++) {
        const thismed = CURRENT.MEDIA[i];
        let newmed;
        try {
            switch (thismed.type) {
                case 'audio/':
                    newmed = document.createElement('audio');
                    newmed.src = thismed.src;
                    break;
                case 'video/':
                    newmed = document.createElement('video');
                    newmed.src = thismed.src;
                    break;
                default:
                    newmed = document.createElement('a');
                    newmed.href = thismed.src;
                    newmed.target = '_blank';
                    newmed.innerText = newmed.type + thismed.src.substr(7,64);
            }
            section.appendChild(newmed);
        } catch (e) {
            console.warn(e);
            // there was an error adding this one media,
            // fail silently, but keep adding the others
        }
    }
    const main = document.body.children[1];
    try{
        const oldmed = document.getElementById('media');
        main.removeChild(oldmed);
    } catch {} // try removing the old media, it will fail on first run because there are no images
    section.id = 'media';
    main.appendChild(section);
}

function renderFont(){
    const section = document.createElement('section');
    for (let i = 0; i < CURRENT.FONTS.length; i++) {
        const thismed = CURRENT.FONTS[i];
        let newmed;
        try {
            // TODO eventually, add a preview and URLs
            newmed = document.createElement('p');
            newmed.innerText = thismed['font-family'];
            section.appendChild(newmed);
        } catch (e) {
            console.warn(e);
            // there was an error adding this one media,
            // fail silently, but keep adding the others
        }
    }
    const main = document.body.children[1];
    try{
        const oldmed = document.getElementById('media');
        main.removeChild(oldmed);
    } catch {} // try removing the old media, it will fail on first run because there are no images
    section.id = 'media';
    main.appendChild(section);
}

function renderOther(){
    const section = document.createElement('section');
    for (let i = 0; i < CURRENT.OTHER.length; i++) {
        const thismed = CURRENT.OTHER[i];
        let newmed;
        try {
            newmed = document.createElement('a');
            newmed.a = thismed.src;
            newmed.target = '_blank';
            newmed.innerText = thismed.type + thismed.src.substr(7,64);
            section.appendChild(newmed);
        } catch (e) {
            console.warn(e);
            // there was an error adding this one media,
            // fail silently, but keep adding the others
        }
    }
    const main = document.body.children[1];
    try{
        const oldmed = document.getElementById('other');
        main.removeChild(oldmed);
    } catch {} // try removing the old media, it will fail on first run because there are no images
    section.id = 'other';
    main.appendChild(section);
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

async function onMessage(message){
    if(document.hidden){
        return;
    }

    if(message.images){
        await dedupAndRecordResources(message.images, "IMAGES", 'imgcount');
    }
    if(message.media){
        await dedupAndRecordResources(message.media, "MEDIA", 'mediacount');
    }
    if(message.fonts){
        await dedupAndRecordResources(message.fonts, "FONTS", 'fontcount');
    }
    if(message.other){
        await dedupAndRecordResources(message.other, "OTHER", 'othercount');
    }

    if(document.getElementById('btn-img').checked){
        renderImages();
    }
    if(document.getElementById('btn-media').checked){
        renderMedia();
    }
    if(document.getElementById('btn-font').checked){
        renderFont();
    }
    if(document.getElementById('btn-other').checked){
        renderOther();
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

function onVisiblityChange(){
    if(document.hidden){
        return;
    }
    chrome.tabs.query({active:true, lastFocusedWindow: true, windowType: "normal"})
    .then(tabs => {
        if(tabs[0]){
            chrome.tabs.sendMessage(tabs[0].id, {panelWantsMedia:true})
            .catch(error => {
                // The tab that was opened does not have an active content script, the tab needs to be refreshed
                // or it is stuck somehow, e.g. slow js from page, in which case the next run should work fine.
            });
        }
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

function onFilter(){
    // TODO make this more efficient and only add/remove the new filter
    if(document.getElementById('btn-img').checked){
        renderImages();
    }
    if(document.getElementById('btn-media').checked){
        renderMedia();
    }
    if(document.getElementById('btn-font').checked){
        renderFont();
    }
    if(document.getElementById('btn-other').checked){
        renderOther();
    }
}

// chrome.webRequest.onCompleted.addListener(onWebRequestComplete, WR_FILTER, []); // TODO disabled for now
chrome.runtime.onMessage.addListener(onMessage);
chrome.tabs.onActivated.addListener(onTabChange);
document.addEventListener('visibilitychange', onVisiblityChange);

document.title = chrome.i18n.getMessage("name");
document.getElementById('filter').innerText = chrome.i18n.getMessage("filter");
document.querySelector('#btn-img + div span').innerText = chrome.i18n.getMessage("img");
document.querySelector('#btn-media + div span').innerText = chrome.i18n.getMessage("media");
document.querySelector('#btn-font + div span').innerText = chrome.i18n.getMessage("font");
document.querySelector('#btn-other + div span').innerText = chrome.i18n.getMessage("other");

document.getElementById('btn-img').addEventListener('click', onFilter);
document.getElementById('btn-media').addEventListener('click', onFilter);
document.getElementById('btn-font').addEventListener('click', onFilter);
document.getElementById('btn-other').addEventListener('click', onFilter);

// now the panel is ready, set up for first use with current tab
onVisiblityChange();
