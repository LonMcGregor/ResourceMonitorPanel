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
    if(url.indexOf('http://')===0 || url.indexOf('https://')===0 || url.indexOf('data:')===0){ // regular url
        return url;
    }
    if(url.indexOf('url(')===0){ // css style url
        let theurl = /url\(['"]?([^'"]+)['"]?\)/.exec(url)[1];
        return qualifyURL(theurl);
    }
    if(url.indexOf('//')===0){ // URL relative to network protocol
        return window.location.protocol + url;
    }
    if(url.indexOf('/')===0){ // URL relative to domain
        return window.location.origin + url;
    }

    // URL relative to current directory
    return window.location.href.split('/').slice(0,-1).join('/') + '/' + url;

    // if the url is not a url, e.g. if it is a meta content
    // url that happens to contain the string png which is
    // not a url, then just return '', and the panel will
    // filter this out and not display it
    // TODO implement this ^ and make sure that passing ''
    // doesnt' send it into any unpleasant loops or cause
    // inefficiency
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
    const metaels = Array.from(document.getElementsByTagName('meta')).filter(meta => META_RE.test(meta.content.toLowerCase()));
    const metas = Array.from(metaels).map(meta => { return {src: qualifyURL(meta.content)}; });
    const linkels = Array.from(document.getElementsByTagName('link')).filter(link => link.rel.indexOf('icon')>=0);
    const links = Array.from(linkels).map(link => { return {src: qualifyURL(link.href)}; });
    const styledels = document.querySelectorAll('[style*=background-image]');
    const styleds = Array.from(styledels).map(styled => { return {src: qualifyURL(styled.style.backgroundImage)}; });
    const styledels2 = document.querySelectorAll('[style*=background]');
    const styleds2 = Array.from(styledels2).filter(el => META_RE.test(el.style.background.toLowerCase())).map(styled => { return {src: qualifyURL(styled.style.background)}; });
    return images.concat(vectors, metas, links, styleds, styleds2, CACHED_IMGS);
    // TODO add caching so if switch tab I don't need to constantly re-query all of this, which will likely be slow on some pages
}

/**
 * Get all the streamable media on a page, audio videos
 * @returns Array of media details {src:string, type:mime string | 'unknown'}
 */
function getMedia(){
    // Often streaming sites may have a media tag, but no src, instead loading from a stream
    // filter those missing an src
    // TODO handle blob: urls
    const audioels = document.getElementsByTagName('audio');
    const audios = Array.from(audioels).filter(audio => audio.src).map(audio => { return {src: qualifyURL(audio.src), type:'audio/'}; })
    const videoels = document.getElementsByTagName('video');
    const videos = Array.from(videoels).filter(vid => vid.src).map(vid => { return {src: qualifyURL(vid.src), type: 'video/'}; });
    const trackels = document.getElementsByTagName('track');
    const tracks = Array.from(trackels).map(track => { return {src: qualifyURL(track.src), type:'text/'}; });
    const sourceels = document.getElementsByTagName('source');
    const sources = Array.from(sourceels).map(source => { return {src: qualifyURL(source.src), type: source.type}; });
    return audios.concat(videos, tracks, sources);
}

let LISTOFFONTS = [];
document.fonts.ready.then((fontFaceSet) => {
    // fires after all fonts loaded
    LISTOFFONTS = [...fontFaceSet];
});

/**
 * Get all fonts loaded into a page
 * This needs to be done using a listener on document fonts ready, and can then be queried after
 * @returns Array of FontFace {... family:string, variant:string}
 */
function getFonts(){
    return LISTOFFONTS; // TODO this method doesn't return a source url, just the name of the loaded font
}

/**
 * Get all other application embeds on a page
 * @returns Array of media details {src:string, type:mime string | 'unknown'}
 */
function getOther(){
    const embedels = document.getElementsByTagName('embed');
    const embeds = Array.from(embedels).map(embed => { return {src: qualifyURL(embed.src), type: embed.type}; })
    const objectels = document.getElementsByTagName('object');
    const objects = Array.from(objectels).map(object => { return {src: qualifyURL(object.data), type: object.type}; })
    // TODOhandle <canvas>
    return embeds.concat(objects);
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
    sendMedia(getImages(), getMedia(), getFonts(), getOther());
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
