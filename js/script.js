/* ========================================================
   PROJECT AYE AYE MADAM 🫡
   Version 0.6.2
   OPTIMIZED PETAL PHYSICS
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
   OPTIMIZED PHYSICS SETTINGS
======================================================== */

const PHYSICS = {

    /*
       Fewer petals = smoother mobile performance.
    */

    petalCount:10,

    gravity:13,

    fallSpeed:22,

    maxFallSpeed:72,

    wind:2.2,

    drift:7,

    airResistance:.992,

    /*
       How strongly a surface pushes
       the petal sideways.
    */

    deflection:28,

    /*
       Tiny upward response.
    */

    bounce:.12,

    /*
       Prevents a petal from immediately
       colliding with the same surface again.
    */

    collisionCooldown:.18

};


/* ========================================================
   PETALS
======================================================== */

const petals = [];


/* ========================================================
   COLLISION SURFACES
======================================================== */

const surfaces = [];


/* ========================================================
   RANDOM
======================================================== */

function random(min,max){

    return (
        Math.random() *
        (max - min)
    ) + min;

}


/* ========================================================
   BUILD SURFACE CACHE
======================================================== */

function updateSurfaceCache(){

    surfaces.length = 0;


    const elements =
        document.querySelectorAll(
            ".envelope, .hero-note"
        );


    elements.forEach(
        element=>{

            const rect =
                element.getBoundingClientRect();


            surfaces.push({

                element,

                left:
                    rect.left - 3,

                right:
                    rect.right + 3,

                top:
                    rect.top - 3,

                bottom:
                    rect.bottom + 3

            });

        }
    );

}


/* ========================================================
   CREATE PETAL ELEMENT
======================================================== */

function createPetalElement(){

    const element =
        document.createElement("div");


    element.className =
        "petal";


    /*
       JavaScript controls the complete
       position of the petal.
    */

    element.style.top = "0";
    element.style.left = "0";


    petalLayer.appendChild(
        element
    );


    return element;

}


/* ========================================================
   CREATE PETAL
======================================================== */

function createPetal(){

    const element =
        createPetalElement();


    const petal = {

        element,

        x:
            random(
                0,
                window.innerWidth
            ),

        y:
            random(
                -window.innerHeight,
                -20
            ),

        vx:
            random(-2.5,2.5),

        vy:
            random(
                14,
                PHYSICS.fallSpeed
            ),

        width:
            random(10,16),

        height:
            random(14,22),

        rotation:
            random(0,360),

        spin:
            random(-22,22),

        opacity:
            random(.48,.70),

        age:
            random(0,8),

        cooldown:0,

        /*
           Prevents the same surface from
           immediately catching the petal again.
        */

        lastSurface:null

    };


    element.style.width =
        petal.width + "px";

    element.style.height =
        petal.height + "px";

    element.style.opacity =
        petal.opacity;


    renderPetal(
        petal
    );


    petals.push(
        petal
    );

}


/* ========================================================
   RENDER
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
   INITIALIZE
======================================================== */

function initializePetals(){

    for(
        let i = 0;
        i < PHYSICS.petalCount;
        i++
    ){

        createPetal();

    }

}


/* ========================================================
   COLLISION
======================================================== */

