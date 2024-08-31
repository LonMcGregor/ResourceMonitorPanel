# ResMon Panel

## Installing
From the (TODO)

## What can it do
Grab all the links to media files, images, etc. on the page and show them to you in a panel

## Tasks

### Capturing Media
The current method of monitoring network calls is not good enough, for a few reasons:
* chrome.webrequest fails to capture cached resources
* It will not capture base64 encoded media
* It will not catch embeded media, e.g. `<svg>`

The architecture needs to be re-worked somehow to load within each tab directly, a content script like linkspanel would be usefulfor capturing all resources currently on the page.
Then `chrome.webrequest` should still be used to capture additionally loaded materials, such as media items requested from a script that don't appear directly in the dom.

Organisation:
     ---------------------------------------------------------------------
     |                                                                   |
[serviceworker]               [panel page] ---------------------- [one of many content pages]
Serviceworker                  Shows in a panel in browser         records web request messages
Captures net requests          when the tab is changed it          queries for all tags - `<img>`
Sends to content pages         asks the content script of          `<video>` `<audio>` `<svg>`  
the service worker captures    the newly opened tab for any        also looks for any css inline
something, then sends to       media present so it can display     with `background-image` or `font`
the content script to record                                       if there are any changes, send 
                                                                   to the panel, if the panel is
                                                                   displaying the current tab

### Display
A better display system is needed.

* Filtering by current tab
* Search
* Separation of different media types
* Previews, or at least better display than just a long url, for
    * Images
    * Sounds
    * Videos?
    * Fonts?
    * Objects?

### Download and access
Options to acces the media files more easily:

* Click to view in a new tab
* One-click download
* Download all
