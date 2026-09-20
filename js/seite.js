/**
 * Gemeinsames Seitenskript der statischen Seiten.
 *
 * Es ersetzt drei frueher inline notierte Schnipsel: die Jahreszahl im Fuss,
 * den Schatten der Navigationsleiste beim Scrollen und den Ersatz fuer Bilder,
 * die nicht geladen werden koennen. Inline notiert waeren sie von der
 * Content Security Policy blockiert; ausgelagert genuegt script-src 'self'.
 */
(function () {
    'use strict';

    var jahr = document.getElementById('jahr');
    if (jahr) {
        jahr.textContent = new Date().getFullYear();
    }

    var leiste = document.getElementById('navbar');
    if (leiste) {
        window.addEventListener('scroll', function () {
            leiste.style.boxShadow = window.scrollY > 50
                ? '0 10px 30px rgba(0, 0, 0, 0.08)'
                : 'none';
        }, { passive: true });
    }

    // Ersatzbild, falls eine Abbildung fehlt. Das Skript laeuft mit defer, das
    // Fehlerereignis kann also bereits vorbei sein; deshalb zusaetzlich der
    // Test auf ein fertig geladenes Bild ohne Breite.
    var bilder = document.querySelectorAll('img[data-ersatz]');
    Array.prototype.forEach.call(bilder, function (bild) {
        function ersetzen() {
            var ersatz = bild.getAttribute('data-ersatz');
            if (ersatz && bild.getAttribute('src') !== ersatz) {
                bild.setAttribute('src', ersatz);
            }
        }
        bild.addEventListener('error', ersetzen);
        if (bild.complete && bild.naturalWidth === 0) {
            ersetzen();
        }
    });
})();
