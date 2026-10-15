import { chromium } from "playwright-core";
import fs from "node:fs";
fs.mkdirSync(".tmp-shots",{recursive:true});
const b = await chromium.launch({ channel: "msedge" });
const c = await b.newContext({ viewport:{width:1920,height:1080}});
const p = await c.newPage();
await p.goto("http://localhost:3000/",{waitUntil:"load"});
await p.waitForTimeout(1500);
const h = await p.evaluate(()=>document.documentElement.scrollHeight);
for (let y=0;y<h;y+=700){ await p.evaluate(v=>window.scrollTo(0,v),y/1.25); await p.waitForTimeout(350);}
await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(400);
await p.screenshot({path:".tmp-shots/full-before.png", fullPage:true});
console.log(h);
await b.close();
