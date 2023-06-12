function injectAutoCookie() {

// Version settings
var VERSION = "2.052";
var REVISION = "0.66";
var DEVBUILD = "pre-alpha";

var AutoCookie = undefined;
var Game = window.Game;

// Helper functions
var MenuHelper = {
    getMenuReference(classAttr, title) {
        var menu = document.getElementById("menu");
        var list = menu.getElementsByClassName(classAttr);
        for(var i = 0; i < list.length; i++) {
            var element = list[i].querySelector(".title");
            if(element.textContent === title) return list[i];
        }
    },

    createElement(elem, parent, classAttr = "" , style = "", text = "", ref = "") {
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
    },

    createStatistic(parent, statistic, value) {
        var element = this.createElement("div", parent, "listing");
        this.createElement("b", parent, "", "", `${statistic}:`);
        element.append(` ${value}`);
    },

    createButton(parent, id, func, label, desc) {
        var button = this.createElement("a", parent, "smallFancyButton prefButton option", "", label);
        button.setAttribute("onclick", func);
        this.createElement("label", parent, "", "", desc);
        this.createElement("br", parent);
    },

    toggle(option, id, on, off, invert = 0, dim = true) {
        var button = document.getElementById(id);
        if(AutoCookie.user[option]) {
            button.innerHTML = off;
            AutoCookie.user[option] = 0;
        } else {
            button.innerHTML = on;
            AutoCookie.user[option] = 1;
        }
        if(dim) button.className = `smallFancyButton prefButton option${(AutoCookie.user[option] ^ invert) ? '' : ' off'}`;
    },

    createSection(parent, title, buttonID, option) {
        var elem0 = this.createElement("div", parent, "title", "padding:0px 16px;opacity:0.7;font-size:17px;font-family:Kavoon,Georgia,serif;", `${title} `);
        this.createButton(elem0, buttonID, `MenuHelper.toggle(${option}, ${buttonID}, "Hide", "Show", '0', false)`, "Hide", "");
        var section = this.createElement("div", "parent", "subsection");
        return section;
    },
}

// Hooks
function ACMenu() {
    AutoCookie.oldUpdateMenu();
    if(Game.onMenu == "stats") {
        var reference = MenuHelper.getMenuReference("subsection", "General");
        var subsection = MenuHelper.createElement("div", reference.parentNode, "subsection", "", "", reference);
        MenuHelper.createElement("div", subsection, "title", "position:relative;", "AutoCookie");
        MenuHelper.createStatistic(subsection, "Version", AutoCookie.version);
        var gcStats = MenuHelper.createSection(subsection, "Long-term Golden Cookie Probabilities", "nwrGCStatsButton", "showGCStats");
    } else if(Game.onMenu = "prefs") {
        var reference = MenuHelper.getMenuReference("block", "Mods");
        var block = MenuHelper.createElement("div", reference.parentNode, "block", "padding:0px;margin:8px 4px;", "", reference);
        var subsection = MenuHelper.createElement("div", block, "subsection", "padding:0px;");
        MenuHelper.createElement("div", subsection, "title", "position:relative;", "AutoCookie");
        var listing = MenuHelper.createElement("div", subsection, "listing");
        MenuHelper.createButton(listing, "testButton", 'Game.Notify("*click*", "You pressed the button!", [9,0]);', "Notification button", "Click to make a notification.");
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
                var dialog = confirm(`AutoCookie ${version} was created for Cookie Clicker ${version}. \nInjecting AutoCookie may have unforeseen consequences... \n\nProceed anyways?`);
                if(!dialog) return;
                preset = "this warning cannot be disabled as of yet.";
                Game.prefs.nwrAutoCookie_IgnoreMismatchForVersion = false;
            } else Game.prefs.nwrAutoCookie_IgnoreMismatchForVersion = true;
            Game.Notify(`Injecting AutoCookie... ${preset}`, '', [19, 1]);
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
                        Game.Notify('Injecting AutoCookie has been prohibited by another mod', '', [19, 0]);
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
        AutoCookie.user = {
            showGCStats: true,
        }

        // Creating instance

        // Installing AutoCookie
        AutoCookie.oldUpdateMenu = Game.UpdateMenu;
        Game.UpdateMenu = ACMenu;

        // Calling postload hooks
        if(AutoCookie.postloadHooks) {
            for(var i = 0; i < AutoCookie.postloadHooks.length; i++) {
                (AutoCookie.postloadHooks[i])(AutoCookie);
            }
        }

        var msg = `AutoCookie ${version} has successfully been injected.`;
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

// genInstance

init();
};