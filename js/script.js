/* ========================================================
   PROJECT AYE AYE MADAM 🫡
   Version 0.6.1
   NATURAL PETAL PHYSICS
======================================================== */


/* ========================================================
   UNLOCK DATE
======================================================== */

const unlockDate =
    new Date("January 16, 2027 00:00:00").getTime();


/* ========================================================
   COUNTDOWN ELEMENTS
======================================================== */

const dayBox =
    document.getElementById("days");

const hourBox =
    document.getElementById("hours");

const minuteBox =
    document.getElementById("minutes");

const secondBox =
    document.getElementById("seconds");


/* ========================================================
   COUNTDOWN ANIMATION
======================================================== */

function animateNumber(element){

    if(!element) return;

    element.animate(

        [
            {
                opacity:.45,
                transform:
                    "translateY(-4px) scale(.96)"
            },

            {
                opacity:1,
                transform:
                    "translateY(0) scale(1)"
            }

        ],

        {
            duration:320,
            easing:"cubic-bezier(.2,.8,.2,1)"
        }

    );

}


function pulseSeconds(){

    const box =
        secondBox?.closest(".time-box");

    if(!box) return;

    box.animate(

        [
            {
                transform:"scale(1)"
            },

            {
                transform:"scale(1.018)"
            },

            {
                transform:"scale(1)"
            }

        ],

        {
            duration:420,
            easing:"ease-out"
        }

    );

}


/* ========================================================
   COUNTDOWN
======================================================== */

