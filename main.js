let instance;

var lastCompatibleVersion = 2.052;
if(Game.version > lastCompatibleVersion)
    Game.Notify("Auto-Cookie was created for version v" + lastCompatibleVersion, "Auto-Cookie might not work as intended.", [12, 7]);

Game.registerMod(AutoCookie.modID, {
    init: function() {
        instance = new Instance(Game);
        setInterval(clickBigCookie, 1000/AutoCookie.clicksPs);
        Game.registerHook("logic", AutoCookie.onLogic);
        Game.registerHook("check", AutoCookie.onCheck);
        Game.registerHook("reset", AutoCookie.onReset);
    },

    save: function() {
        let data = {};
        Object.keys(AutoCookie.prefs).forEach(function (pref) {
            data[pref] = AutoCookie.prefs[pref];
        });
        return JSON.stringify(data);
    },

    load: function(str) {
        let data = JSON.parse(str);
        Object.keys(data).forEach(function (pref) {
            AutoCookie.prefs[pref] = data[pref];
        });
    }
});

class AutoCookie {
    modID = "nwrcc";
    platform = typeof Steam == "undefined" ? "web" : "steam";
    sizeWarning = false;
    prefs = {
        autoclick: true,
        autoGC: true,
        clickWrath: false,
        autoFortunes: true,
        neverclick: true,
        hardcore: true,
        speedrun: true,

        miscAch: true,
        shadowAch: true,
    };
    clicksPerSec = 1000;

    onLogic = function() {
        if(prefs.autoGC)
            Game.shimmers.forEach(function(shimmer)
                if(!prefs.miscAch || ((!Game.HasAchiev("Fading luck") && shimmer.life<Game.fps) || Game.shimmers.length > 1) || Game.HasAchiev("Fading luck"))
                    if(shimmer.type == "golden" || clickWrath) shimmer.pop();
        if(prefs.autoFortunes)
            if(Game.TickerEffect && Game.TickerEffect.type == 'fortune')
                Game.tickerL.click();
    }
    onCheck = function() {
        getMiscAchiev();
    }
    onReset = function(isHard) {
        if(isHard) sizeWarning = false;
    }
}

class Instance {
    constructor() {
        this.data = {};
        this.syncGame();
        this.syncData();
    }

    syncGame() { this.game = Game; }

    syncData() {
        this.data.cookiesEarned = this.game.cookiesEarned;
        this.data.cps = this.game.cookiesPs;
        this.data.bank = this.game.cookies;
        this.data.totalBuildings = this.game.BuildingsOwned;
        this.data.season = this.game.season;
        this.data.lumps = this.game.canLumps();
    }

