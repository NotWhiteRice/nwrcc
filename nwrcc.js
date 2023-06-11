let platform = typeof Steam == "undefined" ? "web" : "steam";
let sizeWarning = false;
let instance;
let ICookie;

class Instance {
    sync() {
        this.cookiesEarned = Game.cookiesEarned;
        this.cps = Game.cookiesPs;
        this.bank = Game.cookies;
        this.totalBuildings = Game.BuildingsOwned;
        this.season = Game.season;
    }

    constructor() {
        this.sync();
    }
}

AutoCookie.onLogic = function() {
    if(AutoCookie.config.autoGC)
        Game.shimmers.forEach(function(shimmer) {
            if(!AutoCookie.config.miscAch || ((!Game.HasAchiev("Fading luck") && shimmer.life<Game.fps) || Game.shimmers.length > 1) || Game.HasAchiev("Fading luck"))
                if(shimmer.type == "golden" || AutoCookie.config.clickWrath) shimmer.pop();
});

AutoCookie.onCheck = function() {
    if(AutoCookie.config.miscAch) {
        AutoCookie.config.miscAch = false;
        if(!Game.HasAchiev("What's in a name")) {
            AutoCookie.config.miscAch = true;
            Game.bakeryNamePrompt();
            document.getElementsByClassName("option focused")[0].click();
        }
        if(!Game.HasAchiev("Tabloid addiction")) {
            AutoCookie.config.miscAch = true;
            const interval = setInterval(() => {
                Game.tickerL.click();
                if(Game.HasAchiev("Tabloid addiction")) clearInterval(interval);
            }, 1);
        }
        if(!Game.HasAchiev("Here you go")) {
            AutoCookie.config.miscAch = true;
            Game.ShowMenu("stats");
            Game.Achievements["Here you go"].click();
            Game.ShowMenu("");
        }
        if(!Game.HasAchiev("Tiny cookie")) {
            AutoCookie.config.miscAch = true;
            Game.ShowMenu("stats");
            document.getElementsByClassName("subsection")[0].children[1].children[0].children[1].children[0].click();
        }
        if(!Game.HasAchiev("Olden days")) {
            AutoCookie.config.miscAch = true;
            Game.ShowMenu("log");
            if(this.platform == "steam") document.getElementsByClassName("inset")[1].childNodes[3].children[3].children[2].children[0].click();
            else document.getElementsByClassName("inset")[1].childNodes[3].children[3].children['oldenDays'].children[0].click();
        }
        if(!Game.HasAchiev("Stifling the press") || !Game.HasAchiev("Cookie-dunker")) {
            if(this.platform == "steam") {
                AutoCookie.config.miscAch = true;
                if(screen.availWidth == window.outerWidth) {
                    if(!this.sizeWarning) {
                        Game.Notify("Please unmaximize your window", "This need be fixed later", [13, 6]);
                        this.sizeWarning = true;
                    }
                } else {
                    let width = window.outerWidth;
                    let height = window.outerHeight;

                    if(!Game.HasAchiev("Stifling the press")) {
                        window.resizeTo(899, (height > 300 ? height : 300));
                        Game.tickerL.click();
                        }
                        if(!Game.HasAchiev("Cookie-dunker")) {
                            window.resizeTo(width, 25);
                            let counter = 0;
                            const interval = setInterval(() => {
                                if(counter == 1) window.resizeTo(width, height);
                                counter++;
                                if(counter == 1) clearInterval(interval);
                            }, 10000);
                        }
                    }
                } else if(!this.sizeWarning) {
                    Game.Notify('"Cookie-dunker" and "Stifling the press" must be done manually.', 'These achievements are only "automatic" on Steam', [1, 7]);
                    this.sizeWarning = true;
                }
            }
        }
    }
};

AutoCookie.onReset = function(isHard) {
    if(isHard) sizeWarning = false;
};

function isAutoclickOn() {
    if(!AutoCookie.config.autoclick) return false;
    if(!AutoCookie.config.neverclick) return true;
    if(Game.ascensionMode != 1 && Game.resets != 0) return true;
    AutoCookie.config.neverclick = !Game.HasAchiev("Neverclick") || (AutoCookie.config.shadowAch && !Game.HasAchiev("True Neverclick"));
    return !AutoCookie.config.neverclick;
}

AutoCookie.clickCookie = function() {
    if(isAutoclickOn()) Game.ClickCookie();
};

function registerMod(modID = "nwrcc") {
    Game.registerMod(modID, {
        init: function() {
            instance = new Instance;
            ICookie = setInterval(AutoCookie.clickCookie, 1000/AutoCookie.config.clicksPerSec);
            console.log("pre logic");
            Game.registerHook("logic", AutoCookie.onLogic);
            console.log("after logic");
            Game.registerHook("check", AutoCookie.onCheck);
            console.log("after check");
            Game.registerHook("reset", AutoCookie.onReset);
        },
        save: function() {
            let data = {};
            Object.keys(AutoCookie.config).forEach(function (option) {
                data[option] = AutoCookie.config[option];
            });
            return JSON.stringify(data);
        },
        load: function(str) {
            let data = JSON.parse(str||0);
            Object.keys(data).forEach(function(option) {
                AutoCookie.config[option] = data[option];
            });
        },
    })
}