function injectAutoCookie() {

// Version settings
var VERSION = "2.052";
var REVISION = "0.93";
var DEVBUILD = "pre-alpha";

var AutoCookie = undefined;
var Game = window.Game;

// Game data
var BUILDINGS = {
    "Cursor": [15, 0.1],
    "Grandma": [100, 1],
    "Farm": [1100, 8],
    "Mine": [12000, 47],
    "Factory": [130000, 260],
    "Bank": [1400000, 1400],
    "Temple": [20000000, 7800],
    "Wizard tower": [330000000, 44000],
    "Shipment": [5100000000, 260000],
    "Alchemy lab": [75000000000, 1600000],
    "Portal": [1000000000000, 10000000],
    "Time machine": [14000000000000, 65000000],
    "Antimatter condenser": [170000000000000, 430000000],
    "Prism": [2100000000000000, 2900000000],
    "Chancemaker": [26000000000000000, 21000000000],
    "Fractal engine": [310000000000000000, 150000000000],
    "Javascript console": [71000000000000000000, 1100000000000],
    "Idleverse": [12000000000000000000000, 8300000000000],
    "Cortex baker": [1900000000000000000000000, 64000000000000],
    "You": [540000000000000000000000000, 510000000000000],
}
var UPGRADES = {
    "Reinforced index finger": [{buildings:{Cursor: 1}}, 100, {mult:{mouse: 2, Cursor: 2}}],
}


// Helper objects
var Instance = {
    buildings = {},
    upgrades = {},
    achievements = {},

    registerBuildings() { for(let obj in BUILDINGS) this.buildings[obj] = new Building(BUILDINGS[obj]); },
    registerUpgrades() { for(let upg in UPGRADES) this.upgrades[obj] = new Upgrade(upg, UPGRADES[upg]); },

    sync() {
        {
            let max = Game.shimmerTypes.golden.maxTime;
            let min = Game.shimmerTypes.golden.minTime;
            this.estGCTime = ((6 * max) + min) / 7;
        }
        this.bank = Game.cookies;
        this.cookiesEarned = Game.cookiesEarned;
        this.season = Game.season;
        this.totalBuildings = Game.BuildingsOwned;
        this.hasSugar = Game.canLumps();
        this.gcOdds = this.calcGCOdds();
        for(let obj in this.buildings) {
            this.buildings[obj].count = Game.Objects[obj].amount;
            this.buildings[obj].free = Game.Objects[obj].free;
        }
        for(let upg in this.upgrades) {
            this.upgrades[upg].unlocked = Game.Upgrades[upg].unlocked;
            this.upgrades[upg].owned = Game.Upgrades[upg].bought;
        }
    },

    calcGCOdds() {
        let pool = [];
        if(this.cookiesEarned >= 100000) {
            pool["Chain"] = 0.03;
            pool["Storm"] = 0.03;
        }
        if(this.season == "fools") pool["Everything Must Go"] = 0.05;
        pool["Click Frenzy"] = 0.1;
        if(this.totalBuildings >= 10) pool["Building special"] = 0.25;
        if(this.hasSugar) pool["Sweet"] = 0.0005;
        pool["Blab"] = 0.0001;

        let keys0 = Object.keys(pool);
        let i = Math.pow(2, keys0.length);
        let seeds = [];
        let odds = {
            Frenzy: 0,
            Lucky: 0,
        }

        for(let j = 0; j < keys0.length; j++) odds[keys0[j]] = 0;
        let keys1 = Object.keys(odds);

        while(i--) {
            seeds[i] = 1;
            for(let j = 0; j < keys0.length; j++) {
                let val = pool[keys0[keys0.length - j - 1]];
                let exp = Math.pow(2, j);
                seeds[i] *= (i % (2 * exp) >= exp) ? val : (1 - val);
            }

            let bits = 0;
            for(let j = i, k = 0; j > 0; k++) {
                let exp = Math.pow(2, k);
                if(j % (2 * exp) != 0) {
                    j -= exp;
                    bits++;
                }
            }

            for(let key in keys1) {
                let label = keys1[key];
                let val = keys1.length - key - 1;
                let exp = Math.pow(2, val);
                let factor = label == "Frenzy" || label == "Lucky" || (i % (2 * exp) >= exp);
                if(factor) odds[label] += seeds[i] / (bits + 2);
            }
        }

        let isDone = false;
        while(!isDone) {
            let temp = {};
            for(let key in odds) temp[key] = 0;

            i = Math.pow(2, keys0.length);
            while(i--) {
                let bits = 0;
                for(let j = i, k = 0; j > 0; k++) {
                    let exp = Math.pow(2, k);
                    if(j % (2 * exp) != 0) {
                        j -= exp;
                        bits++;
                    }
                }

                for(let key0 in keys1) {
                    let label0 = keys1[key0];
                    let val0 = keys1.length - key0 - 1;
                    let exp0 = Math.pow(2, val0);
                    let factor0 = label0 == "Frenzy" || label0 == "Lucky" || (i % (2 * exp0) >= exp0);
                    if(factor0) {
                        for(let key1 in keys1) {
                            let label1 = keys1[key1];
                            let val1 = keys1.length - key1 - 1;
                            let exp1 = Math.pow(2, val1);
                            let factor1 = label1 != "Blab" && (label1 == "Frenzy" || label1 == "Lucky" || (i % (2 * exp1) >= exp1));
                            temp[label0] += seeds[i] * odds[label1] * 0.2 / (bits + 2);
                            if(label0 != "Blab" && label0 == label1) continue;
                            temp[label0] += seeds[i] * odds[label1] * 0.8 / (bits + (factor1 ? 1 : 2));
                        }
                    }
                }
            }

            isDone = true;
            for(let key in temp) {
                if(odds[key] != temp[key]) isDone = false;
                odds[key] = temp[key];
            }
        }

        let hasBF = false;
        for(let obj in this.buildings) if(this.buildings[obj].count >= 10) hasBF = true;

        if(!hasBF) {
            odds["Frenzy"] += odds["Building special"];
            odds["Building special"] = 0;
        }

        return odds;
    }
}
var MenuWrapper = {
    getMenuReference(classAttr, title) {
        let menu = document.getElementById("menu");
        let list = menu.getElementsByClassName(classAttr);
        for(let i = 0; i < list.length; i++) {
            let element = list[i].querySelector(".title");
            if(element.textContent === title) return list[i];
        }
    },

    createElement(elem, parent, classAttr = "" , style = "", text = "", ref = "") {
        let element = document.createElement(elem);
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
        let element = this.createElement("div", parent, "listing");
        this.createElement("b", element, "", "", `${statistic}:`);
        element.append(` ${value}`);
    },

    createButton(parent, id, option, onText, offText, desc, dim = true) {
        let label = AutoCookie.user[option] ? onText : offText;
        let button = this.createElement("a", parent, "smallFancyButton prefButton option", "", label);
        button.setAttribute("id", id);
        button.setAttribute("onclick", `window.nwrAutoCookie.MenuWrapper.toggle("${option}", "${id}", "${onText}", "${offText}", 0, ${dim})`);
        if(desc != "") {
            this.createElement("label", parent, "", "", desc);
            this.createElement("br", parent);
        }
    },

    toggle(option, id, on, off, invert = 0, dim = true) {
        let button = document.getElementById(id);
        if(window.nwrAutoCookie.user[option]) {
            button.innerHTML = off;
            window.nwrAutoCookie.user[option] = false;
        } else {
            button.innerHTML = on;
            window.nwrAutoCookie.user[option] = true;
        }
        if(dim) button.className = `smallFancyButton prefButton option${(window.nwrAutoCookie.user[option] ^ invert) ? '' : ' off'}`;
        Game.UpdateMenu();
    },

    createSection(parent, title, buttonID, option) {
        let elem0 = this.createElement("div", parent, "title", "padding:0px 16px;opacity:0.7;font-size:17px;font-family:Kavoon,Georgia,serif;", `${title} `);
        this.createButton(elem0, buttonID, option, "Hide", "Show", "", false);
        let section = this.createElement("div", parent, "subsection");
        return section;
    },
}

class Achievement {
    constructor() {

    }
}

class Upgrade {
    unlocked = 0;
    owned = 0;

    constructor(name, obj) {
        this.prerequisites = obj[0];
        this.price = obj[1];
        this.effect = obj[2];
        if(obj[0].buildings) {
            for(let building in obj[0].buildings) {
                AutoCookie.instance.buildings[building].upgrades[name] = { need: obj[0].buildings[building], };
            }
        }
    }
}

class Building {
    upgrades = [];
    achievements = {};
    count = 0;
    free = 0;

    constructor(obj) {
        this.basePrice = obj[0];
        this.baseCps = obj[1];
    }
}


// Hooks
function ACMenu() {
    AutoCookie.oldUpdateMenu();
    AutoCookie.instance.sync();
    if(Game.onMenu == "stats") {
        let reference = MenuWrapper.getMenuReference("subsection", "General");
        let subsection = MenuWrapper.createElement("div", reference.parentNode, "subsection", "", "", reference);
        MenuWrapper.createElement("div", subsection, "title", "position:relative;", "AutoCookie");
        MenuWrapper.createStatistic(subsection, "Version", AutoCookie.version);
        let gcStats = MenuWrapper.createSection(subsection, "Golden Cookie statistics", "nwrGCStatsButton", "showGCStats");
        if(AutoCookie.user.showGCStats) {
            MenuWrapper.createStatistic(gcStats, "Estimated time left", Game.shimmers.length > 0 ? "---" : Math.max(0, Math.ceil((AutoCookie.instance.estGCTime - Game.shimmerTypes.golden.time) / 30)));
            MenuWrapper.createElement("br", gcStats);
            for(let i in AutoCookie.instance.gcOdds) MenuWrapper.createStatistic(gcStats, i, `${(AutoCookie.instance.gcOdds[i] * 100).toFixed(4)}%`);
        }
    } else if(Game.onMenu = "prefs") {
        let reference = MenuWrapper.getMenuReference("block", "Mods");
        if(reference !== undefined) {
            let block = MenuWrapper.createElement("div", reference.parentNode, "block", "padding:0px;margin:8px 4px;", "", reference);
            let subsection = MenuWrapper.createElement("div", block, "subsection", "padding:0px;");
            MenuWrapper.createElement("div", subsection, "title", "position:relative;", "AutoCookie");
            let listing = MenuWrapper.createElement("div", subsection, "listing");
        }
    }
}


var init = function() {
    try {
        let version = 'v' + VERSION + '.' + REVISION + '-' + DEVBUILD;
        if(window.nwrAutoCookie != undefined && window.nwrAutoCookie.ready) {
            Game.Notify("AutoCookie has already been injected...", window.nwrAutoCookie.version, [32, 0]);
            return;
        }

        // Handling version mismatch
        let mismatch = false;
        let ignoreMismatchFor = null;
        if(Game.version != VERSION) {
            mismatch = true;
            let preset = "the version mismatch warning has been previously disabled in user settings";
            if(localStorage) ignoreMismatchFor = localStorage.getItem("nwrAutoCookie_IgnoreMismatchForVersion");
            if(ignoreMismatchFor !== Game.version + '|' + VERSION + '|' + REVISION) {
                let dialog = confirm(`AutoCookie ${version} was created for Cookie Clicker ${version}. \nInjecting AutoCookie may have unforeseen consequences... \n\nProceed anyways?`);
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
                let instance = {ccVersion: VERSION, revision: REVISION, devBuild: DEVBUILD, version: version};
                for(let hook in window.nwrAutoCookie) {
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
        for(let i = 0; i < Game.ObjectsById.length; i++) new Building(Game.ObjectsById[i].name, Game.ObjectsById[i].basePrice, Game.ObjectsById[i].baseCps, Game.ObjectsById[i].amount, Game.ObjectsById[i].free);

        // Installing AutoCookie
        if(AutoCookie.MenuWrapper === undefined) AutoCookie.MenuWrapper = MenuWrapper;
        AutoCookie.oldUpdateMenu = Game.UpdateMenu;
        Game.UpdateMenu = ACMenu;

        // Calling postload hooks
        if(AutoCookie.postloadHooks) {
            for(let i = 0; i < AutoCookie.postloadHooks.length; i++) {
                (AutoCookie.postloadHooks[i])(AutoCookie);
            }
        }

        let msg = `AutoCookie ${version} has successfully been injected.`;
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