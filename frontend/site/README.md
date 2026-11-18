# Prothiese website shell

This folder is the static site root. `index.html` boots the original SkillSphere app;
`js/store.js` remains its isolated storage adapter. `js/views/clarum.js` mounts the
independently built React application under `/clarum/` after SkillSphere login.

Clarum's compiled files are generated from `services/clarum/frontend` into this
folder by `npm run build`. Do not edit the generated bundle by hand.
