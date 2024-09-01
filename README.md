# ResMon Panel

## Installing
* Download as zip
* Unpack
* Enable dev mode
* Install unpacked extension, use src folder

## What can it do
Grab all the links to media files, images, etc. on the page and show them to you in a panel

## Tasks

### Capturing Media
Media is captured from within the page by querying dom objects directly.

Also monitors network request via `chrome.webRequest` to find resources that don't get added directly to dom.

However there are limitations to monitoring web requests:
* chrome.webrequest fails to capture cached resources?
* It will not capture base64 encoded media or embeded media, e.g. `<svg>` outside of the dom


Organisation:

    [panel page] --------------------------- [one of many content pages]


    Shows in a panel in browser            
    when the tab is changed it             
    asks the content script of             
    the newly opened tab for any           
    media present so it can display        
    Captures net requests       
    Sends to content pages                 
    the service worker captures            
    something, then sends to               
    the content script to record                                  


                                             records web request messages
                                             queries for all tags - `<img>`
                                             `<video>` `<audio>` `<svg>`  
                                             also looks for any css inline
                                             with `background-image` or `font`
                                             if there are any changes, send 
                                             to the panel, if the panel is
                                             displaying the current tab
Example of a webrequest object:
```
{
    "documentId": "ED0776DA7154A36CE96373D597C47B91",
    "documentLifecycle": "active",
    "frameId": 0,
    "frameType": "outermost_frame",
    "fromCache": false,
    "initiator": "https://duckduckgo.com",
    "ip": "52.142.125.222",
    "method": "GET",
    "parentFrameId": -1,
    "requestId": "4301",
    "statusCode": 200,
    "statusLine": "HTTP/1.1 200",
    "tabId": 1049543549,
    "timeStamp": 1725045768080.728,
    "type": "image",
    "url": "https://external-content.duckduckgo.com/iu/...png"
}
```

### Display
A better display system is needed.

* [x] Filtering by current tab
* [ ] Search
* [ ] Separation of different media types
* [ ] Previews, or at least better display than just a long url, for
    * [x] Images
    * [ ] Sounds
    * [ ] Videos?
    * [ ] Fonts?
    * [ ] Objects?

### Download and access
Options to acces the media files more easily:

* [ ] Click to view in a new tab
* [x] One-click download
* [ ] Download all

### Misc
- [ ] Add some test cases
- [ ] Screenshots
- [ ] Webstore link?
