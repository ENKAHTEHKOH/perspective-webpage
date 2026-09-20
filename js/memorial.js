const names = [
    "Leigh Matthews", "Eudy Simelane", "Anene Booysen", "Reeva Steenkamp",
    "Franziska Blöchliger", "Karabo Mokoena", "Hannah Cornelius", "Nombuyiselo Nombewu",
    "Uyinene Mrwetyana", "Tshegofatso Pule", "Tazne van Wyk", "Luyanda Nkambule",
    "Nompumelelo Tshaka", "Nosicelo Mtebeni", "Nokwanda Maguga-Patocka", "Hillary Gardee",
    "Sasha Lee Monique Shah", "Thembeka Nomfundo Bembe", "Tania Msane Zungu", "Ntokozo Mayenzi Xaba",
    "Luyanda Cele", "Mahlako Malebo Rabalao", "Thimna Kuze", "Delana Cader Rawlins",
    "Jabulile Hope Mhluzi", "Naeema Marshall", "Nonkululeko Gabriella Ndaba", "Mamello Thamae",
    "Marolien Schmidt", "Kirsten Kluyts", "Mandy Bailey", "Tia Ashleigh Robinson",
    "Yolanda Bianca Khuzwayo", "Ramrathee 'Devi' Rajcoomar", "Nokubonga Nomsindisi Tobela-Mjoli",
    "Asiphe Cetywayo", "Xoliswa Radebe", "Zanele Faith Mokoena", "Nondumiso Amanda Ginindza",
    "Melanie Jackson", "Thembekile Charlotte Letlape", "Phume Nhlangulela", "Wandile Ngcobo",
    "Zintle Takane", "Amogelang Modiselle", "Melanie Stoffels", "Nqobile Hlophe",
    "Dorcas Lekganyane", "Fezeka Ndlovu", "Mamohlotsi Rebecca Nchabeleng", "Deveney Nel",
    "Gontse Ntseza", "Aviwe Mqikela", "Linell du Toit", "Thina Masa", "Ntobeko MaNdosi Cele",
    "Bongeka Makhathini", "Ramaabele Sophy Mothapo", "Abongile Matina", "Chesnay Patricia Keppler",
    "Zakithi Zasemhlungwini Ndaba", "Olorato Mongale", "Itumeleng Kekana", "Elizabeth Moselakgomo"
];

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('scatter-container');
    const nameElements = [];

    // 1. Generate elements with random coordinates
    names.forEach((nameText, index) => {
        const el = document.createElement('div');
        el.className = 'scatter-name';
        el.textContent = nameText;

        // Random positioning across the tall canvas
        const randomX = Math.random() * 80 + 10; // 10% to 90% width
        const randomY = Math.random() * 3500 + 200; // Spread vertically across 3500px

        el.style.left = `${randomX}%`;
        el.style.top = `${randomY}px`;

        // Store original position and a random speed multiplier for parallax scattering
        el.dataset.speed = (Math.random() * 0.5 + 0.5).toFixed(2);
        
        container.appendChild(el);
        nameElements.push(el);
    });

    // 2. High-performance scroll handler
    let ticking = false;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // Fade out intro text after scrolling past a small threshold
        const intro = document.querySelector('.intro-overlay');
        intro.style.opacity = scrollY > 100 ? '0' : '1';

        if (!ticking) {
            window.requestAnimationFrame(() => {
                nameElements.forEach(el => {
                    const speed = parseFloat(el.dataset.speed);
                    // Scatter/drift effect: shift upwards or outwards based on scroll depth
                    const yOffset = scrollY * speed * 0.3;
                    el.style.transform = `translateY(-${yOffset}px)`;
                });
                ticking = false;
            });
            ticking = true;
        }
    });
});