    //Needs buildings, buffs, and auras
    gcOdds() {
        let temp0 = {};
        if(this.data.cookiesEarned >= 100000) {
            temp0["Chain"] = 0.03;
            temp0["Storm"] = 0.03;
        }
        if(this.data.season == "fools") temp0["Everything Must Go"] = 0.05;
        temp0["Click Frenzy"] = 0.1;
        // If Dragonflight is active, set ^^ to 0.005
        if(this.data.totalBuildings >= 10) temp0["Building special"] = 0.25;
        if(this.data.lumps) temp0["Sweet"] = 0.0005;
        // If auraMult for Dragonflight is not 0, insert mult * 0.1925
        // If auraMult for Dragon Harvest is not 0, insert mult * 0.1925
        temp0["Blab"] = 0.0001;
        let keys0 = Object.keys(temp0);

        let counter = Math.pow(2, keys0.length);
        let pool = [];

        let temp1 = {
            Frenzy: 0,
            Lucky: 0,
        }
        for(i = 0; i < keys0.length; i++) temp1[keys0[i]] = 0;
        let keys1 = Object.keys(temp1);

        while(counter--) {
            pool[counter] = 1;
            for(i = 0; i < keys0.length; i++) {
                let key = temp0[keys0[keys0.length - i - 1]];
                let exp = Math.pow(2, i);
                pool[counter] *= (counter % 2*exp >= exp) ? key : (1 - key);
            }

            let bits = 0;
            for(i = counter, j = 0; i > 0; j++) {
                let exp = Math.pow(2, j);
                if(i % (2*exp) != 0) {
                    i -= exp;
                    bits++;
                }
            }

            for(let key in keys1) {
                let label = keys1[key];
                let val = keys1.length - key - 1;
                let exp = Math.pow(2, val);
                let factor = label == "Frenzy" || label == "Lucky" || (counter % (2 * exp) >= exp);
                if(factor) temp1[label] += pool[counter] / (bits + 2);
            }
        }

        let conv = false;
        while(!conv) {
            let temp2 = {};
            for(let label in temp1) temp2[label] = 0;
            counter = Math.pow(2, keys0.length);
            while(counter--) {
                let bits = 0;
                for(i = counter, j = 0; i > 0; j++) {
                    let exp = Math.pow(2, j);
                    if(i % (2*exp) != 0) {
                        i -= exp;
                        bits++;
                    }
                }

                for(let key0 in keys1) {
                    let label0 = keys1[key0];
                    let val0 = keys1.length - key0 - 1;
                    let exp0 = Math.pow(2, val0);
                    let factor0 = label0 == "Frenzy" || label0 == "Lucky" || (counter % (2 * exp0) >= exp0);
                    if(factor0) {
                        for(let key1 in keys1) {
                            let label1 = keys1[key1];
                            let val1 = keys1.length - key1 - 1;
                            let exp1 = Math.pow(2, val1);
                            let factor1 = label1 != "Blab" && (label1 == "Frenzy" || label1 == "Lucky" || (counter % (2 * exp1) >= exp1));
                            temp2[label0] += pool[counter] * temp1[label1] * 0.2 / (bits + 2);
                            if(key0 == key1 && label1 != "Blab") continue;
                            temp2[label0] += pool[counter] * temp1[label1] * 0.8 / (bits + (factor1 ? 1 : 2));
                        }
                    }
                }
            }

            conv = true;
            for(let key in temp2) {
                if(temp1[key] != temp2[key]) conv = false;
                temp1[key] = temp2[key];
            }
        }

        let hasBF = false;
        // Searching for at least 10 of a single building

        if(this.data.totalBuildings >= 10 && !hasBF) {
            temp1["Frenzy"] += temp1["Building special"];
            temp1["Building special"] = 0;
        }

        console.log(temp1);
        return temp1;
    }
    //Needs clicksPerSec and buildings
    gcCps() {
        let odds = this.gcOdds();
        let total = 0;
        for(let key in odds) {
            let dur = 0;
            let value = 0;
            let bank = this.data.bank;
            switch(key) {
                case "Frenzy":
                    dur = 77;
                    total += this.data.cps * 6 * dur * odds["Frenzy"];
                    break;
                case "Lucky":
                    bank *= 0.15;
                    let cps = this.data.cps * 900;
                    value = ((bank < cps ? bank : cps) + 13);
                    total += value * odds["Lucky"];
                    break;
                case "Building special":
                    dur = 30;
                    let count = 0;
                    // for each building check if count is >= 10
                    //      then add count * 0.1 in-place to value
                    //      then inc count
                    value /= count;
                    total += this.data.cps * value * dur * odds["Building special"];
                    break;
                case "Dragon Harvest":
                    dur = 60;
                    total += this.data.cps * 14 * dur * odds["Dragon Harvest"];
                    break;
                case "Dragonflight":
                    dur = 10;
                    // add in place 1110 * clicksPerSec * dur * odds["Dragonflight"];
                    break;
                case "Click Frenzy":
                    dur = 13;
                    // add in place 776 * clicksPerSec * dur * odds["Click Frenzy"];
                    break;
                case "Storm":
                    dur = 7;
                    value = 240 * this.data.cps;
                    let fps = 30;
                    total += fps * 0.5 * dur * value * odds["Storm"];
                    break;
                case "Chain":
                    let max = this.data.cps * 21600;
                    max = bank/2 < max ? bank/2 : max;
                    let chain = Math.floor(Math.log(bank/10000000000)/Math.LN10) + 1;
                    let chance = 1;
                    while(true) {
                        curr = "7";
                        curr.repeat(chain);
                        value += curr * chance;
                        if(curr > max) break;
                        chain++;
                        chance *= 0.99;
                    }
                    total += value * odds["Chain"];
                    break;
            }
            let min = this.game.fps * 300;
            let max = this.game.fps * 900;
            let avg = min * (1 + Math.pow(2, 5/6));
            return total / avg;
        }
    }
}

function clickBigCookie() { if((Game.HasAchiev('Neverclick') && Game.HasAchiev('True Neverclick')) || (Game.ascensionMode != 1 && Game.resets > 0)) Game.ClickCookie(); }
function getMiscAchiev() {
    if(!Game.HasAchiev('What\'s in a name')) {
        Game.bakeryNamePrompt();
        document.getElementsByClassName("option focused")[0].click();
    }
    if(!Game.HasAchiev('Tabloid addiction')) {
        const tickerInt = setInterval(() => {
            Game.tickerL.click();
            if(Game.HasAchiev('Tabloid addiction')) clearInterval(tickerInt);
        }, 1);
    }
    if(!Game.HasAchiev('Here you go')) {
        Game.ShowMenu('stats');
        Game.Achievements['Here you go'].click();
        Game.ShowMenu('');
    }
    if(!Game.HasAchiev('Tiny cookie')) {
        Game.ShowMenu('stats');
        document.getElementsByClassName("subsection")[0].children[1].children[0].children[1].children[0].click();
    }
    if(!Game.HasAchiev('Olden days')) {
        Game.ShowMenu('log');
        if(AutoCookie.onSteam) document.getElementsByClassName("inset")[1].childNodes[3].children[3].children[2].children[0].click();
        else document.getElementsByClassName("inset")[1].childNodes[3].children[3].children['oldenDays'].children[0].click();
    }
    if(!Game.HasAchiev('Stifling the press') || !Game.HasAchiev('Cookie-dunker')) {
        if(AutoCookie.onSteam) {
            if(screen.availWidth == window.outerWidth) {
                if(!AutoCookie.sizeWarning) {
                    Game.Notify("Please unmaximize your window", "This need be fixed later", [13, 6]);
                    AutoCookie.sizeWarning = true;
                }
            } else {
                let width = 0;
                while(width < window.outerWidth) width++;
                let height = 0;
                while(height < window.outerHeight) height++;

                console.log(width + ", " + height);
                if(!Game.HasAchiev('Stifling the press')) {
                    window.resizeTo(Game.tickerTooNarrow - 1, (height > 300 ? height : 300));
                    Game.tickerL.click();
                }
                if(!Game.HasAchiev('Cookie-dunker')) {
                    window.resizeTo(width, 25);
                    let counter = 0;
                    const dunkInt = setInterval(() => {
                        if(counter === 1) window.resizeTo(width, height);
                        counter++;
                        if(counter === 1) clearInterval(dunkInt);
                    }, 10000);
                }
            }
        } else if(!AutoCookie.sizeWarning) {
            Game.Notify("'Cookie-dunker' and 'Stifling the press' must be done manually.", 'Those achievements are only "automatic" on Steam', [1, 7]);
            AutoCookie.sizeWarning = true;
        }
    }
}

function calcClickCPS() {
    let enabled = (Game.HasAchiev('Neverclick') && Game.HasAchiev('True Neverclick')) || (Game.ascensionMode != 1 && Game.resets > 0);
    return (enabled ? AutoCookie.clicksPs * Game.mouseCps() : 0);
}