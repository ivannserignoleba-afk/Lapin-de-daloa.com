const KEY='lapinDaloaProducts', HKEY='lapinDaloaMoves';
const money=n=>Number(n||0).toLocaleString('fr-FR')+' FCFA';
const products=()=>JSON.parse(localStorage.getItem(KEY)||'[]');
const moves=()=>JSON.parse(localStorage.getItem(HKEY)||'[]');
const saveProducts=x=>localStorage.setItem(KEY,JSON.stringify(x));
const saveMoves=x=>localStorage.setItem(HKEY,JSON.stringify(x));

function showSection(id){
  document.querySelectorAll('.section').forEach(s=>s.hidden=s.id!==id);
  document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.section===id));
  const titles={dashboard:'Tableau de bord',products:'Préparations',movements:'Entrées / Sorties',history:'Historique'};
  document.getElementById('pageTitle').textContent=titles[id]||'Gestion';
  if(id==='dashboard')renderDashboard();
  if(id==='products')renderProducts();
  if(id==='movements')fillMoveProducts();
  if(id==='history')renderHistory();
}
window.showSection=showSection;
document.querySelectorAll('.nav').forEach(n=>n.addEventListener('click',()=>showSection(n.dataset.section)));

document.getElementById('logout').addEventListener('click',()=>{
  sessionStorage.removeItem('lapinAdmin');
  location.href='login.html';
});

function renderDashboard(){
 const ps=products(),ms=moves();
 document.getElementById('totalStock').textContent=ps.reduce((a,p)=>a+Number(p.stock||0),0);
 document.getElementById('totalIn').textContent=ms.filter(m=>m.type==='in').reduce((a,m)=>a+Number(m.qty||0),0);
 document.getElementById('totalOut').textContent=ms.filter(m=>m.type==='out').reduce((a,m)=>a+Number(m.qty||0),0);
 document.getElementById('revenue').textContent=money(ms.filter(m=>m.type==='out').reduce((a,m)=>a+Number(m.qty||0)*Number(m.price||0),0));
 document.getElementById('stockTable').innerHTML=tableStock(ps);
}
function tableStock(ps){
 if(!ps.length)return '<div class="empty">Aucune préparation enregistrée.</div>';
 return '<table class="table"><tr><th>Préparation</th><th>Catégorie</th><th>Stock</th><th>Prix</th><th>État</th></tr>'+ps.map(p=>`<tr><td><b>${p.name}</b></td><td>${p.category}</td><td><b>${p.stock}</b></td><td>${money(p.price)}</td><td><span class="badge ${p.stock===0?'out':p.stock<=3?'low':'ok'}">${p.stock===0?'RUPTURE':p.stock<=3?'STOCK FAIBLE':'DISPONIBLE'}</span></td></tr>`).join('')+'</table>';
}
function renderProducts(){
 const ps=products();
 document.getElementById('productsTable').innerHTML=ps.length?'<table class="table"><tr><th>Produit</th><th>Catégorie</th><th>Poids</th><th>Prix</th><th>Stock</th><th>Action</th></tr>'+ps.map(p=>`<tr><td><b>${p.name}</b><br><small>${p.id}</small></td><td>${p.category}</td><td>${p.weight}</td><td>${money(p.price)}</td><td>${p.stock}</td><td class="product-actions"><button onclick="editProduct('${p.id}')">Modifier</button><button onclick="deleteProduct('${p.id}')">Supprimer</button></td></tr>`).join('')+'</table>':'<div class="empty">Aucune préparation.</div>';
}
window.editProduct=id=>{
 const ps=products(),p=ps.find(x=>x.id===id);if(!p)return;
 const name=prompt('Nom de la préparation',p.name);if(name===null)return;
 const price=prompt('Prix en FCFA',p.price);if(price===null)return;
 const weight=prompt('Poids',p.weight);if(weight===null)return;
 p.name=name.trim()||p.name;p.price=Number(price)||0;p.weight=weight.trim()||p.weight;
 saveProducts(ps);renderProducts();renderDashboard();fillMoveProducts();
};
window.deleteProduct=id=>{
 if(confirm('Supprimer cette préparation ?')){saveProducts(products().filter(p=>p.id!==id));renderProducts();renderDashboard();fillMoveProducts();}
};

