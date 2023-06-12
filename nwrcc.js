function injectAutoCookie() {

var VERSION = "2.052";
var REVISION = "0.56";
var DEVBUILD = "pre-alpha";

var AutoCookie = undefined;
var Game = window.Game;

// Helper functions
var MenuWrapper = {}

MenuWrapper.getMenuReference = function(classAttr, title) {
    var menu = document.getElementById("menu");
    var list = menu.getElementsByClassName(classAttr);
    for(var i = 0; i < list.length; i++) {
        var element = list[i].querySelector(".title");
        if(element.textContent === title) return list[i];
    }
}

MenuWrapper.createElement = function(elem, parent, classAttr = "" , style = "", text = "", ref = "") {
    var element = document.createElement(elem);
    if(classAttr != "") element.setAttribute("class", classAttr);
    if(style != "") element.setAttribute("style", style);
    if(text != "") element.textContent = text;
    if(ref.nextSibling == undefined) {
        parent.appendChild(element);
    } else {
        parent.insertBefore(element, ref.nextSibling);
    }
    return element;
}


// Hooks
function ACMenu() {
    AutoCookie.oldUpdateMenu();
    if(Game.onMenu == "stats") {
        var reference = MenuWrapper.getMenuReference("subsection", "General");
        var subsection = MenuWrapper.createElement("div", reference.parentNode, "subsection", "", "", reference);
        MenuWrapper.createElement("div", subsection, "title", "position:relative;", "AutoCookie");
        {
            var element = MenuWrapper.createElement("div", "listing", "", " ${AutoCookie.version}");
            MenuWrapper.createElement("b", "", "", "Version:");
        }
    } else if(Game.onMenu = "prefs") {
        var reference = getMenuReference("block", "Mods");

        var block = document.createElement("div");
        {
            block.setAttribute("class", "block");
            block.setAttribute("style", "padding:0px;margin:8px 4px;");

            var subsection = document.createElement("div");
            subsection.setAttribute("class", "subsection");
            subsection.setAttribute("style", "padding:0px;");
            block.appendChild(subsection);

            var title = document.createElement("div");
            title.setAttribute("class", "title");
            title.setAttribute("style", "position:relative;");
            title.textContent = "AutoCookie";
            subsection.appendChild(title);

            var listing = document.createElement("div");
            listing.setAttribute("class", "listing");
            subsection.appendChild(listing);

            var test = document.createElement("a");
            {
                test.setAttribute("class", "smallFancyButton prefButton option");
                test.setAttribute("id", "testButton");
                test.setAttribute("onclick", 'Game.Notify("*click*", "You pressed the button!", [9,0]);');
                test.textContent = "Click for a notification";
                listing.appendChild(test);

                var label = document.createElement("label");
                label.textContent = "Click to recieve a notification.";
                listing.appendChild(label);
                listing.appendChild(document.createElement("br"));
            }
        }

        if(reference.nextSibling == undefined) {
            reference.parentNode.appendChild(block);
        } else {
            reference.parentNode.insertBefore(block, reference.nextSibling);
        }
    }
}


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
            var preset = "the version mismatch warning has been previously disabled in user settings";
            if(localStorage) ignoreMismatchFor = localStorage.getItem("nwrAutoCookie_IgnoreMismatchForVersion");
            if(ignoreMismatchFor !== Game.version + '|' + VERSION + '|' + REVISION) {
                var dialog = confirm('AutoCookie ' + version + ' was created for Cookie Clicker ' + version +
                                     '. \nInjecting AutoCookie may have unforeseen consequences... \n\nProceed anyways?');
                if(!dialog) return;
                preset = "this warning cannot be disabled as of yet.";
                Game.prefs.nwrAutoCookie_IgnoreMismatchForVersion = false;
            } else Game.prefs.nwrAutoCookie_IgnoreMismatchForVersion = true;
            Game.Notify('Injecting AutoCookie... ' + preset, '', [19, 1]);
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
        AutoCookie.oldUpdateMenu = Game.UpdateMenu;
        Game.UpdateMenu = ACMenu;

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