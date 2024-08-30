chrome.webRequest.onCompleted.addListener(
    chrome.runtime.sendMessage,
    {
        urls: [
            '<all_urls>'
        ],
        types: [
            'image',
            'font',
            'media',
            'object',
        ]
    },
    []
);

/* example detail object:
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
    */
