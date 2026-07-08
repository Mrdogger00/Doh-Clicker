const FORMAT_SUFFIXES = [
    { value: 1e12, suffix: "t" },
    { value: 1e9, suffix: "b" },
    { value: 1e6,  suffix: "m" },
    { value: 1e3,  suffix: "k" }, 
];

cpc_counter = document.getElementById("cpc");
cps_counter = document.getElementById("cps");

const btnimg = document.querySelector('.btn img')

btnimg.addEventListener('mousedown', () => {
    btnimg.classList.add('clicked')
})
btnimg.addEventListener('mouseup', () => {
    btnimg.classList.remove('clicked')
})

document.querySelectorAll(".cost").forEach(el => {
    const raw = Number(el.dataset.cost);
    el.innerText = formatNumber(raw);
});

window.addEventListener("DOMContentLoaded", () => {
    syncClicks();
    renderUI();
});


window.addEventListener("beforeunload", () => {
    if (pendingClicks <= 0 && pendingPassiveCoins <= 0) return;

    const data = new URLSearchParams({
        clicks: pendingClicks,
        passive: Number(pendingPassiveCoins.toFixed(3)),
        csrfmiddlewaretoken: document.querySelector('meta[name="csrf-token"]').content
    });

    fetch("/api/click/", {
        method: "POST",
        keepalive: true,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-CSRFToken": document.querySelector('meta[name="csrf-token"]').content
        },
        body: data.toString(),
    });

    pendingClicks = 0;
    pendingPassiveCoins = 0;
});
////////////////////////////////////////
let coinsVisual = document.getElementById("coins");

let serverCoins = Math.floor(initialCoins);
let pendingClicks = 0;


window.mainClick = function () {
    pendingClicks = Math.min(pendingClicks + 1, 120);
    renderUI();

    playClickSound();
    playSpawnReward();
}

function playSpawnReward(){
    const rect = btnimg.getBoundingClientRect();

    const spawnX =
        rect.left +
        rect.width / 2 +
        (Math.random() * 20 - 10);

    const spawnY =
        rect.top +
        rect.height / 2 +
        (Math.random() * 20 - 10);

    spawnReward(
        spawnX,
        spawnY,
        formatNumber(displayedCoinsPerClick)
    );
}

function spawnReward(x, y, amount){
    const reward = document.createElement("div");
    reward.className = "floating-reward";

    reward.innerHTML = `
        <img src="/static/main/img/coin.png">
        <span>+${amount}</span>
    `;

    reward.style.left = (x - 20) + "px";
    reward.style.top = (y + 10) + "px";

    const angle = (Math.random() - 0.5) * 0.8; // випадкове відхилення
    const dist = 40 + Math.random() * 30;

    reward.style.setProperty("--x", `${Math.sin(angle) * dist}px`);
    reward.style.setProperty("--y", `${-dist}px`);

    document.body.appendChild(reward);

    reward.addEventListener("animationend", () => reward.remove());
}
////////////////////////////////////////
let pendingPassiveCoins = 0;
function addCoinsPerSecond(){
    pendingPassiveCoins += displayedCoinsPerSecond / 10;
    renderUI();
}
////////////////////////////////////////
const modal = document.getElementById("settingsModal")
const settingsBtn = document.querySelector(".settings-btn")

settingsBtn.addEventListener('click', () => {
    modal.classList.toggle("hidden")
})

document.addEventListener("click", (e) => {
    if (!modal.contains(e.target) && !settingsBtn.contains(e.target)){
        modal.classList.add("hidden")
    }
})
/////////////////////////////////////////
document.getElementById("logoutBtn").addEventListener('click', () => {
    fetch("/logout/", {
        method: "POST",
        headers: {
            "X-CSRFToken": document.querySelector('meta[name="csrf-token"]').content
        }
    }).then(() => location.reload());
})
///////////////////////////////////////
let upgradeLock = false;
let upgradeInProgress = false;

