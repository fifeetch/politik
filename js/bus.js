/* Politik — le bus d'événements (socle P1).
   Le son et les animations à venir s'abonnent ici, au lieu d'ajouter des appels un peu partout dans l'interface.
   Aucun lien avec l'affichage : ce fichier tourne aussi sous Node. Les moteurs (engine.js, govern.js) n'en dépendent pas.

   API :
     PolitikBus.on(nom, fn)      abonne fn(donnees) ; renvoie une fonction qui désabonne
     PolitikBus.off(nom, fn)     désabonne fn (sans fn : tous les abonnés de ce nom)
     PolitikBus.emit(nom, data)  prévient les abonnés, dans l'ordre d'abonnement ; renvoie leur nombre

   Un abonné qui plante n'arrête ni les autres abonnés, ni le jeu : l'erreur part dans la console.

   Événements émis aujourd'hui :
     nav:go              { name, from }             un écran vient de s'afficher (from : l'écran d'avant, ou null)
     ui:modal-open       { kicker, title, cls }     une fenêtre s'ouvre (ou remplace la précédente)
     ui:modal-close      {}                         la fenêtre ouverte vient de se fermer
     ui:toast            { msg }                    un message court s'affiche
     ui:infobulle-open   { id, niveau, mode }       une infobulle s'ouvre (mode : 'survol' ou 'fixe')
     ui:infobulle-close  { id, niveau }             une infobulle se ferme */
(function (root) {
  var subs = Object.create(null);   // sans héritage : emit('constructor') ne trouve rien

  function on(name, fn) {
    (subs[name] || (subs[name] = [])).push(fn);
    return function () { off(name, fn); };
  }
  function off(name, fn) {
    if (!subs[name]) return;
    if (!fn) { delete subs[name]; return; }
    var i = subs[name].indexOf(fn);
    if (i >= 0) subs[name] = subs[name].slice(0, i).concat(subs[name].slice(i + 1));
    if (!subs[name].length) delete subs[name];
  }
  function emit(name, data) {
    var list = subs[name];   // off() recrée le tableau : on peut se désabonner pendant l'envoi
    if (!list) return 0;
    list.forEach(function (fn) {
      try { fn(data); } catch (er) { if (typeof console !== 'undefined') console.error('PolitikBus « ' + name + ' » :', er); }
    });
    return list.length;
  }

  var API = { on: on, off: off, emit: emit };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.PolitikBus = API;
})(this);
