let data = JSON.parse(localStorage.getItem("copyflixData") || '{"folders":[],"films":[]}');

document.getElementById("btn-export-for-github").addEventListener("click", () => {
    const jsonString = JSON.stringify(data, null, 2);
    const exportBox = document.getElementById("export-json");
    exportBox.style.display = "block";
    exportBox.textContent = jsonString;
    alert("Copie ce JSON et remplace-le dans index.html pour mettre à jour le site !");
});

// reste du code admin (ajout, suppression, modification, drag & drop)
// inchangé par rapport à ce que tu avais précédemment