function checkCollision(
    petal,
    previousX,
    previousY
){

    /*
       Only petals travelling downward
       can hit the top of our surfaces.
    */

    if(
        petal.vy <= 0
    ){

        return;

    }


    /*
       Approximate petal bottom.
       This is dramatically cheaper than
       creating DOM rectangles every frame.
    */

    const previousBottom =
        previousY +
        petal.height / 2;


    const currentBottom =
        petal.y +
        petal.height / 2;


    for(
        let i = 0;
        i < surfaces.length;
        i++
    ){

        const surface =
            surfaces[i];


        /*
           Skip the surface that just
           deflected this petal.
        */

        if(
            petal.lastSurface ===
            surface.element
        ){

            continue;

        }


        /*
           Has the petal crossed the
           surface's top edge?
        */

        const crossedTop =

            previousBottom <=
                surface.top &&

            currentBottom >=
                surface.top;


        if(!crossedTop){

            continue;

        }


        /*
           Is the petal horizontally
           above the surface?
        */

        if(
            petal.x <
                surface.left ||

            petal.x >
                surface.right

        ){

            continue;

        }


        /*
           COLLISION FOUND.
        */


        const center =
            (
                surface.left +
                surface.right
            ) / 2;


        let direction;


        /*
           Push away from the part
           of the surface that was hit.
        */

        if(
            petal.x < center
        ){

            direction = -1;

        }
        else if(
            petal.x > center
        ){

            direction = 1;

        }
        else{

            direction =
                Math.random() > .5
                    ? 1
                    : -1;

        }


        /*
           Distance from center gives
           slightly stronger edge deflection.
        */

        const halfWidth =
            (
                surface.right -
                surface.left
            ) / 2;


        const offset =
            Math.abs(
                petal.x - center
            ) /
            halfWidth;


        const push =
            PHYSICS.deflection *
            (
                .72 +
                offset * .55
            );


        /*
           SIDEWAYS DEFLECTION
        */

        petal.vx +=
            direction * push;


        /*
           Small upward reaction.
        */

        petal.vy =
            -Math.abs(
                petal.vy *
                PHYSICS.bounce
            );


        /*
           Place petal just above
           the surface.

           This is critical:
           it prevents it from being
           rendered INSIDE the envelope.
        */

        petal.y =
            surface.top -
            petal.height / 2 -
            1;


        /*
           Give the petal a little
           rotational reaction.
        */

        petal.spin +=
            direction *
            random(7,16);


        /*
           Collision cooldown.
        */

        petal.cooldown =
            PHYSICS.collisionCooldown;


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
       Gentle wind.
    */

    petal.vx +=

        Math.sin(
            petal.age *
            .65
        ) *

        PHYSICS.wind *

        delta;


    /*
       Natural sideways drift.
    */

    petal.vx +=

        Math.sin(
            petal.age *
            .9
        ) *

        PHYSICS.drift *

        delta *
        .025;


    /*
       Gravity.
    */

    petal.vy +=
        PHYSICS.gravity *
        delta;


    /*
       Air resistance.
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
       Save previous position.
    */

    const previousX =
        petal.x;

    const previousY =
        petal.y;


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
       Rotate.
    */

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
            previousX,
            previousY
        );

    }


    /*
       Horizontal wrap.
    */

    if(
        petal.x < -40
    ){

        petal.x =
            window.innerWidth + 30;

    }


    if(
        petal.x >
        window.innerWidth + 40
    ){

        petal.x = -30;

    }


    /*
       Recycle after leaving
       bottom of screen.
    */

    if(
        petal.y >
        window.innerHeight + 50
    ){

        respawnPetal(
            petal
        );

    }


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
            -80,
            -20
        );


    petal.vx =
        random(-2.5,2.5);


    petal.vy =
        random(
            14,
            PHYSICS.fallSpeed
        );


    petal.rotation =
        random(0,360);


    petal.spin =
        random(-22,22);


    petal.age =
        random(0,5);


    petal.cooldown =
        0;


    petal.lastSurface =
        null;

}


/* ========================================================
   PHYSICS LOOP
======================================================== */

let lastTime =
    performance.now();


function physicsLoop(
    currentTime
){

    const delta =
        Math.min(
            (
                currentTime -
                lastTime
            ) / 1000,

            .033
        );


    lastTime =
        currentTime;


    /*
       Cache ALL collision rectangles
       only once per frame.

       This is the major performance fix.
    */

    updateSurfaceCache();


    for(
        let i = 0;
        i < petals.length;
        i++
    ){

        updatePetal(
            petals[i],
            delta
        );

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
        22;


    for(
        let i = 0;
        i < count;
        i++
    ){

        const sparkle =
            document.createElement(
                "span"
            );


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
            random(3,6) + "s"
        );


        sparkle.style.animationDelay =
            random(0,5) + "s";


        sparkleLayer.appendChild(
            sparkle
        );

    }

}


/* ========================================================
   RESIZE
======================================================== */

window.addEventListener(
    "resize",
    ()=>{
        updateSurfaceCache();
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

        /*
           Build collision geometry
           before the first frame.
        */

        updateSurfaceCache();

        createSparkles();

        initializePetals();

        requestAnimationFrame(
            physicsLoop
        );

    }
);
