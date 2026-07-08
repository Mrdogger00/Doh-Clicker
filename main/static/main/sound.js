const purchaseSound = new Audio('/static/main/sound/purchase_button.ogg');
purchaseSound.preload = "auto";
purchaseSound.load();


const soundtrack = new Audio('/static/main/sound/boba_tea.mp3');

soundtrack.loop = true;

window.addEventListener("click", function startMusic() {
    soundtrack.play();
    document.removeEventListener("click", startMusic);
});





const clickSounds =  []

for(let i = 1; i <= 3; i++){
    const sound = new Audio(`/static/main/sound/dog_bark_${i}.ogg`);
    sound.preload = "auto";
    sound.load();
    clickSounds.push(sound);
}

let currentClickSound = null;
let lastPlayedClick = 0;

function playClickSound(){
    const now = performance.now();

    if(currentClickSound && (now - lastPlayedClick) >= 400){
        currentClickSound.pause();
        currentClickSound.currentTime = 0.1;
    }

    currentClickSound = clickSounds[
        Math.floor(Math.random() * clickSounds.length)
    ];

    currentClickSound.currentTime = 0;
    currentClickSound.volume = Number(soundSlider.value) / 100;
    currentClickSound.play();

    lastPlayedClick = now;
}

let lastPlayedPurchase = 0;

function playPurchaseSound(){
    const now = performance.now();

    if ((now - lastPlayedPurchase) >= 0){
        purchaseSound.pause();
        purchaseSound.currentTime = 0.1;
    }

    purchaseSound.play();
    //console.log("sound", performance.now());
    lastPlayedPurchase = now;
}

