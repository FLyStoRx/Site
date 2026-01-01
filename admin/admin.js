window.addEventListener("DOMContentLoaded", () => {
  if(localStorage.getItem("adminLoggedIn") !== "true"){
    window.location.href = "login.html";
  }

  let data = JSON.parse(localStorage.getItem("copyflixData") || '{"folders":[],"films":[]}');
  const treeView = document.getElementById("tree-view");
  const panel = document.getElementById("panel");
  const panelTitle = document.getElementById("panel-title");
  const panelForm = document.getElementById("panel-form");

  document.getElementById("btn-logout").addEventListener("click", logout);
  document.getElementById("btn-add-folder").addEventListener("click", () => openPanel("Folder"));
  document.getElementById("btn-add-film").addEventListener("click", () => openPanel("Film"));
  document.getElementById("btn-close-panel").addEventListener("click", closePanel);
  panelForm.addEventListener("submit", submitForm);

  let draggedItem = null;

  function openPanel(type, item = null) {
    panel.style.display = "block";
    panelTitle.textContent = type === "Folder" ? "Ajouter Dossier" : "Ajouter Film/Série";
    document.getElementById("item-type").value = type;
    populateParentOptions();

    document.getElementById("video-field").style.display = (type==="Folder") ? "none" : "block";
    document.getElementById("item-type").style.display = (type==="Folder") ? "none" : "block";

    if(item){
      document.getElementById("item-id").value = item.id;
      document.getElementById("item-title").value = item.title;
      document.getElementById("item-image").value = item.image || "";
      document.getElementById("item-video").value = item.video || "";
      if(type !== "Folder") document.getElementById("item-type").value = item.type;
    }
  }

  function closePanel() {
    panel.style.display = "none";
    panelForm.reset();
  }

  function populateParentOptions() {
    const parentSelect = document.getElementById("item-parent");
    parentSelect.innerHTML = '<option value="">-- Aucun --</option>';

    function addOptions(folders, prefix="") {
      folders.forEach(f => {
        const opt = document.createElement("option");
        opt.value = f.id;
        opt.textContent = prefix + f.title;
        parentSelect.appendChild(opt);
        if(f.children) addOptions(f.children, prefix + "— ");
      });
    }

    addOptions(data.folders);
  }

  function submitForm(e){
    e.preventDefault();
    const id = document.getElementById("item-id").value || "id-"+Date.now();
    const title = document.getElementById("item-title").value;
    const type = document.getElementById("item-type").value;
    const parentId = document.getElementById("item-parent").value;
    const image = document.getElementById("item-image").value;
    const video = document.getElementById("item-video").value;

    const newItem = {id,title,type,image,video,children:[]};

    const existing = findItem(id,data);
    if(existing){
      Object.assign(existing,newItem);
    } else {
      if(type==="Folder"){
        if(!parentId) data.folders.push(newItem);
        else findItem(parentId,data).children.push(newItem);
      } else {
        if(!parentId) data.films.push(newItem);
        else findItem(parentId,data).children.push(newItem);
      }
    }
    saveData();
    renderTree();
    closePanel();
  }

  function renderTree() {
    treeView.innerHTML = "";
    data.folders.forEach(f=>renderItem(f, treeView,0));
    data.films.forEach(f=>renderItem(f, treeView,0));
  }

  function renderItem(item,parent,level){
    const div = document.createElement("div");
    div.className = "tree-item";
    div.dataset.id = item.id;
    div.style.marginLeft = (level*20)+"px";

    const span = document.createElement("span");
    span.textContent = item.title;
    div.appendChild(span);

    const btns = document.createElement("div");
    btns.className="tree-buttons";

    const mod = document.createElement("button");
    mod.innerHTML="✏️";
    mod.title="Modifier";
    mod.addEventListener("click",(e)=>{
      e.stopPropagation();
      openPanel(item.type==="Folder"?"Folder":item.type,item);
    });

    const del = document.createElement("button");
    del.innerHTML="🗑";
    del.title="Supprimer";
    del.addEventListener("click",(e)=>{
      e.stopPropagation();
      openDeletePanel(item);
    });

    btns.appendChild(mod);
    btns.appendChild(del);
    div.appendChild(btns);

    // DRAG & DROP
    div.draggable = true;
    div.addEventListener("dragstart",(e)=>{ draggedItem = item; e.dataTransfer.effectAllowed="move"; });
    div.addEventListener("dragover",(e)=>{ e.preventDefault(); });
    div.addEventListener("drop",(e)=>{
      e.preventDefault();
      if(!draggedItem || draggedItem.id===item.id) return;
      const parentArr = getParentArray(item.id);
      const draggedIndex = parentArr.findIndex(i=>i.id===draggedItem.id);
      const targetIndex = parentArr.findIndex(i=>i.id===item.id);
      if(draggedIndex===-1 || targetIndex===-1) return;
      parentArr.splice(draggedIndex,1);
      parentArr.splice(targetIndex,0,draggedItem);
      saveData();
      renderTree();
      draggedItem=null;
    });

    parent.appendChild(div);

    if(item.children && item.children.length>0){
      item.children.forEach(c=>renderItem(c,parent,level+1));
    }
  }

  function getParentArray(id){
    const parent = findParent(id,data) || data;
    return parent.children || (parent===data? data.films : []);
  }

  function findItem(id,obj){
    const arr = obj.folders ? obj.folders.concat(obj.films||[]) : obj;
    for(const i of arr){
      if(i.id===id) return i;
      if(i.children){
        const found = findItem(id,i.children);
        if(found) return found;
      }
    }
    return null;
  }

  function findParent(id,obj,parent=null){
    const arr = obj.folders ? obj.folders.concat(obj.films||[]) : obj;
    for(const i of arr){
      if(i.id===id) return parent;
      if(i.children){
        const found = findParent(id,i.children,i);
        if(found) return found;
      }
    }
    return null;
  }

  function saveData(){ localStorage.setItem("copyflixData",JSON.stringify(data)); }

  function logout(){ 
    localStorage.removeItem("adminLoggedIn"); 
    window.location.href="../index.html"; 
  }

  function openDeletePanel(item){
    const delDiv = document.createElement("div");
    delDiv.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:2000";
    const box = document.createElement("div");
    box.style.cssText="background:#1c1c1c;padding:30px;border-radius:12px;text-align:center;min-width:300px";
    const txt = document.createElement("p");
    txt.textContent=`Supprimer "${item.title}" ?`;
    txt.style.marginBottom="20px";
    box.appendChild(txt);

    const yes = document.createElement("button");
    yes.textContent="Oui"; yes.style.marginRight="15px";
    yes.onclick=()=>{
      const parentArr = getParentArray(item.id);
      const index = parentArr.findIndex(i=>i.id===item.id);
      if(index!==-1) parentArr.splice(index,1);
      saveData();
      renderTree();
      document.body.removeChild(delDiv);
    };

    const no = document.createElement("button");
    no.textContent="Non"; no.onclick=()=>document.body.removeChild(delDiv);

    box.appendChild(yes); box.appendChild(no); delDiv.appendChild(box);
    document.body.appendChild(delDiv);
  }

  renderTree();
});
