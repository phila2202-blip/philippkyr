/**
 * Die Biegung unter dem Seitenkopf der Unterseiten.
 *
 * Den Effekt gibt es auf der Startseite bereits: die Komponente Bend.tsx setzt
 * den Uebergang von der dunklen in die helle Bahn als kubische Kurve, deren
 * Woelbung beim Scrollen entsteht, weich gefuehrt durch eine Feder. Die
 * statischen Unterseiten hatten dafuer nur eine Ellipse aus border-radius,
 * dieselbe Form also, aber ohne Bewegung und mit einem sichtbaren Haken an den
 * Enden, weil eine Ellipse an der Kante senkrecht auslaeuft.
 *
 * Dieses Skript ist die Uebersetzung von Bend.tsx nach purem JavaScript. Die
 * Kurvenform und die Feder stammen unveraendert von dort:
 *
 *   - Kurve : kubisch, Kontrollpunkte bei einem und zwei Dritteln der Breite
 *   - Tiefe : amount = 95 (der Wert der Startseite fuer dunkel nach hell)
 *   - Feder : stiffness 90, damping 24, mass 0.4
 *
 * Zwei Dinge sind anders, weil die Biegung hier am Seitenanfang sitzt statt
 * mitten auf der Seite:
 *
 *   1. Sie wird nicht als eigenes Element gezeichnet, sondern als clip-path auf
 *      dem Kopf selbst. Dadurch laeuft dessen Farbverlauf ohne Naht bis in die
 *      Kurve hinein.
 *   2. Sie haengt nicht an der Scrollposition, sondern an der Scrollbewegung.
 *      Steht die Seite still, ist die Kante gerade. Beim Scrollen zieht sich
 *      die Mitte nach unten, je schneller die Bewegung, desto tiefer; sobald
 *      man loslaesst, federt sie in die gerade Kante zurueck. Eine Biegung, die
 *      an der Position haengt, bliebe dagegen stehen, sobald man aufhoert zu
 *      scrollen, und das sieht nach Fehler aus statt nach Bewegung.
 *
 * Ohne JavaScript oder ohne clip-path bleibt die bisherige CSS-Ellipse stehen;
 * die Seite sieht also nie kaputt aus.
 */
(function () {
    var kopf = document.querySelector('header:not(.hero-b2b):not(.hero-section)');
    if (!kopf) return;
    if (!window.CSS || !CSS.supports || !CSS.supports('clip-path', 'path("M0,0 H1 Z")')) return;

    var AMOUNT = 95,        /* Bend: amount */
        STEIF  = 90,        /* Bend: useSpring stiffness */
        DAEMPF = 24,        /* Bend: useSpring damping  */
        MASSE  = 0.4,       /* Bend: useSpring mass     */
        BEZUG  = 22;        /* Verschiebung je Bild in px fuer die volle Woelbung */

    var k = 0,              /* dargestellte Woelbung, 0 = gerade, 1 = voll */
        v = 0,              /* Geschwindigkeit der Feder */
        ziel = 0,
        tempo = 0,          /* geglaettete Scrollbewegung je Bild */
        letzteY = window.pageYOffset,
        letzteZeit = 0,
        laeuft = false;

    /* Auf schmalen Geraeten flacher, sonst frisst die Woelbung zu viel von der
       ohnehin knappen Hoehe. */
    function tiefe() {
        return window.innerWidth <= 720 ? AMOUNT * 0.5 : AMOUNT;
    }

    /* Die Mitte der Kante bleibt auf der Unterkante des Kopfes stehen,
       angehoben werden die beiden Seiten. So ist k = 0 exakt die gerade Kante
       und der Kopf verliert im Ruhezustand keine Hoehe. */
    function zeichne(wert) {
        var w = kopf.offsetWidth,
            h = kopf.offsetHeight,
            a = tiefe() * Math.max(wert, 0),
            sehne = h - a,
            cp = sehne + a * (4 / 3);   /* 4/3, damit der Bauch genau h erreicht */
        kopf.style.clipPath =
            'path("M0,0 H' + w + ' V' + sehne.toFixed(1) +
            ' C' + (w * 2 / 3).toFixed(1) + ',' + cp.toFixed(1) +
            ' ' + (w / 3).toFixed(1) + ',' + cp.toFixed(1) +
            ' 0,' + sehne.toFixed(1) + ' Z")';
    }

    function schritt(zeit) {
        var dt = letzteZeit ? Math.min((zeit - letzteZeit) / 1000, 1 / 30) : 1 / 60;
        letzteZeit = zeit;

        /* Wie weit ist die Seite seit dem letzten Bild gewandert? Der gleitende
           Mittelwert glaettet einzelne Ausreisser und laeuft von selbst gegen
           null, sobald niemand mehr scrollt. */
        var y = window.pageYOffset;
        tempo = tempo * 0.6 + Math.abs(y - letzteY) * 0.4;
        letzteY = y;
        ziel = Math.min(tempo / BEZUG, 1);

        var beschl = (STEIF * (ziel - k) - DAEMPF * v) / MASSE;
        v += beschl * dt;
        k += v * dt;

        zeichne(k);

        /* Erst anhalten, wenn sowohl die Bewegung als auch die Feder zur Ruhe
           gekommen sind, und dann exakt auf die gerade Kante setzen. */
        if (tempo < 0.05 && Math.abs(k) < 0.002 && Math.abs(v) < 0.002) {
            k = 0; v = 0; tempo = 0; laeuft = false; letzteZeit = 0;
            zeichne(0);
            return;
        }
        requestAnimationFrame(schritt);
    }

    function antreiben() {
        if (!laeuft) { laeuft = true; letzteZeit = 0; requestAnimationFrame(schritt); }
    }

    function start() {
        document.documentElement.classList.add('biegung-aktiv');

        /* Wer Bewegung abbestellt hat, sieht die Ruhelage von Bend: eine feste,
           knapp halbe Woelbung. Eine gerade Kante waere hier keine Ruhelage,
           sondern das Verschwinden des Gestaltungselements. */
        var ruhig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
        if (ruhig && ruhig.matches) { zeichne(0.45); return; }

        zeichne(0);
        letzteY = window.pageYOffset;
        window.addEventListener('scroll', antreiben, { passive: true });
        window.addEventListener('resize', function () { zeichne(k); antreiben(); });
        /* Die Kopfhoehe steht erst fest, wenn die Schrift geladen ist. */
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () { zeichne(k); });
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
