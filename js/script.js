/* ========================================================
   PROJECT AYE AYE MADAM 🫡
   Version 0.8.0
   MOBILE-FIRST PETAL ENGINE
======================================================== */


/* ========================================================
   COUNTDOWN
======================================================== */

const unlockDate =
    new Date("January 16, 2027 00:00:00").getTime();

const dayBox =
    document.getElementById("days");

const hourBox =
    document.getElementById("hours");

const minuteBox =
    document.getElementById("minutes");

const secondBox =
    document.getElementById("seconds");


function animateNumber(element){

    if(!element) return;

    element.animate(
        [
            {
                opacity:.45,
                transform:"translateY(-3px) scale(.97)"
            },
            {
                opacity:1,
                transform:"translateY(0) scale(1)"
            }
        ],
        {
            duration:260,
            easing:"ease-out"
        }
    );

}


function updateCountdown(){

    const distance =
        unlockDate - Date.now();


    if(distance <= 0){

        clearInterval(countdownTimer);

        unlockWebsite();

        return;

    }


    const days =
        Math.floor(
            distance / 86400000
        );


    const hours =
        Math.floor(
            (distance % 86400000) /
            3600000
        );


    const minutes =
        Math.floor(
            (distance % 3600000) /
            60000
        );


    const seconds =
        Math.floor(
            (distance % 60000) /
            1000
        );


    const values = [

        [
            dayBox,
            String(days).padStart(3,"0")
        ],

        [
            hourBox,
            String(hours).padStart(2,"0")
        ],

        [
            minuteBox,
            String(minutes).padStart(2,"0")
        ],

        [
            secondBox,
            String(seconds).padStart(2,"0")
        ]

    ];


    values.forEach(
        ([element,value])=>{

            if(
                element &&
                element.textContent !== value
            ){

                element.textContent =
                    value;

                animateNumber(element);

            }

        }
    );

}


const countdownTimer =
    setInterval(
        updateCountdown,
        1000
    );


updateCountdown();


/* ========================================================
   LAYERS
======================================================== */

const petalLayer =
    document.getElementById(
        "petal-layer"
    );

const sparkleLayer =
    document.getElementById(
        "sparkle-layer"
    );


/* ========================================================
   DEVICE PERFORMANCE
======================================================== */

const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;


const reducedMotion =
    window.matchMedia &&
    window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;


const hardwareCores =
    navigator.hardwareConcurrency || 4;


const memory =
    navigator.deviceMemory || 4;


/*
   Detect whether this looks like
   a mobile device.
*/

const isMobile =
    /Android|iPhone|iPad|iPod/i.test(
        navigator.userAgent
    );


/*
   Very conservative performance
   classification.

   We deliberately don't assume that
   every modern phone is powerful.
*/

let performanceLevel =
    "mid";


if(
    memory >= 8 &&
    hardwareCores >= 8
){

    performanceLevel =
        "high";

}
else if(
    memory <= 3 ||
    hardwareCores <= 4
){

    performanceLevel =
        "low";

}


/*
   Mobile devices get a slightly
   more conservative profile.
*/

if(
    isMobile &&
    performanceLevel === "high"
){

    performanceLevel =
        "mid";

}


/* ========================================================
   PERFORMANCE PROFILE
======================================================== */

const PERFORMANCE = {

    high: {

        petals:10,

        physicsFPS:30,

        textureSize:20

    },

    mid: {

        petals:7,

        physicsFPS:30,

        textureSize:18

    },

    low: {

        petals:4,

        physicsFPS:24,

        textureSize:16

    }

};


let profile =
    PERFORMANCE[
        performanceLevel
    ];


/*
   Reduced motion means:
   keep a tiny number of petals
   or remove them completely.
*/

if(reducedMotion){

    profile = {

        petals:2,

        physicsFPS:18,

        textureSize:14

    };

}


/* ========================================================
   CANVAS
======================================================== */

let canvas = null;
let ctx = null;

let canvasWidth = 0;
let canvasHeight = 0;


/* ========================================================
   PETAL TEXTURE
======================================================== */

let petalTexture = null;


