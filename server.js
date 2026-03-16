```javascript
// server.js
const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const MULE_TABLE_URL =
  process.env.MULE_TABLE_URL ||
  "https://maths-table-jik9pb.5sc6y6-3.usa-e2.cloudhub.io/table";

/* ---------- Diagnostics ---------- */
app.use((req, res, next) => {
  res.setHeader("X-App", "Maths-UI");
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/* ---------- Health ---------- */
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    node: process.version,
    muleTableUrl: MULE_TABLE_URL
  });
});

/* ---------- Inline UI ---------- */
const UI_HTML = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8"/>
<title>Maths Table App</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<style>

:root{
--bg:#0b1020;
--bg2:#0e1530;
--card:#121a2f;
--text:#eef3ff;
--accent:#4ae387;
--accent2:#5aa1ff;
--radius:16px;
}

[data-theme="light"]{
--bg:#f3f6ff;
--bg2:#ffffff;
--card:#ffffff;
--text:#10163a;
--accent:#2563eb;
--accent2:#7c3aed;
}

[data-theme="neon"]{
--bg:#020617;
--bg2:#020617;
--card:#050a20;
--text:#00f7ff;
--accent:#00f7ff;
--accent2:#ff00ff;
}

body{
margin:0;
background:linear-gradient(180deg,var(--bg),var(--bg2));
color:var(--text);
font-family:system-ui;
padding:20px;
}

.card{
background:var(--card);
padding:20px;
border-radius:var(--radius);
max-width:550px;
margin:auto;
box-shadow:0 20px 40px rgba(0,0,0,.45);
}

.btn{
padding:10px 16px;
border:none;
border-radius:12px;
background:linear-gradient(135deg,var(--accent),var(--accent2));
cursor:pointer;
margin-right:6px;
}

.keypad{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:10px;
margin-top:20px;
}

.key{
background:rgba(255,255,255,.1);
padding:18px;
border-radius:50%;
text-align:center;
font-weight:bold;
cursor:pointer;
transition:.15s;
}

.key:active{
transform:scale(.9);
}

.result{
margin-top:20px;
white-space:pre-wrap;
font-family:monospace;
background:rgba(255,255,255,.05);
padding:12px;
border-radius:12px;
}

.tab{
margin-top:10px;
}

</style>
</head>

<body>

<div class="card">

<h2>Maths Table</h2>

<div>Number: <span id="num"></span></div>
<div>Start: <span id="str">1</span></div>
<div>End: <span id="end"></span></div>

<div class="tab">
<button class="btn" id="computeBtn">Compute</button>
<button class="btn" id="clearBtn">Clear</button>
<button class="btn" id="themeBtn">Theme</button>
<button class="btn" id="graphBtn">Graph</button>
<button class="btn" id="quizBtn">Quiz</button>
</div>

<div class="result" id="resultBox">Result will appear here</div>

<canvas id="chart" style="margin-top:20px"></canvas>

<div class="keypad" id="pad">
<div class="key">7</div>
<div class="key">8</div>
<div class="key">9</div>
<div class="key">4</div>
<div class="key">5</div>
<div class="key">6</div>
<div class="key">1</div>
<div class="key">2</div>
<div class="key">3</div>
<div class="key">0</div>
<div class="key">.</div>
<div class="key">-</div>
</div>

</div>

<script>

var $ = id => document.getElementById(id);
var active="num";

/* Tap sound */
var audioCtx;

function clickSound(){
try{
audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
var o = audioCtx.createOscillator();
var g = audioCtx.createGain();
o.type="triangle";
o.frequency.value=300;
g.gain.setValueAtTime(.0001,audioCtx.currentTime);
g.gain.exponentialRampToValueAtTime(.15,audioCtx.currentTime+.01);
g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.08);
o.connect(g);
g.connect(audioCtx.destination);
o.start();
o.stop(audioCtx.currentTime+.08);
}catch(e){}
}

/* keypad */
$("pad").onclick=e=>{
var k=e.target.closest(".key");
if(!k)return;
clickSound();
var v=k.textContent;
var cur=$(active).textContent;
$(active).textContent=cur+v;
}

/* compute */
$("computeBtn").onclick=async()=>{

clickSound();

var num=Number($("num").textContent);
var str=Number($("str").textContent);
var end=Number($("end").textContent);

var res=await fetch("/api/table",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({num,str,end})
});

var data=await res.json();

if(Array.isArray(data)){
$("resultBox").textContent=data.join("\\n").replaceAll(" x "," × ");
window.currentTable=data;
}else{
$("resultBox").textContent=JSON.stringify(data,null,2);
}

}

/* graph */
$("graphBtn").onclick=()=>{

if(!window.currentTable)return;

var nums=[];
var vals=[];

window.currentTable.forEach(line=>{
var parts=line.split("=");
vals.push(Number(parts[1]));
nums.push(nums.length+1);
});

new Chart(document.getElementById("chart"),{
type:"line",
data:{
labels:nums,
datasets:[{label:"Table",data:vals}]
}
});

}

/* quiz */
$("quizBtn").onclick=()=>{

var n=Number($("num").textContent);
var r=Math.floor(Math.random()*10)+1;

var ans=prompt(n+" × "+r+" = ?");

if(Number(ans)===n*r)
alert("Correct!");
else
alert("Wrong. Answer: "+(n*r));

}

/* clear */
$("clearBtn").onclick=()=>{
clickSound();
$("num").textContent="";
$("str").textContent="1";
$("end").textContent="";
$("resultBox").textContent="Result will appear here";
}

/* theme */
var themes=["dark","light","neon"];
var index=0;

$("themeBtn").onclick=()=>{
clickSound();
index=(index+1)%themes.length;
document.documentElement.setAttribute("data-theme",themes[index]);
}

</script>

</body>
</html>`;

/* ---------- Serve UI ---------- */
app.get("/", (_req, res) => res.type("html").send(UI_HTML));
app.get("/ui", (_req, res) => res.type("html").send(UI_HTML));

/* ---------- Proxy to Mule ---------- */
async function safeParse(resp) {
  const text = await resp.text();
  try { return { ok: true, data: JSON.parse(text), raw: text }; }
  catch { return { ok: false, data: null, raw: text }; }
}

app.post("/api/table", async (req, res) => {
  try {
    const { num, str, end } = req.body || {};

    if (num === undefined || str === undefined || end === undefined) {
      return res.status(400).json({ error: "Body must include num, str, end" });
    }

    const upstream = await fetch(MULE_TABLE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ num, str, end })
    });

    const parsed = await safeParse(upstream);

    if (!upstream.ok) {
      return res.status(upstream.status).json(parsed.ok ? parsed.data : { rawResponse: parsed.raw });
    }

    return res.json(parsed.ok ? parsed.data : { raw: parsed.raw });

  } catch (e) {
    res.status(500).json({ error: "Proxy error", details: e.message });
  }
});

/* ---------- Catch-all ---------- */
app.get(/^\\/(?!api|health).*$/, (_req, res) => res.type("html").send(UI_HTML));

app.listen(PORT, () => console.log("Maths UI running on port " + PORT));
```
