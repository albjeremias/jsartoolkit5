var artoolkit_wasm_url = 'artoolkit_wasm.wasm';

window = {};
window.listeners = {};
window.addEventListener = function (name, callback) {
    if (!window.listeners[name]) {
        window.listeners[name] = [];
    }
    window.listeners[name].push(callback);
};
window.removeEventListener = function (name, callback) {
    if (window.listeners[name]) {
        let index = window.listeners[name].indexOf(callback);
        if (index > -1) {
            window.listeners[name].splice(index, 1);
        }
    }
};
window.dispatchEvent = function (event) {
    let listeners = window.listeners[event.type];
    if (listeners) {
        for (let i = 0; i < listeners.length; i++) {
            listeners[i].call(window, event);
        }
    }
};

importScripts('../../../build/artoolkit_wasm.js');

self.onmessage = e => {
    let msg = e.data;
    switch (msg.type) {
        case "load": {
            load(msg);
            return;
        }
        case "process": {
            next = msg.imagedata;
            process();
            return;
        }
    }
};

let next = null;

let ar = null;
let markerResult = null;

function load(msg) {
    let param = new ARCameraParam('../../Data/camera_para-iPhone 5 rear 640x480 1.0m.dat');
    param.onload = function () {
        ar = new ARController(msg.pw, msg.ph, param);
        let cameraMatrix = ar.getCameraMatrix();

        ar.addEventListener('getNFTMarker', function (ev) {
            markerResult = {type: "found", matrixGL_RH: JSON.stringify(ev.data.matrixGL_RH), proj: JSON.stringify(cameraMatrix)};
        });

        ar.loadNFTMarker(msg.marker, function (markerId) {
            ar.trackNFTMarkerId(markerId, 2);
            console.log("loadNFTMarker -> ", markerId);
        });

        postMessage({type: "loaded", proj: JSON.stringify(cameraMatrix)});
    };
}

function process() {

    markerResult = null;

    if (ar) {
        ar.process(next);
    }

    if (markerResult) {
        postMessage(markerResult);
    } else {
        postMessage({type: "not found"});
    }

    next = null;
}

window.addEventListener('artoolkit-loaded', () => {
    console.log('artoolkit-loaded');
    Object.assign(self, window);
    postMessage({type: "wasm"});
});
