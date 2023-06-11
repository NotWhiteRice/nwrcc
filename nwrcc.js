function injectAutoCookie() {

var VERSION = "2.052";
var REVISION = "0";
var DEVBUILD = "pre-alpha";

var AutoCookie = undefined;
var Game = window.Game;

var init = function() {
    try {
        var version = 'v' + VERSION + '.' + REVISION + '-' + DEVBUILD;
        if(window.nwrAutoCookie != undefined && window.nwrAutoCookie.ready) {
            Game.Notify("AutoCookie has already been injected...", window.nwrAutoCookie.version, [32, 0]);
            return;
        }

        // Handling version mismatch
        var mismatch = false;
        var ignoreMismatchFor = null;
        if(Game.version != VERSION) {
            mismatch = true;
            if(localStorage) ignoreMismatchFor = localStorage.getItem("nwrAutoCookie_IgnoreMismatchForVersion");
            if(ignoreMismatchFor !== Game.version + '|' + VERSION + '|' + REVISION) {
                var dialog = confirm('AutoCookie ' + version + ' was created for Cookie Clicker ' + version +
                                     '. \nInjecting AutoCookie may have unforeseen consequences... \n\nProceed anyways?');
                if(!dialog) return;
                Game.Notify('Injecting AutoCookie... this warning cannot be toggled as of yet', '', [19, 1]);
                Game.prefs.nwrAutoCookie_IgnoreMismatchForVersion = false;
            } else Game.prefs.nwrAutoCookie_IgnoreMismatchForVersion = true;
        } else if(localStorage) {
            Game.prefs.nwrAutoCookie_IgnoreMismatchForVersion = false;
            if(localStorage) localStorage.removeItem('nwrAutoCookie_IgnoreMismatchForVersion');
        }

        // Creating AutoCookie
        if(window.nwrAutoCookie === undefined) {
            AutoCookie = {};
            window.nwrAutoCookie = AutoCookie;
        } else {
            if(window.nwrAutoCookie.preloadHooks) {
                var instance = {ccVersion: VERSION, revision: REVISION, devBuild: DEVBUILD, version: version};
                for(var hook in window.nwrAutoCookie) {
                    if(!hook(instance)) {
                        Game.Notify('AutoCookie was unable to be injected due to the presense of another mod', '', [19, 0]);
                        return;
                    }
                }
            }

            AutoCookie = window.nwrAutoCookie;
        }

        // Settings
        AutoCookie.ready = true;
        AutoCookie.ccVersion = VERSION;
        AutoCookie.revision = REVISION;
        AutoCookie.devBuild = DEVBUILD;
        AutoCookie.version = version;
        AutoCookie.foundMismatch = mismatch;

        // Creating instance
        // Installing AutoCookie

        // Calling postload hooks
        if(AutoCookie.postloadHooks) {
            for(var i = 0; i < AutoCookie.postloadHooks.length; i++) {
                (AutoCookie.postloadHooks[i])(AutoCookie);
            }
        }

        var msg = 'AutoCookie ' + version + ' has successfully been injected.';
        if(Game.prefs.popups) {
            Game.Popup(msg);
        } else {
            Game.Notify(msg, '', [19, 2]);
        }
        Game.Win('Third-party');
    } catch(e) {
        Game.Notify('Unable to inject AutoCookie...', 'This will eventually show the error that had occured', [12, 27]);
        throw e;
    }
}

// LoadScriptHook
// genInstance

init();
};