document.getElementById('addProduct').addEventListener('click',()=>{
 const name=prompt('Nom de la préparation');if(!name)return;
 const price=Number(prompt('Prix en FCFA','8000')||0);
 const stock=Number(prompt('Stock initial','0')||0);
 const weight=prompt('Poids','1 kg')||'';
 const category=prompt('Catégorie : entier, portion ou grille','entier')||'entier';
 const image=prompt('URL de la photo','')||'';
 const p={id:'LP-'+Date.now().toString().slice(-6),name:name.trim(),category,weight,price,stock,image};
 saveProducts([...products(),p]);
 if(stock>0)saveMoves([{date:new Date().toISOString(),type:'in',product:p.name,qty:stock,price,note:'Stock initial'},...moves()]);
 renderProducts();renderDashboard();fillMoveProducts();
});

function fillMoveProducts(){
 const select=document.getElementById('moveProduct'),ps=products();
 select.innerHTML=ps.length?ps.map(p=>`<option value="${p.id}">${p.name} — stock ${p.stock}</option>`).join(''):'<option value="">Aucune préparation</option>';
 const p=ps[0];if(p)document.getElementById('movePrice').value=p.price;
}
document.getElementById('moveProduct').addEventListener('change',e=>{const p=products().find(x=>x.id===e.target.value);if(p)document.getElementById('movePrice').value=p.price;});

document.getElementById('saveMove').addEventListener('click',()=>{
 const type=document.getElementById('moveType').value,id=document.getElementById('moveProduct').value,qty=Number(document.getElementById('moveQty').value),price=Number(document.getElementById('movePrice').value),note=document.getElementById('moveNote').value.trim();
 const ps=products(),p=ps.find(x=>x.id===id),msg=document.getElementById('moveMsg');
 if(!p||qty<1){msg.className='error';msg.textContent='Vérifiez la préparation et la quantité.';return;}
 if(type==='out'&&p.stock<qty){msg.className='error';msg.textContent='Stock insuffisant : '+p.stock+' disponible(s).';return;}
 p.stock+=type==='in'?qty:-qty;saveProducts(ps);
 saveMoves([{date:new Date().toISOString(),type,product:p.name,qty,price,note},...moves()]);
 msg.className='success';msg.textContent=type==='in'?'Entrée enregistrée avec succès.':'Sortie / vente enregistrée avec succès.';
 document.getElementById('moveQty').value=1;document.getElementById('moveNote').value='';
 renderDashboard();fillMoveProducts();
});

function renderHistory(){
 const ms=moves();
 document.getElementById('historyTable').innerHTML=ms.length?'<table class="table"><tr><th>Date</th><th>Type</th><th>Préparation</th><th>Qté</th><th>Prix</th><th>Note</th></tr>'+ms.map(m=>`<tr><td>${new Date(m.date).toLocaleString('fr-FR')}</td><td><span class="badge ${m.type==='in'?'ok':'out'}">${m.type==='in'?'ENTRÉE':'SORTIE'}</span></td><td>${m.product}</td><td>${m.qty}</td><td>${money(m.price)}</td><td>${m.note||'—'}</td></tr>`).join('')+'</table>':'<div class="empty">Aucun mouvement enregistré.</div>';
}
document.getElementById('clearHistory').addEventListener('click',()=>{
 if(confirm('Effacer tout l’historique ? Le stock actuel ne sera pas modifié.')){saveMoves([]);renderHistory();renderDashboard();}
});

document.getElementById('today').textContent=new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
renderDashboard();