async function upgrade_btn(btn, level) {
    if (upgradeLock || upgradeInProgress) return;

    upgradeInProgress = true;

    btn.disabled = true;
    btn.classList.add("cooldown");

    const predict_cost = Number(btn.querySelector(".cost").innerText);


    // чекаємо якщо синк вже йде
    while (syncInProgress) {
        await new Promise(r => setTimeout(r, 50));
    }

    // синкаємо pending перед апгрейдом
    if (pendingClicks > 0 || pendingPassiveCoins > 0) {
        await syncClicks();
    }

    upgradeLock = true;

    const csrf = document.querySelector('meta[name="csrf-token"]').content;
    const clicksToSend = pendingClicks;
    pendingClicks = 0;

    fetch("/api/upgrade/", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-CSRFToken": csrf
        },
        body: "level=" + level
    })
    .then(res => res.json())
    .then(data => {
        if (data.syncId && data.syncId < lastAppliedSyncId) return;
        lastAppliedSyncId = data.syncId ?? lastAppliedSyncId;

        if (data.error) {
            showErrorAboveButton(btn, "Not enough coins");
            pendingClicks += clicksToSend;
            return;
        }

        lastUpgradeTime = Date.now(); // фіксуємо час апгрейду

        playPurchaseSound();
        //console.log("coins", performance.now());
        spawnCoins(btn);

        applyServerState(data);

        pendingClicks = Math.max(0, pendingClicks - clicksToSend);
        
        
        btn.querySelector(".cost").dataset.cost = data.next_cost;
        btn.querySelector(".cost").innerText = formatNumber(data.next_cost);
    })
    .catch(err => {
        console.error(err);
        pendingClicks += clicksToSend;
    })
    .finally(() => {
        upgradeLock = false;
        upgradeInProgress = false;

        if(sync_promise){
            sync_promise = false;
            syncClicks();
        }

        btn.disabled = false;
        btn.classList.remove("cooldown");

        renderUI();
    });
}

function updateUpgradeButtons(level = serverLevel) {  
  
    serverLevel = Number(level);  
  
    //console.log("serverLevel:", serverLevel);  
  
    document.querySelectorAll(".upgrade-btn").forEach(btn => {  
  
        const btnLevel = Number(btn.dataset.level);
        const cost = safeNumber(btn.querySelector(".cost")?.dataset.cost ?? 0);
        const locked = btnLevel > serverLevel;  
        

        //console.log("btn:", btnLevel, "locked:", locked, "cost: ", cost);  
        const visibleCoins = serverCoins + pendingClicks * displayedCoinsPerClick + pendingPassiveCoins;
  
        btn.disabled = locked;  
        if (!locked){
            if (cost > visibleCoins){
                btn.disabled = true;
            } else{
                btn.disabled = false;
            }
        }
  
        if (locked) {  
            btn.classList.add("lock");  
        } else {  
            btn.classList.remove("lock");  
        }  
    });  
}

function showErrorAboveButton(btn, text) {
    const popup = document.createElement("div");
    popup.className = "floating-error";
    popup.innerText = text;

    btn.style.position = "relative";

    btn.appendChild(popup);

    requestAnimationFrame(() => {
        popup.style.opacity = "1";
        popup.style.transform = "translateY(-10px)";
    });

    setTimeout(() => {
        popup.style.opacity = "0";
        popup.style.transform = "translateY(-4px)";
    }, 600);

    setTimeout(() => {
        popup.remove();
    }, 1000);
}

function spawnCoins(btn){
    
    const rect = btn.getBoundingClientRect();

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const container = document.getElementById("particle-container");

    for(let i = 0; i < 10; i++){

        const coin = document.createElement("img");

        coin.src="/static/main/img/coin.png";
        coin.className="coin-particle";

        coin.style.left = cx + "px";
        coin.style.top = cy + "px";

        const angle = Math.random()*Math.PI*2;
        const dist = 60 + Math.random()*70;

        coin.style.setProperty("--x",
            Math.cos(angle)*dist + "px");

        coin.style.setProperty("--y",
            Math.sin(angle)*dist + "px");

        coin.style.setProperty("--rot",
            (Math.random()*720-360)+"deg");

        container.appendChild(coin);

        coin.addEventListener("animationend",()=>{
            coin.remove();
        });

    }
}
/////////////////////////////////////////
function formatNumber(num, precision = 1) {
    for (const entry of FORMAT_SUFFIXES) {
        if (num >= entry.value) {
            return (num / entry.value).toFixed(precision) + entry.suffix;
        }
    }
    return Math.floor(num).toString();
}

function updateUI() {
    /*console.log(
    "serverCoins =", serverCoins,
    "pending =", pendingClicks,
    "cpc =", displayedCoinsPerClick
    );*/
    
    coinsVisual.innerText = formatNumber(
        serverCoins + 
        pendingClicks * 
        displayedCoinsPerClick + 
        pendingPassiveCoins
    );
}

