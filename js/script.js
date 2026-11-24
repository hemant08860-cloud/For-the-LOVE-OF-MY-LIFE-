/* ==========================================================================
   PROJECT AYE AYE MADAM 🫡 — THE ENCHANTED KEEPSAKE
   Unified Presentation Engine, Preserved Countdown & 60fps Petal Canvas
   ========================================================================== */

(() => {
    "use strict";

    /* ======================================================================
       1. CONFIGURATION & SHARED ENVIRONMENT
       ====================================================================== */

    // Preserved birthday unlock date in local device time
    const UNLOCK_DATE = new Date("January 16, 2027 00:00:00").getTime();

    const reducedMotionQuery =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReducedMotion = () =>
        Boolean(reducedMotionQuery && reducedMotionQuery.matches);

    const isMobileDevice =
        /Android|iPhone|iPad|iPod|Redmi|Miui|Xiaomi/i.test(navigator.userAgent || "") ||
        window.innerWidth <= 600;

    /* ======================================================================
       2. OPTIONAL SOFT SOUND DESIGN (MUTED BY DEFAULT — NEVER AUTOPLAYS)
       ====================================================================== */

    let soundEnabled = false;
    let audioCtx = null;

    function getAudioContext() {
        if (!soundEnabled) return null;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        if (!audioCtx) audioCtx = new AudioCtx();
        if (audioCtx.state === "suspended") {
            audioCtx.resume().catch(() => {});
        }
        return audioCtx;
    }

    function playChime(freqStart = 523.25, freqEnd = 659.25, duration = 0.28) {
        const ctx = getAudioContext();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freqStart, now);
            osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.05, now + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + duration + 0.02);
        } catch (_) {
            // Silently ignore browser audio restrictions
        }
    }

    function playPaperWhisper() {
        const ctx = getAudioContext();
        if (!ctx) return;
        try {
            const duration = 0.22;
            const bufferSize = Math.floor(ctx.sampleRate * duration);
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.value = 1350;
            filter.Q.value = 0.85;

            const gain = ctx.createGain();
            const now = ctx.currentTime;
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.032, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start(now);
            noise.stop(now + duration + 0.02);
        } catch (_) {
            // Silently ignore browser audio restrictions
        }
    }

    function initSoundToggle() {
        const btn = document.getElementById("sound-toggle");
        if (!btn) return;
        btn.addEventListener("click", () => {
            soundEnabled = !soundEnabled;
            btn.setAttribute("aria-pressed", String(soundEnabled));
            if (soundEnabled) {
                playChime(587.33, 783.99, 0.24);
            }
        });
    }

    /* ======================================================================
       3. PRESERVED 60FPS CANVAS PETAL ENGINE (HIDPI CRISP + AUTO-PAUSE)
       ====================================================================== */

    const PetalEngine = (() => {
        const PETAL_COUNT = prefersReducedMotion() ? 0 : isMobileDevice ? 6 : 10;
        let canvas = null;
        let ctx = null;
        let width = 0;
        let height = 0;
        let dpr = 1;
        let textures = [];
        let petals = [];
        let lastTime = 0;
        let rafId = null;
        let isPausedByModal = false;

        function rand(min, max) {
            return Math.random() * (max - min) + min;
        }

        function createPetalTexture(fillStyle) {
            const size = 32;
            const offscreen = document.createElement("canvas");
            offscreen.width = size;
            offscreen.height = size;
            const tctx = offscreen.getContext("2d");

            tctx.beginPath();
            tctx.moveTo(size * 0.5, size * 0.08);
            tctx.quadraticCurveTo(size * 0.85, size * 0.28, size * 0.7, size * 0.68);
            tctx.quadraticCurveTo(size * 0.58, size * 0.9, size * 0.5, size * 0.94);
            tctx.quadraticCurveTo(size * 0.42, size * 0.9, size * 0.3, size * 0.68);
            tctx.quadraticCurveTo(size * 0.15, size * 0.28, size * 0.5, size * 0.08);
            tctx.closePath();

            tctx.fillStyle = fillStyle;
            tctx.fill();
            return offscreen;
        }

        function resize() {
            if (!canvas || !ctx) return;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function spawn(startAnywhere) {
            const scale = rand(0.72, 1.15);
            return {
                x: rand(0, width || window.innerWidth),
                y: startAnywhere ? rand(-height, height) : rand(-70, -18),
                vy: rand(22, 42),
                swayAmp: rand(12, 26),
                swaySpeed: rand(0.65, 1.2),
                phase: rand(0, Math.PI * 2),
                w: 13 * scale,
                h: 17 * scale,
                angle: rand(0, Math.PI * 2),
                spin: rand(-0.65, 0.65),
                alpha: rand(0.36, 0.64),
                texIdx: Math.random() < 0.6 ? 0 : 1
            };
        }

        function tick(now) {
            if (!ctx || textures.length === 0) return;

            const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
            lastTime = now;

            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < petals.length; i++) {
                const p = petals[i];
                p.phase += p.swaySpeed * dt;
                p.x += Math.sin(p.phase) * p.swayAmp * dt;
                p.y += p.vy * dt;
                p.angle += p.spin * dt;

                if (p.y > height + 30) {
                    petals[i] = spawn(false);
                    continue;
                }
                if (p.x < -30) p.x = width + 20;
                else if (p.x > width + 30) p.x = -20;

                ctx.globalAlpha = p.alpha;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.drawImage(textures[p.texIdx], -p.w * 0.5, -p.h * 0.5, p.w, p.h);
                ctx.restore();
            }

            ctx.globalAlpha = 1;
            rafId = window.requestAnimationFrame(tick);
        }

        function start() {
            if (PETAL_COUNT === 0 || !ctx || rafId || document.hidden || isPausedByModal) {
                return;
            }
            lastTime = 0;
            rafId = window.requestAnimationFrame(tick);
        }

        function stop() {
            if (rafId) {
                window.cancelAnimationFrame(rafId);
                rafId = null;
            }
        }

        function setModalPaused(paused) {
            isPausedByModal = paused;
            if (paused) stop();
            else start();
        }

        function init() {
            const layer = document.getElementById("petal-layer");
            if (!layer || PETAL_COUNT === 0) return;

            layer.innerHTML = "";
            canvas = document.createElement("canvas");
            canvas.id = "petal-canvas";
            layer.appendChild(canvas);
            ctx = canvas.getContext("2d", { alpha: true });
            if (!ctx) return;

            textures = [
                createPetalTexture("rgba(232, 200, 203, 0.85)"),
                createPetalTexture("rgba(220, 211, 233, 0.78)")
            ];

            resize();
            petals = [];
            for (let i = 0; i < PETAL_COUNT; i++) {
                petals.push(spawn(true));
            }

            let resizeTimer = null;
            window.addEventListener(
                "resize",
                () => {
                    if (resizeTimer) window.clearTimeout(resizeTimer);
                    resizeTimer = window.setTimeout(resize, 150);
                },
                { passive: true }
            );

            document.addEventListener("visibilitychange", () => {
                if (document.hidden) stop();
                else start();
            });

            start();
        }

        return { init, setModalPaused };
    })();

    /* ======================================================================
       4. UNIFIED PRESENTATION STATE & SCENE CONTROLLER
       ====================================================================== */

    const state = {
        currentScene: "countdown",
        isSceneTransitioning: false,
        currentLetter: 0,
        openedLetters: [false, false, false],
        animatingLetters: [false, false, false],
        currentPhoto: 0,
        lightboxOpen: false,
        countdownTimer: null,
        loaderTimers: []
    };

    const scenes = {
        countdown: document.getElementById("countdown-screen"),
        loader: document.getElementById("scene-loader"),
        greeting: document.getElementById("scene-greeting"),
        letters: document.getElementById("scene-letters"),
        gallery: document.getElementById("scene-gallery"),
        final: document.getElementById("scene-final")
    };

    function clearLoaderTimers() {
        for (let i = 0; i < state.loaderTimers.length; i++) {
            window.clearTimeout(state.loaderTimers[i]);
        }
        state.loaderTimers = [];
    }

    function showScene(targetName, { immediate = false } = {}) {
        const nextEl = scenes[targetName];
        if (!nextEl) return;
        if (state.isSceneTransitioning && !immediate) return;

        const prevName = state.currentScene;
        const prevEl = scenes[prevName];

        if (prevName === targetName && !nextEl.hidden) {
            nextEl.classList.add("is-active");
            return;
        }

        const useInstant = immediate || prefersReducedMotion();
        state.isSceneTransitioning = !useInstant;

        const activateNext = () => {
            Object.keys(scenes).forEach((key) => {
                const el = scenes[key];
                if (!el || key === targetName) return;
                el.classList.remove("is-active", "is-exiting");
                el.hidden = true;
            });

            nextEl.hidden = false;
            nextEl.classList.remove("is-exiting");
            state.currentScene = targetName;
            window.scrollTo({ top: 0, behavior: "auto" });

            if (useInstant) {
                nextEl.classList.add("is-active");
                state.isSceneTransitioning = false;
                onSceneEntered(targetName);
            } else {
                window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => {
                        nextEl.classList.add("is-active");
                        window.setTimeout(() => {
                            state.isSceneTransitioning = false;
                            onSceneEntered(targetName);
                        }, 420);
                    });
                });
            }
        };

        if (prevEl && !prevEl.hidden && !useInstant) {
            prevEl.classList.remove("is-active");
            prevEl.classList.add("is-exiting");
            window.setTimeout(activateNext, 520);
        } else {
            activateNext();
        }
    }

    function onSceneEntered(sceneName) {
        if (sceneName === "loader") {
            runCinematicLoader();
        } else if (sceneName === "greeting") {
            const greetingEl = scenes.greeting;
            if (greetingEl) greetingEl.focus({ preventScroll: true });
        } else if (sceneName === "letters") {
            syncLetterView();
        } else if (sceneName === "gallery") {
            hydrateGalleryImages();
            syncGalleryView();
        }
    }

    /* ======================================================================
       5. SCENE 1 — COUNTDOWN, UNLOCK PILL & PRESERVED HEART/RIPPLE UNLOCK
       ====================================================================== */

    const lockedMessages = [
        "No peeking until 16 January! 🤫",
        "Patience, Madam — your HERO is still wrapping it 🎁",
        "Nice try! Some moments are worth the wait 💗",
        "Mission AAM-1601 unlocks on 16 January 🫡"
    ];

    function initUnlockPill() {
        const pill = document.getElementById("unlock-pill");
        const toast = document.getElementById("unlock-toast");
        if (!pill || !toast) return;

        let msgIndex = 0;
        let hideTimer = null;

        pill.addEventListener("click", () => {
            pill.classList.remove("is-shaking");
            void pill.offsetWidth;
            pill.classList.add("is-shaking");

            toast.textContent = lockedMessages[msgIndex % lockedMessages.length];
            msgIndex++;
            toast.classList.add("is-visible");
            playChime(440, 523.25, 0.2);

            if (hideTimer) window.clearTimeout(hideTimer);
            hideTimer = window.setTimeout(() => {
                toast.classList.remove("is-visible");
            }, 2800);
        });
    }

    function triggerUnlockTransition() {
        const screen = scenes.countdown;
        if (state.countdownTimer) {
            window.clearInterval(state.countdownTimer);
            state.countdownTimer = null;
        }

        if (!screen || prefersReducedMotion()) {
            showScene("loader", { immediate: true });
            return;
        }

        playChime(523.25, 783.99, 0.45);
        document.body.classList.add("unlocking");

        const transition = document.createElement("div");
        transition.id = "unlock-transition";
        transition.innerHTML = `
            <div class="unlock-heart" aria-hidden="true">
                <span class="unlock-ring"></span>
                <span class="unlock-ring"></span>
                ♥
            </div>
        `;
        document.body.appendChild(transition);

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                transition.classList.add("active");
            });
        });

        screen.classList.remove("is-active");
        screen.classList.add("is-exiting");

        window.setTimeout(() => {
            showScene("loader", { immediate: true });
        }, 1050);

        window.setTimeout(() => {
            transition.classList.remove("active");
            window.setTimeout(() => {
                transition.remove();
                document.body.classList.remove("unlocking");
            }, 850);
        }, 1850);
    }

    function startCountdown() {
        const dayBox = document.getElementById("days");
        const hourBox = document.getElementById("hours");
        const minuteBox = document.getElementById("minutes");
        const secondBox = document.getElementById("seconds");

        function update() {
            const distance = UNLOCK_DATE - Date.now();
            if (distance <= 0) {
                triggerUnlockTransition();
                return;
            }

            const days = Math.floor(distance / 86400000);
            const hours = Math.floor((distance % 86400000) / 3600000);
            const minutes = Math.floor((distance % 3600000) / 60000);
            const seconds = Math.floor((distance % 60000) / 1000);

            const dStr = String(days);
            const hStr = String(hours).padStart(2, "0");
            const mStr = String(minutes).padStart(2, "0");
            const sStr = String(seconds).padStart(2, "0");

            if (dayBox && dayBox.textContent !== dStr) dayBox.textContent = dStr;
            if (hourBox && hourBox.textContent !== hStr) hourBox.textContent = hStr;
            if (minuteBox && minuteBox.textContent !== mStr) minuteBox.textContent = mStr;
            if (secondBox && secondBox.textContent !== sStr) secondBox.textContent = sStr;
        }

        update();
        state.countdownTimer = window.setInterval(update, 1000);
    }

    /* ======================================================================
       6. SCENE 2 — NEW CINEMATIC LOADING SCREEN (FLORAL EMBLEM & GOLDEN GLOW)
       ====================================================================== */

    function runCinematicLoader() {
        const loader = scenes.loader;
        if (!loader) {
            showScene("greeting", { immediate: true });
            return;
        }

        clearLoaderTimers();
        loader.classList.remove("is-emblem-shown", "is-illuminated", "is-fading-out");

        if (prefersReducedMotion()) {
            loader.classList.add("is-emblem-shown", "is-illuminated");
            state.loaderTimers.push(
                window.setTimeout(() => showScene("greeting", { immediate: true }), 750)
            );
            return;
        }

        // 1. Emblem gradually appears
        state.loaderTimers.push(
            window.setTimeout(() => {
                loader.classList.add("is-emblem-shown");
            }, 180)
        );

        // 2. Warm golden light spreads around it
        state.loaderTimers.push(
            window.setTimeout(() => {
                loader.classList.add("is-illuminated");
                playChime(523.25, 659.25, 0.4);
            }, 850)
        );

        // 3. Emblem fades away softly
        state.loaderTimers.push(
            window.setTimeout(() => {
                loader.classList.add("is-fading-out");
            }, 2650)
        );

        // 4. Transition naturally into Birthday Greeting
        state.loaderTimers.push(
            window.setTimeout(() => {
                showScene("greeting");
            }, 3350)
        );
    }

    /* ======================================================================
       7. SCENE 3 — BIRTHDAY GREETING INTERACTION
       ====================================================================== */

    function initGreetingScene() {
        const greeting = scenes.greeting;
        if (!greeting) return;

        const enterLetters = () => {
            if (state.currentScene !== "greeting" || state.isSceneTransitioning) return;
            playChime(587.33, 783.99, 0.3);
            showScene("letters");
        };

        greeting.addEventListener("click", enterLetters);
        greeting.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                enterLetters();
            }
        });
    }

    /* ======================================================================
       8. SCENE 4 — THREE INTERACTIVE VINTAGE ENVELOPES & DIGITAL BOOK
       ====================================================================== */

    const letterTrack = document.getElementById("letter-track");
    const letterPages = Array.from(document.querySelectorAll(".letter-page"));
    const letterCounter = document.getElementById("letter-page-indicator");
    const letterPrevBtn = document.getElementById("letter-prev");
    const letterNextBtn = document.getElementById("letter-next");
    const letterDots = Array.from(document.querySelectorAll("[data-dot]"));

    const ENVELOPE_PHASE_CLASSES = [
        "is-glowing",
        "is-seal-breaking",
        "is-flap-opening",
        "is-flap-behind",
        "is-letter-rising",
        "is-letter-unfolding"
    ];

    function formatTwoDigits(num) {
        return String(num).padStart(2, "0");
    }

    function syncLetterView() {
        const idx = state.currentLetter;
        if (letterTrack) {
            letterTrack.style.transform = `translate3d(-${idx * 100}%, 0, 0)`;
        }

        if (letterCounter) {
            letterCounter.textContent = `${formatTwoDigits(idx + 1)} / ${formatTwoDigits(letterPages.length)}`;
        }

        letterDots.forEach((dot, i) => {
            dot.classList.toggle("is-active", i === idx);
        });

        letterPages.forEach((page, i) => {
            const isCurrent = i === idx;
            page.classList.toggle("is-current", isCurrent);
            page.setAttribute("aria-hidden", String(!isCurrent));

            const envStage = page.querySelector(".envelope-stage-wrap");
            const sheetWrap = page.querySelector(".letter-sheet-wrap");
            const envBtn = page.querySelector(".vintage-envelope");

            if (state.openedLetters[i]) {
                page.classList.add("is-instant-open");
                if (envStage) envStage.hidden = true;
                if (sheetWrap) sheetWrap.hidden = false;
                if (envBtn) envBtn.setAttribute("aria-expanded", "true");
            } else if (!state.animatingLetters[i]) {
                page.classList.remove("is-instant-open", "is-animating");
                if (envStage) envStage.hidden = false;
                if (sheetWrap) sheetWrap.hidden = true;
                if (envBtn) {
                    envBtn.classList.remove(...ENVELOPE_PHASE_CLASSES);
                    envBtn.setAttribute("aria-expanded", "false");
                }
            }
        });

        if (letterPrevBtn) {
            const prevLabel = letterPrevBtn.querySelector(".nav-text");
            if (prevLabel) prevLabel.textContent = idx === 0 ? "Greeting" : "Previous";
            letterPrevBtn.setAttribute(
                "aria-label",
                idx === 0 ? "Return to birthday greeting" : `Go to letter ${idx}`
            );
        }

        if (letterNextBtn) {
            const nextLabel = letterNextBtn.querySelector(".nav-text");
            const isLast = idx === letterPages.length - 1;
            if (nextLabel) nextLabel.textContent = isLast ? "Memories" : "Next";
            letterNextBtn.setAttribute(
                "aria-label",
                isLast ? "Continue to hanging photograph gallery" : `Go to letter ${idx + 2}`
            );
        }
    }

    function openEnvelope(index) {
        const page = letterPages[index];
        if (!page || state.openedLetters[index] || state.animatingLetters[index]) return;

        const envBtn = page.querySelector(".vintage-envelope");
        const envStage = page.querySelector(".envelope-stage-wrap");
        const sheetWrap = page.querySelector(".letter-sheet-wrap");
        const paper = page.querySelector(".vintage-letter-paper");
        if (!envBtn || !envStage || !sheetWrap) return;

        state.animatingLetters[index] = true;
        page.classList.add("is-animating");
        page.classList.remove("is-instant-open");
        envBtn.setAttribute("aria-expanded", "true");

        const finishOpen = () => {
            state.animatingLetters[index] = false;
            state.openedLetters[index] = true;
            page.classList.remove("is-animating");
            envBtn.classList.remove(...ENVELOPE_PHASE_CLASSES);
            envStage.hidden = true;
            sheetWrap.hidden = false;
            if (paper) {
                paper.scrollTop = 0;
                paper.focus({ preventScroll: true });
            }
        };

        if (prefersReducedMotion()) {
            finishOpen();
            return;
        }

        // Step 3: Subtle glow on wax seal
        envBtn.classList.add("is-glowing");
        playChime(523.25, 659.25, 0.28);

        // Step 4: Seal breaks apart cleanly
        window.setTimeout(() => {
            envBtn.classList.add("is-seal-breaking");
        }, 320);

        // Step 5: Flap rotates backwards in 3D
        window.setTimeout(() => {
            envBtn.classList.add("is-flap-opening");
            playPaperWhisper();
        }, 620);

        // Step 5b: Drop flap z-index cleanly after passing 90deg (prevents WebKit pop)
        window.setTimeout(() => {
            envBtn.classList.add("is-flap-behind");
        }, 940);

        // Step 6 & 7: Letter slides upward out of the pocket
        window.setTimeout(() => {
            envBtn.classList.add("is-letter-rising");
            playPaperWhisper();
        }, 1100);

        // Step 8: Paper unfolds and expands while envelope fades
        window.setTimeout(() => {
            envBtn.classList.add("is-letter-unfolding");
            playChime(659.25, 783.99, 0.34);
        }, 1720);

        // Step 9: Complete vintage ivory letter becomes readable
        window.setTimeout(finishOpen, 2140);
    }

    function refoldEnvelope(index) {
        const page = letterPages[index];
        if (!page || state.animatingLetters[index]) return;

        state.openedLetters[index] = false;
        playPaperWhisper();
        syncLetterView();

        const envBtn = page.querySelector(".vintage-envelope");
        if (envBtn) envBtn.focus({ preventScroll: true });
    }

    function navigateLetters(direction) {
        if (state.currentScene !== "letters" || state.isSceneTransitioning) return;
        if (state.animatingLetters[state.currentLetter]) return;

        const target = state.currentLetter + direction;
        if (target < 0) {
            showScene("greeting");
            return;
        }
        if (target >= letterPages.length) {
            state.currentPhoto = 0;
            showScene("gallery");
            return;
        }

        state.currentLetter = target;
        playPaperWhisper();
        syncLetterView();
    }

    /* ======================================================================
       9. SCENE 5 — HANGING PHOTO GALLERY & ACCESSIBLE LIGHTBOX
       ====================================================================== */

    const galleryTrack = document.getElementById("gallery-track");
    const gallerySlides = Array.from(document.querySelectorAll(".gallery-slide"));
    const galleryFrames = Array.from(document.querySelectorAll(".hanging-frame"));
    const galleryCounter = document.getElementById("gallery-page-indicator");
    const galleryPrevBtn = document.getElementById("gallery-prev");
    const galleryNextBtn = document.getElementById("gallery-next");
    const galleryDots = Array.from(document.querySelectorAll("[data-gdot]"));

    const lightbox = document.getElementById("photo-lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxCaption = document.getElementById("lightbox-caption");
    const lightboxCounter = document.getElementById("lightbox-counter");
    const lightboxCloseBtn = lightbox ? lightbox.querySelector(".lightbox-close") : null;

    let lastFocusedBeforeLightbox = null;
    let lightboxCloseTimer = null;

    let galleryImagesHydrated = false;

    function hydrateGalleryImages() {
        if (galleryImagesHydrated) return;
        galleryImagesHydrated = true;
        galleryFrames.forEach((frame) => {
            const img = frame.querySelector("img[data-src]");
            if (img) {
                img.src = img.getAttribute("data-src");
                img.removeAttribute("data-src");
            }
        });
    }

    function syncGalleryView() {
        const idx = state.currentPhoto;
        if (galleryTrack) {
            galleryTrack.style.transform = `translate3d(-${idx * 100}%, 0, 0)`;
        }

        if (galleryCounter) {
            galleryCounter.textContent = `${formatTwoDigits(idx + 1)} / ${formatTwoDigits(gallerySlides.length)}`;
        }

        galleryDots.forEach((dot, i) => {
            dot.classList.toggle("is-active", i === idx);
        });

        gallerySlides.forEach((slide, i) => {
            slide.classList.toggle("is-current", i === idx);
            slide.setAttribute("aria-hidden", String(i !== idx));
        });

        if (galleryPrevBtn) {
            const label = galleryPrevBtn.querySelector(".nav-text");
            if (label) label.textContent = idx === 0 ? "Letters" : "Previous";
            galleryPrevBtn.setAttribute(
                "aria-label",
                idx === 0 ? "Return to letters" : `View photograph ${idx}`
            );
        }

        if (galleryNextBtn) {
            const label = galleryNextBtn.querySelector(".nav-text");
            const isLast = idx === gallerySlides.length - 1;
            if (label) label.textContent = isLast ? "Closing" : "Next";
            galleryNextBtn.setAttribute(
                "aria-label",
                isLast ? "Continue to final birthday message" : `View photograph ${idx + 2}`
            );
        }
    }

    function navigateGallery(direction) {
        if (state.currentScene !== "gallery" || state.isSceneTransitioning || state.lightboxOpen) {
            return;
        }

        const target = state.currentPhoto + direction;
        if (target < 0) {
            state.currentLetter = letterPages.length - 1;
            showScene("letters");
            return;
        }
        if (target >= gallerySlides.length) {
            showScene("final");
            return;
        }

        state.currentPhoto = target;
        playPaperWhisper();
        syncGalleryView();
    }

    function renderLightboxPhoto(index) {
        if (!lightboxImg || galleryFrames.length === 0) return;
        const safeIdx =
            ((index % galleryFrames.length) + galleryFrames.length) %
            galleryFrames.length;
        const frame = galleryFrames[safeIdx];
        const img = frame.querySelector("img");
        const caption = frame.querySelector("figcaption");
        if (!img) return;

        state.currentPhoto = safeIdx;
        syncGalleryView();

        lightboxImg.src = img.getAttribute("data-src") || img.getAttribute("src") || img.src;
        lightboxImg.alt = img.alt || "";
        if (lightboxCaption) {
            lightboxCaption.textContent = caption ? caption.textContent : "";
        }
        if (lightboxCounter) {
            lightboxCounter.textContent = `${formatTwoDigits(safeIdx + 1)} / ${formatTwoDigits(galleryFrames.length)}`;
        }
    }

    function openLightbox(frame) {
        if (!lightbox || !lightboxImg) return;
        const idx = galleryFrames.indexOf(frame);
        if (idx === -1) return;

        if (lightboxCloseTimer) {
            window.clearTimeout(lightboxCloseTimer);
            lightboxCloseTimer = null;
        }

        lastFocusedBeforeLightbox = frame;
        state.lightboxOpen = true;
        renderLightboxPhoto(idx);

        lightbox.hidden = false;
        document.body.style.overflow = "hidden";
        PetalEngine.setModalPaused(true);
        playChime(587.33, 739.99, 0.22);

        if (prefersReducedMotion()) {
            lightbox.classList.add("is-open");
        } else {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    lightbox.classList.add("is-open");
                });
            });
        }

        if (lightboxCloseBtn) {
            lightboxCloseBtn.focus({ preventScroll: true });
        }
    }

    function closeLightbox() {
        if (!lightbox || lightbox.hidden) return;
        lightbox.classList.remove("is-open");
        state.lightboxOpen = false;

        const finish = () => {
            lightbox.hidden = true;
            document.body.style.overflow = "";
            PetalEngine.setModalPaused(false);
            const focusTarget =
                galleryFrames[state.currentPhoto] || lastFocusedBeforeLightbox;
            if (focusTarget) focusTarget.focus({ preventScroll: true });
            lastFocusedBeforeLightbox = null;
            lightboxCloseTimer = null;
        };

        if (prefersReducedMotion()) {
            finish();
        } else {
            lightboxCloseTimer = window.setTimeout(finish, 260);
        }
    }

    /* ======================================================================
       10. CLEAN TOUCH SWIPE CONTROLLER (NON-INTERFERING WITH VERTICAL SCROLL)
       ====================================================================== */

    function attachSwipe(element, { onSwipeLeft, onSwipeRight }) {
        if (!element) return;

        let startX = 0;
        let startY = 0;
        let tracking = false;
        let lockedAxis = null;

        element.addEventListener(
            "touchstart",
            (event) => {
                if (event.touches.length !== 1) {
                    tracking = false;
                    return;
                }
                const touch = event.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                tracking = true;
                lockedAxis = null;
            },
            { passive: true }
        );

        element.addEventListener(
            "touchmove",
            (event) => {
                if (!tracking || event.touches.length !== 1) return;
                const touch = event.touches[0];
                const dx = touch.clientX - startX;
                const dy = touch.clientY - startY;

                if (!lockedAxis && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
                    lockedAxis = Math.abs(dx) > Math.abs(dy) * 1.45 ? "x" : "y";
                }
            },
            { passive: true }
        );

        element.addEventListener(
            "touchend",
            (event) => {
                if (!tracking) return;
                tracking = false;
                if (lockedAxis !== "x") return;

                const touch = event.changedTouches[0];
                const dx = touch.clientX - startX;
                const dy = touch.clientY - startY;

                if (Math.abs(dx) >= 54 && Math.abs(dx) > Math.abs(dy) * 1.45) {
                    if (dx < 0 && onSwipeLeft) onSwipeLeft();
                    else if (dx > 0 && onSwipeRight) onSwipeRight();
                }
            },
            { passive: true }
        );

        element.addEventListener(
            "touchcancel",
            () => {
                tracking = false;
                lockedAxis = null;
            },
            { passive: true }
        );
    }

    /* ======================================================================
       11. UNIFIED DELEGATED CLICK & KEYBOARD HANDLERS
       ====================================================================== */

    function initInteractions() {
        initSoundToggle();
        initUnlockPill();
        initGreetingScene();

        // Single delegated click listener for letters, gallery, final scene & lightbox
        document.addEventListener("click", (event) => {
            const openBtn = event.target.closest("[data-open-envelope]");
            if (openBtn) {
                event.preventDefault();
                openEnvelope(Number(openBtn.getAttribute("data-open-envelope")));
                return;
            }

            const refoldBtn = event.target.closest("[data-refold-envelope]");
            if (refoldBtn) {
                event.preventDefault();
                refoldEnvelope(Number(refoldBtn.getAttribute("data-refold-envelope")));
                return;
            }

            if (event.target.closest("#letter-prev")) {
                event.preventDefault();
                navigateLetters(-1);
                return;
            }

            if (event.target.closest("#letter-next")) {
                event.preventDefault();
                navigateLetters(1);
                return;
            }

            if (event.target.closest("#gallery-prev")) {
                event.preventDefault();
                navigateGallery(-1);
                return;
            }

            if (event.target.closest("#gallery-next")) {
                event.preventDefault();
                navigateGallery(1);
                return;
            }

            if (event.target.closest("#final-back")) {
                event.preventDefault();
                state.currentPhoto = gallerySlides.length - 1;
                showScene("gallery");
                return;
            }

            const frame = event.target.closest(".hanging-frame");
            if (frame && state.currentScene === "gallery" && !state.lightboxOpen) {
                event.preventDefault();
                openLightbox(frame);
                return;
            }

            if (state.lightboxOpen && lightbox) {
                if (event.target.closest(".lightbox-prev")) {
                    event.preventDefault();
                    renderLightboxPhoto(state.currentPhoto - 1);
                    return;
                }
                if (event.target.closest(".lightbox-next")) {
                    event.preventDefault();
                    renderLightboxPhoto(state.currentPhoto + 1);
                    return;
                }
                if (
                    event.target.closest(".lightbox-close") ||
                    event.target.classList.contains("lightbox-backdrop")
                ) {
                    event.preventDefault();
                    closeLightbox();
                }
            }
        });

        // Keyboard navigation & lightbox focus trap
        document.addEventListener("keydown", (event) => {
            if (state.lightboxOpen && lightbox) {
                if (event.key === "Escape") {
                    event.preventDefault();
                    closeLightbox();
                    return;
                }
                if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    renderLightboxPhoto(state.currentPhoto - 1);
                    return;
                }
                if (event.key === "ArrowRight") {
                    event.preventDefault();
                    renderLightboxPhoto(state.currentPhoto + 1);
                    return;
                }
                if (event.key === "Tab") {
                    const focusables = Array.from(
                        lightbox.querySelectorAll("button:not([disabled])")
                    );
                    if (focusables.length > 0) {
                        const first = focusables[0];
                        const last = focusables[focusables.length - 1];
                        if (event.shiftKey && document.activeElement === first) {
                            event.preventDefault();
                            last.focus();
                        } else if (!event.shiftKey && document.activeElement === last) {
                            event.preventDefault();
                            first.focus();
                        }
                    }
                }
                return;
            }

            if (state.currentScene === "letters") {
                if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    navigateLetters(-1);
                } else if (event.key === "ArrowRight") {
                    event.preventDefault();
                    navigateLetters(1);
                }
                return;
            }

            if (state.currentScene === "gallery") {
                if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    navigateGallery(-1);
                } else if (event.key === "ArrowRight") {
                    event.preventDefault();
                    navigateGallery(1);
                } else if (
                    (event.key === "Enter" || event.key === " ") &&
                    document.activeElement &&
                    document.activeElement.classList.contains("hanging-frame")
                ) {
                    event.preventDefault();
                    openLightbox(document.activeElement);
                }
                return;
            }

            if (state.currentScene === "final" && event.key === "ArrowLeft") {
                event.preventDefault();
                state.currentPhoto = gallerySlides.length - 1;
                showScene("gallery");
            }
        });

        // Attach clean swipe gestures per interactive region
        attachSwipe(document.getElementById("letter-swipe-area"), {
            onSwipeLeft: () => navigateLetters(1),
            onSwipeRight: () => navigateLetters(-1)
        });

        attachSwipe(document.getElementById("gallery-swipe-area"), {
            onSwipeLeft: () => navigateGallery(1),
            onSwipeRight: () => navigateGallery(-1)
        });

        attachSwipe(document.getElementById("lightbox-swipe-area"), {
            onSwipeLeft: () => renderLightboxPhoto(state.currentPhoto + 1),
            onSwipeRight: () => renderLightboxPhoto(state.currentPhoto - 1)
        });

        attachSwipe(scenes.final, {
            onSwipeRight: () => {
                state.currentPhoto = gallerySlides.length - 1;
                showScene("gallery");
            }
        });
    }

    /* ======================================================================
       12. BOOTSTRAP & PREVIEW MODES
       ====================================================================== */

    function init() {
        initInteractions();
        PetalEngine.init();

        const params = new URLSearchParams(window.location.search);
        const preview = params.get("preview");

        if (preview === "unlock") {
            startCountdown();
            window.setTimeout(triggerUnlockTransition, 350);
        } else if (preview === "loader") {
            showScene("loader", { immediate: true });
        } else if (preview === "birthday" || preview === "greeting") {
            showScene("greeting", { immediate: true });
        } else if (preview === "letters") {
            showScene("letters", { immediate: true });
        } else if (preview === "gallery") {
            showScene("gallery", { immediate: true });
        } else if (preview === "final") {
            showScene("final", { immediate: true });
        } else {
            startCountdown();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