function createPetalTexture(){

    const size =
        profile.textureSize;


    const texture =
        document.createElement(
            "canvas"
        );


    texture.width =
        size;

    texture.height =
        size;


    const textureCtx =
        texture.getContext(
            "2d"
        );


    /*
       Extremely simple geometry.

       No gradients.
       No shadows.
       No blur.
    */

    textureCtx.beginPath();


    textureCtx.moveTo(
        size * .50,
        size * .08
    );


    textureCtx.quadraticCurveTo(

        size * .86,
        size * .28,

        size * .70,
        size * .68

    );


    textureCtx.quadraticCurveTo(

        size * .58,
        size * .90,

        size * .50,
        size * .94

    );


    textureCtx.quadraticCurveTo(

        size * .42,
        size * .90,

        size * .30,
        size * .68

    );


    textureCtx.quadraticCurveTo(

        size * .14,
        size * .28,

        size * .50,
        size * .08

    );


    textureCtx.closePath();


    textureCtx.fillStyle =
        "rgba(255,178,205,.82)";


    textureCtx.fill();


    petalTexture =
        texture;

}


/* ========================================================
   PHYSICS
======================================================== */

const PHYSICS = {

    petalCount:
        profile.petals,

    physicsFPS:
        profile.physicsFPS,

    gravity:10,

    initialFallSpeed:16,

    maxFallSpeed:58,

    wind:1.1,

    drift:2.5,

    airResistance:.996,

    deflection:16,

    bounce:.06

};


/* ========================================================
   PETALS
======================================================== */

const petals = [];

const surfaces = [];


/* ========================================================
   TIMING
======================================================== */

const PHYSICS_STEP =
    1 /
    PHYSICS.physicsFPS;


let accumulator =
    0;


let lastTime =
    performance.now();


/* ========================================================
   HELPERS
======================================================== */

function random(min,max){

    return (
        Math.random() *
        (max - min)
    ) + min;

}


/* ========================================================
   CANVAS SETUP
======================================================== */

function setupCanvas(){

    if(!petalLayer) return;


    petalLayer.innerHTML = "";


    canvas =
        document.createElement(
            "canvas"
        );


    canvas.id =
        "petal-canvas";


    petalLayer.appendChild(
        canvas
    );


    ctx =
        canvas.getContext(
            "2d"
        );


    createPetalTexture();

    resizeCanvas();

}


/* ========================================================
   RESIZE
======================================================== */

function resizeCanvas(){

    if(!canvas) return;


    canvasWidth =
        window.innerWidth;

    canvasHeight =
        window.innerHeight;


    /*
       1× rendering is intentional.

       This is one of the biggest
       mobile GPU savings.
    */

    canvas.width =
        canvasWidth;

    canvas.height =
        canvasHeight;


    canvas.style.width =
        canvasWidth + "px";

    canvas.style.height =
        canvasHeight + "px";


    updateSurfaceCache();

}


/* ========================================================
   SURFACE CACHE
======================================================== */

function updateSurfaceCache(){

    surfaces.length = 0;


    const elements =
        document.querySelectorAll(
            ".envelope, .hero-note"
        );


    for(
        let i = 0;
        i < elements.length;
        i++
    ){

        const rect =
            elements[i]
                .getBoundingClientRect();


        surfaces.push({

            element:
                elements[i],

            left:
                rect.left,

            right:
                rect.right,

            top:
                rect.top

        });

    }

}


/* ========================================================
   CREATE PETAL
======================================================== */

function createPetal(){

    const x =
        random(
            0,
            canvasWidth
        );


    const y =
        random(
            -canvasHeight,
            -20
        );


    const size =
        random(
            .75,
            1
        );


    petals.push({

        x,

        y,

        previousX:
            x,

        previousY:
            y,

        vx:
            random(
                -1.4,
                1.4
            ),

        vy:
            random(
                10,
                PHYSICS.initialFallSpeed
            ),

        width:
            14 * size,

        height:
            18 * size,

        rotation:
            random(
                0,
                Math.PI * 2
            ),

        previousRotation:
            0,

        spin:
            random(
                -.65,
                .65
            ),

        opacity:
            random(
                .48,
                .66
            ),

        age:
            random(
                0,
                10
            ),

        cooldown:0,

        lastSurface:null

    });

}


/* ========================================================
   INITIALIZE
======================================================== */

function initializePetals(){

    petals.length = 0;


    for(
        let i = 0;
        i < PHYSICS.petalCount;
        i++
    ){

        createPetal();

    }


    for(
        let i = 0;
        i < petals.length;
        i++
    ){

        petals[i].previousRotation =
            petals[i].rotation;

    }

}


/* ========================================================
   COLLISION
======================================================== */

