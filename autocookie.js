var ccVersion = 2.032;
if(Game.version > ccVersion) Game.Notify("AutoCookie was made for an earlier version of Cookie Clicker", "AutoCookie was created for v" + ccVersion, [12, 7]);

var AutoCookie = {
    docs: "https://notwhiterice.github.io/nwrcc",
    version: "v2.052.1",
};

var imports = [
    AutoCookie.docs + "/config.js",
    AutoCookie.docs + "/nwrcc.js",
];

AutoCookie.ILoad = setInterval(() => {
    if(Game && Game.ready) {
        clearInterval(AutoCookie.ILoad);
        nwrInit();
    }
}, 1000);

function loadImport(index) {
    if(index >= imports.length) {
        registerMod();
    } else {
        var url = imports[index];
        if(/\.js$/.exec(url)) {
            $.getScript(url, () => {
                loadInport(index + 1);
            });
        } else {
            Game.Notify("Unable to import script...", url, [32, 0]);
            loadImport(index + 1);
        }
    }
}

function nwrInit() {
    var jquery = document.createElement("script");
    jquery.setAttribute("type", "text/javascript");
    jquery.setAttribute("src", "https://code.jquery.com/jquery-3.7.0.min.js");
    jquery.setAttribute("integrity", "sha256-2Pmvv0kuTBOenSvLm6bvfBSSHrUJ+3A7x6P5Ebd07/g=");
    jquery.setAttribute("crossorigin", "anonymous");
    jquery.onload = function() {
        loadImport(0);
    }
}