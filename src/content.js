(function contentScript(){
"use strict";

const CACHED_IMGS = [];

/**
 * Check that a url is fully qualified to the current page
 * if it is relative, turn it into a full url
 * @param {string} url to check
 * @returns {string} a full URL
 */
function qualifyURL(url){
    if(url.indexOf('http')===0 || url.indexOf('data')===0){
        return url;
    }
    // TODO fix the url

    // if the url is not a url, e.g. if it is a meta content
    // url that happens to contain the string png which is
    // not a url, then just return '', and the panel will
    // filter this out and not display it
    // TODO implement this ^ and make sure that passing ''
    // doesnt' send it into any unpleasant loops or cause
    // inefficiency

    // If the url is from a style, itmay include something like
    // url('') and this needs to be trimmed off, before passing
    // the result back through the qualifyURL function. make
    // sure not to end in a recursive loop,

    // if it is a relativepath, parse this and turn it into a URL
}

/**
 * Get all the images on the current page
 * @returns Array of image details {src: string}
 */
function getImages(){ //links may be relative, make sure the sources are fully qualified
    // TODO properly handle img srcset and picture tags
    const imgels = document.getElementsByTagName('img');
    const images = Array.from(imgels).map(img => { return {src: qualifyURL(img.src)}; });
    const svgels = document.getElementsByTagName('svg');
    const vectors = Array.from(svgels).map(svg => { return {src: svg.outerHTML}; });
    // svgs may have extra style info coming from the page,
    // but trying to capture all of that
    // seems like going too far out of scope.
    const META_RE = /png|jpeg|jpg|gif|ico|svg|webp|avif|^data:image/g;
    // don't do a long querySelector as that would be inefficient.
    // get all the meta tags from head and then filter manually,
    // there will not be that many of them compared to searching whole page
    const metaels = Array.from(document.getElementsByTagName('meta')).filter(meta => META_RE.test(meta.content));
    const metas = Array.from(metaels).map(meta => { return {src: qualifyURL(meta.content)}; });
    const linkels = Array.from(document.getElementsByTagName('link')).filter(link => link.rel.indexOf('icon')>=0);
    const links = Array.from(linkels).map(link => { return {src: qualifyURL(link.href)}; });
    const styledels = document.querySelectorAll('[style*=background-image]');
    const styleds = Array.from(styledels).map(styled => { return {src: qualifyURL(styled.style.backgroundImage)}; });
    return images.concat(vectors, metas, links, styleds, CACHED_IMGS);
    // TODO add caching so if switch tab I don't need to constantly re-query all of this, which will likely be slow on some pages
}

/**
 * Send message with media details
 * @param images array to send
 * @param media array to send (audio, video)
 * @param fonts array to send
 * @param other array to send
 */
function sendMedia(images, media, fonts, other){
    chrome.runtime.sendMessage({
        images: images,
        media: media,
        fonts: fonts,
        other: other
    });
}

/**
 * Get list of link details and send it
 */
function getAllMedia(){
    sendMedia(getImages(), [], [], []);
}

/**
 * Remember theimage loaded through a webrequest
 * @param {webRequest} requestDetails
 */
function newWebRequest(requestDetails){
    console.log('got a new wr image');
    CACHED_IMGS.push({src: requestDetails.url});
}

/**
 * Receieve a message - will probably be a request to get media, or a message that a new net request from js was made
 * @param message
 * @param sender
 * @param callback
 */
function onMessage(message, sender, callback){
    if(message.panelWantsMedia){
        getAllMedia();
    }
    if(message.request){
        newWebRequest(message.request);
    }
}

chrome.runtime.onMessage.addListener(onMessage);

})();
