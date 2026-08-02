import{c as l,j as e,A as x,m as n}from"./index-TYmo71CB.js";import{B as r}from"./Button-_Ym-08G8.js";/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=l("Inbox",[["polyline",{points:"22 12 16 12 14 15 10 15 8 12 2 12",key:"o97t9d"}],["path",{d:"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",key:"oot6mr"}]]);/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=l("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=l("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);function u({open:c,onClose:t,title:s,children:a,size:i="md"}){const m={sm:"max-w-sm",md:"max-w-md",lg:"max-w-lg",xl:"max-w-2xl"};return e.jsx(x,{children:c&&e.jsx(n.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},className:"fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm",onClick:t,children:e.jsxs(n.div,{initial:{opacity:0,scale:.95,y:10},animate:{opacity:1,scale:1,y:0},exit:{opacity:0,scale:.95,y:10},transition:{type:"spring",duration:.3},className:`w-full ${m[i]} rounded-2xl bg-surface border border-border shadow-card p-6`,onClick:o=>o.stopPropagation(),children:[e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[s&&e.jsx("h2",{className:"text-lg font-semibold",children:s}),e.jsx(r,{variant:"ghost",size:"sm",onClick:t,"aria-label":"Close",children:e.jsx(y,{size:18})})]}),a]})})})}function f({icon:c=d,title:t,description:s,actionLabel:a,onAction:i}){return e.jsxs("div",{className:"flex flex-col items-center justify-center py-16 px-6 text-center",children:[e.jsx("div",{className:"w-16 h-16 rounded-2xl bg-border/30 flex items-center justify-center mb-4",children:e.jsx(c,{size:28,className:"text-muted"})}),e.jsx("h3",{className:"text-lg font-semibold mb-1",children:t}),s&&e.jsx("p",{className:"text-sm text-muted max-w-sm mb-6",children:s}),a&&i&&e.jsx(r,{onClick:i,children:a})]})}export{f as E,u as M,b as T,y as X};
