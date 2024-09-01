# ResMon Panel

## Installing
From the (TODO)

## What can it do
Grab all the links to media files, images, etc. on the page and show them to you in a panel

## Tasks

### Capturing Media
Media is captured from within the page by querying dom objects directly.
Also should monitor network request to find resources that don't get added directly to dom.

However there are limitations to monitoring web requests:
* chrome.webrequest fails to capture cached resources?
* It will not capture base64 encoded media or embeded media, e.g. `<svg>` outside of the dom


Organisation:
 [panel page] ---------------------- [one of many content pages]
Shows in a panel in browser             records web request messages
when the tab is changed it              queries for all tags - `<img>`
asks the content script of              `<video>` `<audio>` `<svg>`  
the newly opened tab for any            also looks for any css inline
media present so it can display         with `background-image` or `font`
Captures net requests       
Sends to content pages                  if there are any changes, send 
the service worker captures             to the panel, if the panel is
something, then sends to                displaying the current tab
the content script to record                                  

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