function checkCollision(
    petal,
    previousY
){

    if(
        petal.vy <= 0
    ){

        return;

    }


    const previousBottom =
        previousY +
        petal.height * .5;


    const currentBottom =
        petal.y +
        petal.height * .5;


    for(
        let i = 0;
        i < surfaces.length;
        i++
    ){

        const surface =
            surfaces[i];


        if(
            petal.lastSurface ===
            surface.element
        ){

            continue;

        }


        /*
           Did the petal cross
           the top edge?
        */

        if(
            previousBottom >
            surface.top ||

            currentBottom <
            surface.top
        ){

            continue;

        }


        /*
           Horizontal collision.
        */

        if(
            petal.x <
            surface.left ||

            petal.x >
            surface.right
        ){

            continue;

        }


        const center =
            (
                surface.left +
                surface.right
            ) * .5;


        const direction =
            petal.x < center
                ? -1
                : 1;


        const halfWidth =
            Math.max(
                1,
                (
                    surface.right -
                    surface.left
                ) * .5
            );


        const offset =
            Math.min(
                1,
                Math.abs(
                    petal.x -
                    center
                ) /
                halfWidth
            );


        /*
           Soft sideways deflection.
        */

        petal.vx +=
            direction *
            PHYSICS.deflection *
            (
                .45 +
                offset * .25
            );


        /*
           Tiny bounce.
        */

        petal.vy =
            -Math.abs(
                petal.vy *
                PHYSICS.bounce
            );


        /*
           Place above surface.
        */

        petal.y =
            surface.top -
            petal.height * .5 -
            1;


        petal.spin +=
            direction *
            .18;


        petal.cooldown =
            .20;


        petal.lastSurface =
            surface.element;


        return;

    }

}


/* ========================================================
   UPDATE PETAL
======================================================== */

function updatePetal(
    petal,
    delta
){

    petal.previousX =
        petal.x;

    petal.previousY =
        petal.y;

    petal.previousRotation =
        petal.rotation;


    petal.age +=
        delta;


    if(
        petal.cooldown > 0
    ){

        petal.cooldown -=
            delta;

    }
    else{

        petal.lastSurface =
            null;

    }


    /*
       Very subtle wind.
    */

    petal.vx +=
        Math.sin(
            petal.age * .6
        ) *
        PHYSICS.wind *
        delta;


    /*
       Natural drift.
    */

    petal.vx +=
        Math.sin(
            petal.age * .8
        ) *
        PHYSICS.drift *
        delta *
        .02;


    /*
       Gravity.
    */

    petal.vy +=
        PHYSICS.gravity *
        delta;


    /*
       Damping.
    */

    petal.vx *=
        Math.pow(
            PHYSICS.airResistance,
            delta * 60
        );


    petal.vy =
        Math.min(
            petal.vy,
            PHYSICS.maxFallSpeed
        );


    /*
       Move.
    */

    petal.x +=
        petal.vx *
        delta;


    petal.y +=
        petal.vy *
        delta;


    petal.rotation +=
        petal.spin *
        delta;


    /*
       Collision.
    */

    if(
        petal.cooldown <= 0
    ){

        checkCollision(
            petal,
            petal.previousY
        );

    }


    /*
       Horizontal wrapping.
    */

    if(
        petal.x <
        -40
    ){

        petal.x =
            canvasWidth + 20;

        petal.previousX =
            petal.x;

    }


    if(
        petal.x >
        canvasWidth + 40
    ){

        petal.x =
            -20;

        petal.previousX =
            petal.x;

    }


    /*
       Recycle.
    */

    if(
        petal.y >
        canvasHeight + 40
    ){

        respawnPetal(
            petal
        );

    }

}


/* ========================================================
   RESPAWN
======================================================== */

function respawnPetal(
    petal
){

    const x =
        random(
            0,
            canvasWidth
        );


    const y =
        random(
            -100,
            -20
        );


    petal.x =
        x;

    petal.previousX =
        x;

    petal.y =
        y;

    petal.previousY =
        y;


    petal.vx =
        random(
            -1.4,
            1.4
        );


    petal.vy =
        random(
            10,
            PHYSICS.initialFallSpeed
        );


    petal.rotation =
        random(
            0,
            Math.PI * 2
        );


    petal.previousRotation =
        petal.rotation;


    petal.spin =
        random(
            -.65,
            .65
        );


    petal.age =
        random(
            0,
            5
        );


    petal.cooldown =
        0;


    petal.lastSurface =
        null;

}


/* ========================================================
   DRAW PETAL
======================================================== */