function updateCountdown(){

    const now =
        Date.now();

    const distance =
        unlockDate - now;


    if(distance <= 0){

        clearInterval(countdownTimer);

        unlockWebsite();

        return;

    }


    const days =
        Math.floor(
            distance /
            86400000
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


    pulseSeconds();

}


const countdownTimer =
    setInterval(
        updateCountdown,
        1000
    );


updateCountdown();


/* ========================================================
   PARTICLE LAYERS
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
   PHYSICS SETTINGS
======================================================== */

const PHYSICS = {

    gravity:18,

    windStrength:4.5,

    airResistance:.987,

    fallingSpeed:26,

    maxFallSpeed:92,

    sidewaysDrift:11,

    topDeflection:25,

    bounce:.10,

    slide:.88,

    collisionPadding:2,

    spawnCount:14

};


/* ========================================================
   PETAL COLLECTION
======================================================== */

const petals = [];


/* ========================================================
   HELPERS
======================================================== */

function random(min,max){

    return (
        Math.random() *
        (max - min)
    ) + min;

}


function clamp(
    value,
    min,
    max
){

    return Math.max(
        min,
        Math.min(max,value)
    );

}


/* ========================================================
   CREATE PETAL
======================================================== */

function createPetalElement(){

    const element =
        document.createElement("div");

    element.className =
        "petal";

    /*
       IMPORTANT:
       JS owns the position now.
       This prevents CSS top/left from
       fighting the physics engine.
    */

    element.style.top =
        "0";

    element.style.left =
        "0";

    petalLayer.appendChild(
        element
    );

    return element;

}


/* ========================================================
   CREATE PETAL OBJECT
======================================================== */

function createPetal(){

    const width =
        random(11,18);

    const height =
        random(15,25);


    const petal = {

        element:
            createPetalElement(),

        x:
            random(
                0,
                window.innerWidth
            ),

        y:
            random(
                -window.innerHeight,
                -30
            ),

        vx:
            random(-3,3),

        vy:
            random(
                15,
                PHYSICS.fallingSpeed
            ),

        width,

        height,

        rotation:
            random(0,360),

        spin:
            random(-30,30),

        opacity:
            random(.48,.72),

        age:
            random(0,10),

        hitCooldown:0,

        driftSeed:
            random(
                0,
                Math.PI * 2
            ),

        lastCollision:null

    };


    petal.element.style.width =
        width + "px";

    petal.element.style.height =
        height + "px";

    petal.element.style.opacity =
        petal.opacity;


    renderPetal(
        petal
    );


    petals.push(
        petal
    );

}


/* ========================================================
   RENDER PETAL
======================================================== */

function renderPetal(petal){

    petal.element.style.transform =

        `translate3d(
            ${petal.x}px,
            ${petal.y}px,
            0
        )
        rotate(${petal.rotation}deg)`;

}


/* ========================================================
   INITIALIZE PETALS
======================================================== */

function initializePetals(){

    for(
        let i = 0;
        i < PHYSICS.spawnCount;
        i++
    ){

        createPetal();

    }

}


/* ========================================================
   GET SOLID SURFACES
======================================================== */

function getSurfaces(){

    return [

        ...document.querySelectorAll(
            ".envelope"
        ),

        ...document.querySelectorAll(
            ".hero-note"
        )

    ];

}


/* ========================================================
   RECTANGLE
======================================================== */

function getRect(element){

    const rect =
        element.getBoundingClientRect();


    return {

        left:rect.left,

        right:rect.right,

        top:rect.top,

        bottom:rect.bottom

    };

}


/* ========================================================
   PETAL RECTANGLE
======================================================== */

function getPetalRect(petal){

    const halfWidth =
        petal.width / 2;

    const halfHeight =
        petal.height / 2;


    return {

        left:
            petal.x -
            halfWidth,

        right:
            petal.x +
            halfWidth,

        top:
            petal.y -
            halfHeight,

        bottom:
            petal.y +
            halfHeight

    };

}


/* ========================================================
   COLLISION TEST
======================================================== */

function isInsideHorizontalRange(
    petalRect,
    surface
){

    return (

        petalRect.right >
            surface.left &&

        petalRect.left <
            surface.right

    );

}


/* ========================================================
   TOP COLLISION
======================================================== */

function hitsTop(
    previous,
    current,
    surface
){

    return (

        previous.bottom <=
            surface.top +

            PHYSICS.collisionPadding +

            2 &&

        current.bottom >=
            surface.top &&

        current.bottom <=
            surface.top + 14 &&

        isInsideHorizontalRange(
            current,
            surface
        )

    );

}


/* ========================================================
   SIDE COLLISION
======================================================== */

function hitsSide(
    previous,
    current,
    surface
){

    const verticalOverlap =

        current.bottom >
            surface.top &&

        current.top <
            surface.bottom;


    if(!verticalOverlap){

        return null;

    }


    if(

        previous.right <=
            surface.left &&

        current.right >=
            surface.left

    ){

        return "left";

    }


    if(

        previous.left >=
            surface.right &&

        current.left <=
            surface.right

    ){

        return "right";

    }


    return null;

}


/* ========================================================
   FIND COLLISION
======================================================== */

function findCollision(
    petal,
    previous,
    current
){

    if(
        petal.hitCooldown > 0
    ){

        return null;

    }


    const surfaces =
        getSurfaces();


    for(
        const element
        of surfaces
    ){

        const surface =
            getRect(element);


        /*
           TOP OF SURFACE
        */

        if(
            hitsTop(
                previous,
                current,
                surface
            )
        ){

            return {

                surface,

                element,

                side:"top"

            };

        }


        /*
           SIDES
        */

        const side =
            hitsSide(
                previous,
                current,
                surface
            );


        if(side){

            return {

                surface,

                element,

                side

            };

        }

    }


    return null;

}


/* ========================================================
   DEFLECT PETAL
======================================================== */

function deflectPetal(
    petal,
    collision
){

    const {
        surface,
        side
    } = collision;


    /* ====================================================
       TOP OF PAPER
    ==================================================== */

    if(side === "top"){

        const center =
            (
                surface.left +
                surface.right
            ) / 2;


        const distance =
            petal.x -
            center;


        /*
           The further from the center,
           the stronger the outward deflection.
        */

        const normalized =
            clamp(
                distance /
                (
                    (
                        surface.right -
                        surface.left
                    ) / 2
                ),

                -1,
                1
            );


        /*
           If the petal hits almost exactly
           in the middle, give it a tiny
           random preference.

           This avoids perfectly vertical
           bouncing.
        */

        let direction;

        if(
            Math.abs(normalized) < .08
        ){

            direction =
                Math.random() > .5
                    ? 1
                    : -1;

        }
        else{

            direction =
                normalized > 0
                    ? 1
                    : -1;

        }


        /*
           SIDEWAYS DEFLECTION
        */

        petal.vx +=

            direction *

            (
                PHYSICS.topDeflection *

                (
                    .65 +
                    Math.abs(normalized) *
                    .55
                )
            );


        /*
           Very small upward response.
        */

        petal.vy *=
            -PHYSICS.bounce;


        /*
           Surface sliding.
        */

        petal.vx *=
            PHYSICS.slide;


        /*
           Place it directly above
           the surface.
        */

        petal.y =
            surface.top -
            petal.height / 2 -
            PHYSICS.collisionPadding;


        /*
           Rotate in the direction of
           deflection.
        */

        petal.spin +=
            direction *
            random(8,18);

    }


    /* ====================================================
       LEFT SIDE
    ==================================================== */

    else if(side === "left"){

        petal.x =
            surface.left -
            petal.width / 2 -
            PHYSICS.collisionPadding;


        petal.vx =
            -Math.abs(
                petal.vx
            ) *
            .25;


        petal.vy +=
            random(4,10);

    }


    /* ====================================================
       RIGHT SIDE
    ==================================================== */

    else if(side === "right"){

        petal.x =
            surface.right +
            petal.width / 2 +
            PHYSICS.collisionPadding;


        petal.vx =
            Math.abs(
                petal.vx
            ) *
            .25;


        petal.vy +=
            random(4,10);

    }


    /*
       Prevent immediate re-collision.
    */

    petal.hitCooldown =
        .16;


    petal.lastCollision =
        collision.element;

}


/* ========================================================
   UPDATE PETAL
======================================================== */

function updatePetal(
    petal,
    delta
){

    petal.age +=
        delta;


    if(
        petal.hitCooldown > 0
    ){

        petal.hitCooldown -=
            delta;

    }


    /*
       NATURAL WIND
    */

    const wind =
        Math.sin(
            petal.age * .65 +
            petal.driftSeed
        ) *
        PHYSICS.windStrength;


    petal.vx +=
        wind *
        delta *
        .08;


    /*
       GRAVITY
    */

    petal.vy +=
        PHYSICS.gravity *
        delta;


    /*
       Gentle lateral drift
    */

    petal.vx +=

        Math.sin(
            petal.age * .9 +
            petal.driftSeed
        ) *

        PHYSICS.sidewaysDrift *

        delta *

        .035;


    /*
       AIR RESISTANCE
    */

    petal.vx *=
        Math.pow(
            PHYSICS.airResistance,
            delta * 60
        );


    petal.vy =
        clamp(
            petal.vy,
            -20,
            PHYSICS.maxFallSpeed
        );


    /*
       PREVIOUS POSITION
    */

    const previous =
        getPetalRect(
            petal
        );


    /*
       MOVE
    */

    petal.x +=
        petal.vx *
        delta;


    petal.y +=
        petal.vy *
        delta;


    /*
       ROTATION
    */

    petal.rotation +=
        petal.spin *
        delta;


    /*
       CURRENT POSITION
    */

    const current =
        getPetalRect(
            petal
        );


    /*
       COLLISION
    */

    const collision =
        findCollision(
            petal,
            previous,
            current
        );


    if(collision){

        deflectPetal(
            petal,
            collision
        );

    }


    /*
       SCREEN WRAP HORIZONTALLY

       This prevents petals from getting
       permanently lost off the side.
    */

    if(
        petal.x <
        -60
    ){

        petal.x =
            window.innerWidth + 30;

    }


    if(
        petal.x >
        window.innerWidth + 60
    ){

        petal.x =
            -30;

    }


    /*
       RENDER
    */

    renderPetal(
        petal
    );

}


/* ========================================================
   RESPAWN
======================================================== */

function respawnPetal(
    petal
){

    petal.x =
        random(
            0,
            window.innerWidth
        );


    petal.y =
        random(
            -90,
            -25
        );


    petal.vx =
        random(-3,3);


    petal.vy =
        random(
            15,
            PHYSICS.fallingSpeed
        );


    petal.rotation =
        random(0,360);


    petal.spin =
        random(-30,30);


    petal.age =
        random(0,5);


    petal.hitCooldown =
        0;


    petal.lastCollision =
        null;


    renderPetal(
        petal
    );

}


/* ========================================================
   PHYSICS LOOP
======================================================== */

let lastFrame =
    performance.now();


function physicsLoop(
    currentTime
){

    const delta =
        Math.min(
            (
                currentTime -
                lastFrame
            ) / 1000,

            .035
        );


    lastFrame =
        currentTime;


    for(
        const petal
        of petals
    ){

        updatePetal(
            petal,
            delta
        );


        if(
            petal.y >
            window.innerHeight + 80
        ){

            respawnPetal(
                petal
            );

        }

    }


    requestAnimationFrame(
        physicsLoop
    );

}


/* ========================================================
   SPARKLES
======================================================== */

function createSparkles(){

    const count =
        30;


    for(
        let i = 0;
        i < count;
        i++
    ){

        const sparkle =
            document.createElement("span");


        sparkle.className =
            "sparkle";


        sparkle.style.left =
            random(0,100) +
            "vw";


        sparkle.style.top =
            random(0,100) +
            "vh";


        sparkle.style.setProperty(

            "--duration",

            random(2.5,6) +
            "s"

        );


        sparkle.style.animationDelay =
            random(0,5) +
            "s";


        sparkleLayer.appendChild(
            sparkle
        );

    }

}


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
   UNLOCK WEBSITE
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
   INITIALIZATION
======================================================== */

window.addEventListener(

    "load",

    ()=>{

        createSparkles();

        initializePetals();

        requestAnimationFrame(
            physicsLoop
        );

    }

);
