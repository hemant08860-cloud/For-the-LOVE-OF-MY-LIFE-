/* =========================================================
   PROJECT AYE AYE MADAM — LETTER INTERACTION UPGRADE
   Load this AFTER js/script.js.
========================================================= */

(() => {
    const reducedMotion = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let activeEnvelope = null;
    let activeLetter = null;
    let openingTimer = null;

    function getCollection() {
        return document.getElementById("letter-collection");
    }

    function closeLetter(restoreFocus = true) {
        const collection = getCollection();

        if (openingTimer) {
            window.clearTimeout(openingTimer);
            openingTimer = null;
        }

        if (activeLetter) activeLetter.hidden = true;

        if (activeEnvelope) {
            activeEnvelope.classList.remove("is-opening");
            activeEnvelope.setAttribute("aria-expanded", "false");
            if (restoreFocus) activeEnvelope.focus();
        }

        activeLetter = null;
        activeEnvelope = null;

        if (collection) {
            collection.hidden = false;
            collection.scrollIntoView({
                behavior: reducedMotion ? "auto" : "smooth",
                block: "start"
            });
        }
    }

    function openLetter(envelope) {
        const collection = getCollection();
        const letterId = envelope.getAttribute("data-letter");
        const letter = document.getElementById(letterId);

        if (!collection || !letter || !letter.classList.contains("letter-paper")) {
            return;
        }

        if (openingTimer) window.clearTimeout(openingTimer);

        if (activeLetter) activeLetter.hidden = true;

        if (activeEnvelope) {
            activeEnvelope.classList.remove("is-opening");
            activeEnvelope.setAttribute("aria-expanded", "false");
        }

        activeEnvelope = envelope;
        activeLetter = letter;

        envelope.setAttribute("aria-expanded", "true");
        envelope.classList.remove("is-opening");
        void envelope.offsetWidth;
        envelope.classList.add("is-opening");

        const revealPaper = () => {
            envelope.classList.remove("is-opening");
            collection.hidden = true;
            letter.hidden = false;

            letter.scrollIntoView({
                behavior: reducedMotion ? "auto" : "smooth",
                block: "start"
            });

            const closeButton = letter.querySelector(".letter-close");
            if (closeButton) closeButton.focus({ preventScroll: true });

            openingTimer = null;
        };

        if (reducedMotion) {
            revealPaper();
        } else {
            openingTimer = window.setTimeout(revealPaper, 620);
        }
    }

    // Capture phase stops the original handler from bypassing the animation.
    document.addEventListener("click", (event) => {
        const envelope = event.target.closest(".letter-envelope[data-letter]");

        if (envelope) {
            event.preventDefault();
            event.stopImmediatePropagation();
            openLetter(envelope);
            return;
        }

        const closeButton = event.target.closest(".letter-paper .letter-close");

        if (closeButton && activeLetter) {
            event.preventDefault();
            event.stopImmediatePropagation();
            closeLetter(true);
        }
    }, true);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && activeLetter && !activeLetter.hidden) {
            event.preventDefault();
            event.stopImmediatePropagation();
            closeLetter(true);
        }
    }, true);
})();
