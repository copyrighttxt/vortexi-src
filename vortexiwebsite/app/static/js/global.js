
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtns = document.querySelectorAll('.toggle-sidebar'); // all toggle buttons
    const sidebar = document.querySelector('.sidebar');

    toggleBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('show');
        });
    });

    document.addEventListener('click', (e) => {
        if (
            window.innerWidth <= 992 &&
            sidebar.classList.contains('show') &&
            !sidebar.contains(e.target) &&
            !Array.from(toggleBtns).some(btn => btn.contains(e.target))
        ) {
            sidebar.classList.remove('show');
        }
    });
});



function abbreviateNumber(value) {
    value = parseInt(value);
    if (value >= 1e9) return (value / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return value.toString();
}

document.addEventListener("DOMContentLoaded", () => {
    const robuxEl = document.getElementById("robux-amount");
    const tixEl = document.getElementById("tix-amount");

    if (robuxEl) {
        const rawRobux = robuxEl.textContent.trim();
        robuxEl.textContent = abbreviateNumber(rawRobux);
    }

    if (tixEl) {
        const rawTix = tixEl.textContent.trim();
        tixEl.textContent = abbreviateNumber(rawTix);
    }
});

const modal = document.getElementById('purchaseModal');
if (modal && modal.parentNode !== document.body) {
    document.body.appendChild(modal);
}
document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth <= 768) {
        const footer = document.getElementById('footer');
        if (footer) {
            footer.remove();
        }
    }
});
function heartbeat() {
    fetch('/v1/heartbeat')
        .then(response => response.json())
        .then(data => {
            if (data.success !== "true") {
                location.reload();
            }
        })
        .catch(() => {
            location.reload();
        });
}

heartbeat();
setInterval(heartbeat, 15000);
