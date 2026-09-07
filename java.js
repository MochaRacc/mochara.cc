/* mochara.cc — Windows XP edition: desktop/window manager
   Handles window dragging, focus (z-index), minimize/maximize/close,
   the start menu, taskbar entries, the clock, and the shutdown dialog. */

(function () {
    'use strict';

    var highestZ = 10;
    var isTouch = window.matchMedia('(max-width: 640px)').matches;

    function isMobile() {
        return window.innerWidth <= 640;
    }

    /* ---------------------------------------------------------------- *
     * Focus handling
     * ---------------------------------------------------------------- */

    function focusWindow(win) {
        document.querySelectorAll('.window').forEach(function (w) {
            w.classList.toggle('active-win', w === win);
            w.classList.toggle('inactive-win', w !== win);
        });
        highestZ++;
        win.style.zIndex = highestZ;

        document.querySelectorAll('.taskbar-buttons button').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.window === win.id && !win.classList.contains('hidden'));
        });
    }

    /* ---------------------------------------------------------------- *
     * Open / close / minimize / maximize
     * ---------------------------------------------------------------- */

    function openWindow(id) {
        var win = document.getElementById(id);
        if (!win) return;
        win.classList.remove('hidden');
        win.dataset.minimized = 'false';
        focusWindow(win);
        updateTaskbarButton(id);
    }

    function closeWindow(id) {
        var win = document.getElementById(id);
        if (!win) return;
        win.classList.add('hidden');
        win.dataset.minimized = 'false';
        updateTaskbarButton(id);
    }

    function toggleWindow(id) {
        var win = document.getElementById(id);
        if (!win) return;
        var hidden = win.classList.contains('hidden');
        if (hidden) {
            openWindow(id);
        } else if (win.classList.contains('active-win') && win.dataset.minimized !== 'true') {
            minimizeWindow(id);
        } else {
            openWindow(id);
        }
    }

    function minimizeWindow(id) {
        var win = document.getElementById(id);
        if (!win) return;
        win.classList.add('hidden');
        win.dataset.minimized = 'true';
        updateTaskbarButton(id);
    }

    function maximizeWindow(id) {
        var win = document.getElementById(id);
        if (!win) return;
        win.classList.toggle('maximized');
        focusWindow(win);
    }

    function updateTaskbarButton(id) {
        var btn = document.querySelector('.taskbar-buttons button[data-window="' + id + '"]');
        if (!btn) return;
        var win = document.getElementById(id);
        var open = win && !win.classList.contains('hidden');
        btn.classList.toggle('active', !!open);
        btn.setAttribute('aria-pressed', open ? 'true' : 'false');
    }

    /* ---------------------------------------------------------------- *
     * Dragging
     * ---------------------------------------------------------------- */

    function makeDraggable(win) {
        var header = win.querySelector('.title-bar');
        if (!header) return;

        header.addEventListener('pointerdown', function (event) {
            if (isMobile()) return;
            if (event.target.closest('.title-bar-controls')) return;

            focusWindow(win);

            var rect = win.getBoundingClientRect();
            win.style.transform = 'none';
            win.style.left = rect.left + 'px';
            win.style.top = rect.top + 'px';

            var shiftX = event.clientX - rect.left;
            var shiftY = event.clientY - rect.top;

            function onMove(e) {
                var maxLeft = window.innerWidth - 40;
                var maxTop = window.innerHeight - 40;
                var left = Math.min(Math.max(e.clientX - shiftX, -rect.width + 60), maxLeft);
                var top = Math.min(Math.max(e.clientY - shiftY, 0), maxTop);
                win.style.left = left + 'px';
                win.style.top = top + 'px';
            }

            function onUp() {
                document.removeEventListener('pointermove', onMove);
                document.removeEventListener('pointerup', onUp);
            }

            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
        });

        header.addEventListener('dragstart', function () { return false; });

        win.addEventListener('pointerdown', function () { focusWindow(win); });
    }

    /* ---------------------------------------------------------------- *
     * Start menu
     * ---------------------------------------------------------------- */

    function toggleStartMenu(forceState) {
        var menu = document.getElementById('start-menu');
        var startBtn = document.getElementById('start-button');
        if (!menu) return;
        var show = typeof forceState === 'boolean' ? forceState : menu.classList.contains('hidden');
        menu.classList.toggle('hidden', !show);
        if (startBtn) startBtn.classList.toggle('active', show);
    }

    document.addEventListener('click', function (event) {
        var menu = document.getElementById('start-menu');
        var startBtn = document.getElementById('start-button');
        if (!menu || menu.classList.contains('hidden')) return;
        if (menu.contains(event.target) || (startBtn && startBtn.contains(event.target))) return;
        toggleStartMenu(false);
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            toggleStartMenu(false);
        }
    });

    /* ---------------------------------------------------------------- *
     * Clock
     * ---------------------------------------------------------------- */

    function updateClock() {
        var el = document.getElementById('clock');
        if (!el) return;
        var now = new Date();
        el.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        el.setAttribute(
            'title',
            now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        );
    }

    /* ---------------------------------------------------------------- *
     * Status bar object count (main window link/friend count)
     * ---------------------------------------------------------------- */

    function updateStatusBar() {
        var field = document.getElementById('main-status-count');
        if (!field) return;
        var count = document.querySelectorAll('#main-window .link-container a').length;
        field.textContent = count + ' object' + (count === 1 ? '' : 's');
    }

    /* ---------------------------------------------------------------- *
     * Shutdown dialog (Turn Off Computer)
     * ---------------------------------------------------------------- */

    function showShutdownDialog() {
        toggleStartMenu(false);
        openWindow('shutdown-dialog');
    }

    function runShutdown() {
        closeWindow('shutdown-dialog');
        var overlay = document.getElementById('shutdown-overlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');
        window.setTimeout(function () {
            overlay.innerHTML =
                '<p>It\u2019s now safe to turn off this browser tab.</p>' +
                '<button type="button" id="restart-btn">Restart</button>';
            document.getElementById('restart-btn').addEventListener('click', function () {
                overlay.classList.add('hidden');
            });
        }, 1600);
    }

    /* ---------------------------------------------------------------- *
     * Init
     * ---------------------------------------------------------------- */

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.window').forEach(makeDraggable);

        document.querySelectorAll('[data-action="open"]').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                openWindow(el.dataset.target);
                toggleStartMenu(false);
            });
        });

        document.querySelectorAll('[data-action="toggle"]').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                toggleWindow(el.dataset.target);
            });
        });

        document.querySelectorAll('[data-action="close"]').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                closeWindow(el.dataset.target);
            });
        });

        document.querySelectorAll('[data-action="minimize"]').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                minimizeWindow(el.dataset.target);
            });
        });

        document.querySelectorAll('[data-action="maximize"]').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                maximizeWindow(el.dataset.target);
            });
        });

        var startBtn = document.getElementById('start-button');
        if (startBtn) {
            startBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleStartMenu();
            });
        }

        var shutdownLink = document.getElementById('start-shutdown');
        if (shutdownLink) shutdownLink.addEventListener('click', showShutdownDialog);

        var shutdownConfirm = document.getElementById('shutdown-confirm');
        if (shutdownConfirm) shutdownConfirm.addEventListener('click', runShutdown);

        var logoffLink = document.getElementById('start-logoff');
        if (logoffLink) {
            logoffLink.addEventListener('click', function () {
                toggleStartMenu(false);
                closeWindow('main-window');
            });
        }

        updateStatusBar();
        updateClock();
        window.setInterval(updateClock, 15000);
    });

    window.toggleWindow = toggleWindow;
    window.openWindow = openWindow;
    window.closeWindow = closeWindow;
    window.toggleStartMenu = toggleStartMenu;
})();
