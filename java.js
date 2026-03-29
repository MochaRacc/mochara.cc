function toggleWindow(id) {
    const win = document.getElementById(id);
    if (win.classList.contains('hidden')) {
        win.classList.remove('hidden');
    } else {
        win.classList.add('hidden');
    }
}

function toggleStartMenu() {
    document.getElementById('start-menu').classList.toggle('hidden');
}

function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('clock').innerText = timeStr;
}
setInterval(updateClock, 1000);
updateClock();


let highestZ = 10;

document.querySelectorAll('.title-bar').forEach(header => {
    header.onmousedown = function(event) {

        if (window.innerWidth <= 600) return;

        let win = header.parentElement;
        

        highestZ++;
        win.style.zIndex = highestZ;


        const rect = win.getBoundingClientRect();
        

        win.style.transform = 'none';
        win.style.left = rect.left + 'px';
        win.style.top = rect.top + 'px';

        let shiftX = event.clientX - rect.left;
        let shiftY = event.clientY - rect.top;

        function moveAt(pageX, pageY) {
            win.style.left = pageX - shiftX + 'px';
            win.style.top = pageY - shiftY + 'px';
        }

        function onMouseMove(event) {
            moveAt(event.pageX, event.pageY);
        }

        document.addEventListener('mousemove', onMouseMove);

        document.onmouseup = function() {
            document.removeEventListener('mousemove', onMouseMove);
            document.onmouseup = null;
        };
    };


    header.ondragstart = function() { return false; };
});


document.getElementById('desktop').addEventListener('mousedown', (e) => {
    if (e.target.id === 'desktop') {
        document.getElementById('start-menu').classList.add('hidden');
    }
});