function updateYieldUI() {
    //console.log("called updateYieldUI");
    cpc_counter.innerText = formatNumber(displayedCoinsPerClick);
    cps_counter.innerText = formatNumber(displayedCoinsPerSecond);
}

function renderUI(){
    updateUpgradeButtons(serverLevel);
    updateYieldUI();
    updateUI();
}
/////////////////////////////////////////
let syncId = 0;
let lastAppliedSyncId = 0;
let syncInProgress = false;
let lastUpgradeTime = 0;

let sync_promise = false;

async function syncClicks() {
    if (syncInProgress) return;
    if (upgradeLock) {
        sync_promise = true;
        return;
    }

    if (pendingClicks <= 0 && pendingPassiveCoins <= 0) return;

    if (pendingClicks < 0 || pendingPassiveCoins < 0) {
        throw new Error("Negative pending values");
    }

    syncInProgress = true;

    const clicksToSend = Math.min(pendingClicks, 120);
    const passiveToSend = Number(pendingPassiveCoins.toFixed(3));

    const body = new URLSearchParams({
        clicks: clicksToSend,
        passive: passiveToSend
    });

    return fetch("/api/click/", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-CSRFToken": document.querySelector('meta[name="csrf-token"]').content
        },
        body: body.toString()
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) return;

        if (data.syncId && data.syncId < lastAppliedSyncId) return;
        lastAppliedSyncId = data.syncId ?? lastAppliedSyncId;

        // ігноруємо якщо щойно був апгрейд
        if (Date.now() < lastUpgradeTime + 1000) return;

        applyServerState(data);

        pendingClicks = Math.max(0, pendingClicks - clicksToSend);
        pendingPassiveCoins = Math.max(0, pendingPassiveCoins - passiveToSend);

        if (!upgradeLock) renderUI();
    })
    .catch(err => {
        pendingClicks += clicksToSend;
        pendingPassiveCoins -= passiveToSend;
        console.error("sync error", err);
    })
    .finally(() => {
        syncInProgress = false;
    });
}

async function syncSettings(){
    const body = new URLSearchParams({
        global_volume: parseFloat(soundSlider.value),
        soundtrack_volume: parseFloat(musicSlider.value)
    });

    return fetch("/api/settings/", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-CSRFToken": document.querySelector('meta[name="csrf-token"]').content
        },
        body: body
    })
}

function applyServerState(data) {

    if (data.coins !== undefined) {
        serverCoins = Math.floor(data.coins);
    }

    if (data.level !== undefined) {
        serverLevel = Number(data.level);
    }

    if (data.coins_per_second !== undefined) {
        displayedCoinsPerSecond = data.coins_per_second;
    }

    if (data.coins_per_click !== undefined) {
        displayedCoinsPerClick = data.coins_per_click;
    }
}

window.addEventListener("pagehide", () => {
    const data = new URLSearchParams({
        clicks: pendingClicks,
        passive: pendingPassiveCoins
    });
    data.append("csrfmiddlewaretoken", 
    document.querySelector('meta[name="csrf-token"]').content
    );

    navigator.sendBeacon("/api/click/", data);
});
/////////////////////////////////////////
function safeNumber(num, fallback = 0){
    const n = Number(num);
    return Number.isFinite(n) ? n : fallback;
}
/////////////////////////////////////////
const soundSlider = document.getElementById("soundVolume");
const musicSlider = document.getElementById("musicVolume");

const soundValue = document.getElementById("soundVolumeValue");
const musicValue = document.getElementById("musicVolumeValue");

soundSlider.addEventListener("input", () => {
    soundValue.innerText = `${soundSlider.value}%`;
    purchaseSound.volume = parseFloat(soundSlider.value / 100);
    clickSounds.forEach(sound => {
        sound.volume = parseFloat(soundSlider.value / 100);
    })
});

musicSlider.addEventListener("input", () => {
    musicValue.innerText = `${musicSlider.value}%`;
    soundtrack.volume = parseFloat(musicSlider.value / 100);
});

soundSlider.addEventListener("change", syncSettings);
musicSlider.addEventListener("change", syncSettings);
/////////////////////////////////////////
setInterval(syncClicks, 5000);
setInterval(addCoinsPerSecond, 100)

