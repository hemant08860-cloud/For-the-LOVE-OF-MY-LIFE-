/* ========================================================
   PROJECT AYE AYE MADAM 🫡
   Version 0.9.0
   MOBILE-FIRST PERFORMANCE ENGINE
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
   DEVICE DETECTION
======================================================== */

const userAgent =
    navigator.userAgent || "";


const isMobile =
    /Android|iPhone|iPad|iPod/i.test(
        userAgent
    );


const isRedmi =
    /Redmi|Miui|Xiaomi/i.test(
        userAgent
    );


const cores =
    navigator.hardwareConcurrency || 4;


const memory =
    navigator.deviceMemory || 4;


/*
   Respect the user's accessibility
   preference.
*/

const reducedMotion =
    window.matchMedia &&
    window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;


/* ========================================================
   PERFORMANCE PROFILE
======================================================== */

let MOBILE_MODE =
    isMobile;


/*
   Redmi is explicitly treated as
   mobile-performance mode.

   This isn't because every Redmi is slow.
   It's simply our chosen baseline device.
*/

if(isRedmi){

    MOBILE_MODE = true;

}


/* ========================================================
   PETAL SETTINGS
======================================================== */

const PERFORMANCE = {

    desktop: {

        petals:9,

        physicsFPS:60,

        textureSize:20,

        rotation:true,

        interpolation:true

    },


    mobile: {

        petals:5,

        physicsFPS:60,

        textureSize:10,

        rotation:false,

        interpolation:false

    },


    low: {

        petals:3,

        physicsFPS:20,

        textureSize:8,

        rotation:false,

        interpolation:false

    }

};


let profile;


/*
   Choose mobile profile.
*/

if(MOBILE_MODE){

    profile =
        PERFORMANCE.mobile;


    /*
       Very conservative fallback
       for weaker hardware.
    */

    if(
        cores <= 4 &&
        memory <= 6
    ){

        profile =
            PERFORMANCE.low;

    }

}
else{

    profile =
        PERFORMANCE.desktop;

}


/*
   Reduced motion.
*/

if(reducedMotion){

    profile = {

        petals:2,

        physicsFPS:15,

        textureSize:12,

        rotation:false,

        interpolation:false

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
       Extremely cheap silhouette.
    */

    textureCtx.beginPath();


    textureCtx.moveTo(
        size * .50,
        size * .08
    );


    textureCtx.quadraticCurveTo(

        size * .84,
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

        size * .16,
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

    gravity:
        MOBILE_MODE
            ? 9
            : 11,

    initialFallSpeed:
        MOBILE_MODE
            ? 15
            : 18,

    maxFallSpeed:
        MOBILE_MODE
            ? 52
            : 62,

    wind:
        MOBILE_MODE
            ? .8
            : 1.4,

    drift:
        MOBILE_MODE
            ? 1.8
            : 3.5,

    airResistance:
        .997,

    deflection:
        MOBILE_MODE
            ? 13
            : 19,

    bounce:
        MOBILE_MODE
            ? .04
            : .08

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
       1× rendering.

       Never render a full retina-sized
       particle canvas on mobile.
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
                -1.2,
                1.2
            ),

        vy:
            random(
                9,
                PHYSICS.initialFallSpeed
            ),

        width:
            13 * size,

        height:
            17 * size,

        rotation:
            random(
                0,
                Math.PI * 2
            ),

        previousRotation:
            0,

        spin:
            random(
                -.55,
                .55
            ),

        opacity:
            random(
                .48,
                .65
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
           Top-edge crossing.
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


        /*
           Simple deflection.

           No expensive calculations on
           mobile.
        */

        petal.vx +=
            direction *
            PHYSICS.deflection;


        petal.vy =
            -Math.abs(
                petal.vy *
                PHYSICS.bounce
            );


        petal.y =
            surface.top -
            petal.height * .5 -
            1;


        if(
            profile.rotation
        ){

            petal.spin +=
                direction *
                .15;

        }


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


    if(
        profile.rotation
    ){

        petal.previousRotation =
            petal.rotation;

    }


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
       Gravity.
    */

    petal.vy +=
        PHYSICS.gravity *
        delta;


    /*
       Horizontal damping.
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


    /*
       Rotation is completely skipped
       on mobile.
    */

    if(
        profile.rotation
    ){

        petal.rotation +=
            petal.spin *
            delta;

    }


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
       Horizontal wrap.
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
            -1.2,
            1.2
        );


    petal.vy =
        random(
            9,
            PHYSICS.initialFallSpeed
        );


    if(
        profile.rotation
    ){

        petal.rotation =
            random(
                0,
                Math.PI * 2
            );

        petal.previousRotation =
            petal.rotation;

    }


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

    let x;
    let y;


    /*
       Mobile:
       use direct physics position.

       Desktop:
       use interpolation.
    */

    if(
        profile.interpolation
    ){

        x =
            petal.previousX +
            (
                petal.x -
                petal.previousX
            ) *
            interpolation;


        y =
            petal.previousY +
            (
                petal.y -
                petal.previousY
            ) *
            interpolation;

    }
    else{

        x =
            petal.x;

        y =
            petal.y;

    }


    ctx.globalAlpha =
        petal.opacity;


    /*
       Mobile gets ZERO rotation.

       This allows the browser to do
       extremely cheap bitmap drawing.
    */

    if(
        profile.rotation
    ){

        const rotation =
            petal.previousRotation +
            (
                petal.rotation -
                petal.previousRotation
            ) *
            interpolation;


        ctx.save();


        ctx.translate(
            x,
            y
        );


        ctx.rotate(
            rotation
        );


        ctx.drawImage(

            petalTexture,

            -petal.width * .5,

            -petal.height * .5,

            petal.width,

            petal.height

        );


        ctx.restore();

    }
    else{

        /*
           Fastest possible path.
        */

        ctx.drawImage(

            petalTexture,

            x -
                petal.width * .5,

            y -
                petal.height * .5,

            petal.width,

            petal.height

        );

    }

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
       Physics runs at the device's
       selected performance rate.
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
       Completely disabled.

       The petal system is our only
       particle effect.
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


        lastTime =
            performance.now();

        accumulator =
            0;


        createSparkles();


        requestAnimationFrame(
            petalLoop
        );

    }
);
