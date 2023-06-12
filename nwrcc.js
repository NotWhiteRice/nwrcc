function injectAutoCookie() {

// Version settings
var VERSION = "2.052";
var REVISION = "0.75";
var DEVBUILD = "pre-alpha";

var AutoCookie = undefined;
var Game = window.Game;

// Helper objects
var Instance = {
    sync() {
        this.wrathOdds = Game.elderWrath/3;
        this.estGCTime;
        {
            var max = Game.shimmerTypes.golden.maxTime;
            var min = Game.shimmerTypes.golden.minTime;
            estGCTime = min + Math.pow((3 * Math.pow(min, 5) + Math.pow(min, 6) - 15 * Math.pow(min, 4) * max + 30 * Math.pow(min, 3) * Math.pow(max, 2) - 30 * Math.pow(min, 2) * Math.pow(max, 3) + 15 * min * Math.pow(max, 4) - 3 * Math.pow(max, 5)), 1/6);
        }
    }
}
var MenuWrapper = {
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
        this.createElement("b", element, "", "", `${statistic}:`);
        element.append(` ${value}`);
    },

    createButton(parent, id, option, onText, offText, desc, dim = true) {
        var label = AutoCookie.user[option] ? onText : offText;
        var button = this.createElement("a", parent, "smallFancyButton prefButton option", "", label);
        button.setAttribute("id", id);
        button.setAttribute("onclick", `window.nwrAutoCookie.MenuWrapper.toggle("${option}", "${id}", "${onText}", "${offText}", 0, ${dim})`);
        if(desc != "") {
            this.createElement("label", parent, "", "", desc);
            this.createElement("br", parent);
        }
    },

    toggle(option, id, on, off, invert = 0, dim = true) {
        var button = document.getElementById(id);
        if(window.nwrAutoCookie.user[option]) {
            button.innerHTML = off;
            window.nwrAutoCookie.user[option] = false;
        } else {
            button.innerHTML = on;
            window.nwrAutoCookie.user[option] = true;
        }
        if(dim) button.className = `smallFancyButton prefButton option${(window.nwrAutoCookie.user[option] ^ invert) ? '' : ' off'}`;
    },

    createSection(parent, title, buttonID, option) {
        var elem0 = this.createElement("div", parent, "title", "padding:0px 16px;opacity:0.7;font-size:17px;font-family:Kavoon,Georgia,serif;", `${title} `);
        this.createButton(elem0, buttonID, option, "Hide", "Show", "", false);
        var section = this.createElement("div", parent, "subsection");
        return section;
    },
}

// Hooks
function ACMenu() {
    AutoCookie.oldUpdateMenu();
    AutoCookie.instance.sync();
    if(Game.onMenu == "stats") {
        var reference = MenuWrapper.getMenuReference("subsection", "General");
        var subsection = MenuWrapper.createElement("div", reference.parentNode, "subsection", "", "", reference);
        MenuWrapper.createElement("div", subsection, "title", "position:relative;", "AutoCookie");
        MenuWrapper.createStatistic(subsection, "Version", AutoCookie.version);
        var gcStats = MenuWrapper.createSection(subsection, "Golden Cookie statistics", "nwrGCStatsButton", "showGCStats");
        MenuWrapper.createStatistic(gcStats, "Wrath Cookie probability", AutoCookie.instance.wrathOdds);
        MenuWrapper.createStatistic(gcStats, "Estimated time left", Math.max(0, AutoCookie.instance.estGCTime - Game.shimmerTypes.golden.time));
    } else if(Game.onMenu = "prefs") {
        var reference = MenuWrapper.getMenuReference("block", "Mods");
        var block = MenuWrapper.createElement("div", reference.parentNode, "block", "padding:0px;margin:8px 4px;", "", reference);
        var subsection = MenuWrapper.createElement("div", block, "subsection", "padding:0px;");
        MenuWrapper.createElement("div", subsection, "title", "position:relative;", "AutoCookie");
        var listing = MenuWrapper.createElement("div", subsection, "listing");
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
        AutoCookie.instance = Instance;
        AutoCookie.user = {
            showGCStats: true,
        }

        // Creating instance
        AutoCookie.instance.sync();

        // Installing AutoCookie
        if(AutoCookie.MenuWrapper === undefined) AutoCookie.MenuWrapper = MenuWrapper;
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