function drawPetal(
    petal,
    interpolation
){

    const x =
        petal.previousX +
        (
            petal.x -
            petal.previousX
        ) *
        interpolation;


    const y =
        petal.previousY +
        (
            petal.y -
            petal.previousY
        ) *
        interpolation;


    const rotation =
        petal.previousRotation +
        (
            petal.rotation -
            petal.previousRotation
        ) *
        interpolation;


    ctx.globalAlpha =
        petal.opacity;


    ctx.save();


    ctx.translate(
        x,
        y
    );


    ctx.rotate(
        rotation
    );


    /*
       Cached texture.
    */

    ctx.drawImage(

        petalTexture,

        -petal.width * .5,

        -petal.height * .5,

        petal.width,

        petal.height

    );


    ctx.restore();

}


/* ========================================================
   DRAW
======================================================== */

function drawPetals(
    interpolation
){

    if(
        !ctx ||
        !petalTexture
    ){

        return;

    }


    ctx.clearRect(
        0,
        0,
        canvasWidth,
        canvasHeight
    );


    ctx.globalAlpha =
        1;


    for(
        let i = 0;
        i < petals.length;
        i++
    ){

        drawPetal(
            petals[i],
            interpolation
        );

    }


    ctx.globalAlpha =
        1;

}


/* ========================================================
   ANIMATION LOOP
======================================================== */

function petalLoop(
    currentTime
){

    const elapsed =
        Math.min(
            (
                currentTime -
                lastTime
            ) / 1000,
            .10
        );


    lastTime =
        currentTime;


    accumulator +=
        elapsed;


    /*
       Fixed physics.

       Rendering continues at the
       device's native refresh rate.
    */

    while(
        accumulator >=
        PHYSICS_STEP
    ){

        for(
            let i = 0;
            i < petals.length;
            i++
        ){

            updatePetal(
                petals[i],
                PHYSICS_STEP
            );

        }


        accumulator -=
            PHYSICS_STEP;

    }


    const interpolation =
        accumulator /
        PHYSICS_STEP;


    drawPetals(
        interpolation
    );


    requestAnimationFrame(
        petalLoop
    );

}


/* ========================================================
   SPARKLES
======================================================== */

function createSparkles(){

    /*
       Disabled intentionally.

       Petals are the only atmospheric
       particle effect for now.
    */

    if(!sparkleLayer) return;

    sparkleLayer.innerHTML = "";

}


/* ========================================================
   RESIZE
======================================================== */

window.addEventListener(
    "resize",
    ()=>{
        resizeCanvas();
    }
);


/* ========================================================
   LOADER
======================================================== */

const loadingMessages = [

    "🌸 Preparing birthday surprise...",

    "💌 Writing your letter...",

    "✨ Decorating memories...",

    "🎁 Wrapping happiness...",

    "🫡 Mission Ready!"

];


function startLoader(){

    const loader =
        document.getElementById(
            "loader"
        );

    const hero =
        document.getElementById(
            "hero"
        );

    const progressBar =
        document.querySelector(
            ".progress-bar"
        );

    const loadingMessage =
        document.getElementById(
            "loadingMessage"
        );


    if(!loader) return;


    loader.style.display =
        "flex";


    let progress = 0;

    let messageIndex = 0;


    const loading =
        setInterval(

            ()=>{

                progress++;


                if(progressBar){

                    progressBar.style.width =
                        progress + "%";

                }


                if(

                    progress % 20 === 0 &&

                    messageIndex <
                    loadingMessages.length

                ){

                    loadingMessage.textContent =
                        loadingMessages[
                            messageIndex
                        ];

                    messageIndex++;

                }


                if(progress >= 100){

                    clearInterval(
                        loading
                    );


                    setTimeout(
                        ()=>{

                            loader.style.display =
                                "none";


                            if(hero){

                                hero.style.display =
                                    "flex";

                            }


                            document.body.style
                                .overflow =
                                "auto";

                        },

                        500
                    );

                }

            },

            35

        );

}


/* ========================================================
   UNLOCK
======================================================== */

function unlockWebsite(){

    const screen =
        document.getElementById(
            "countdown-screen"
        );


    if(!screen){

        startLoader();

        return;

    }


    screen.style.transition =
        "opacity .8s ease";


    screen.style.opacity =
        "0";


    setTimeout(
        ()=>{

            screen.style.display =
                "none";


            startLoader();

        },

        800
    );

}


/* ========================================================
   INITIALIZE
======================================================== */

window.addEventListener(
    "load",
    ()=>{

        setupCanvas();

        updateSurfaceCache();

        initializePetals();

        createSparkles();


        lastTime =
            performance.now();

        accumulator =
            0;


        requestAnimationFrame(
            petalLoop
        );

    }
);
