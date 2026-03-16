// server.js
const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Mule endpoint for tables
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
<title>Maths Table</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>

<style>

:root{
--bg:#0b1020;
--bg2:#0e1530;
--card:#121a2f;
--text:#eef3ff;
--muted:#9aa7cc;
--accent:#4ae387;
--accent2:#5aa1ff;
--danger:#ff7a7a;
--shadow:0 20px 40px rgba(0,0,0,.45);
--radius:16px;
}

/* Better Light Theme */
[data-theme="light"]{
--bg:#f3f6ff;
--bg2:#ffffff;
--card:#ffffff;
--text:#10163a;
--muted:#5a648a;
--accent:#2563eb;
--accent2:#7c3aed;
--danger:#dc2626;
--shadow:0 12px 30px rgba(0,0,0,.08);
}

/* Neon Theme */
[data-theme="neon"]{
--bg:#020617;
--bg2:#020617;
--card:#050a20;
--text:#00f7ff;
--muted:#6ee7ff;
--accent:#00f7ff;
--accent2:#ff00ff;
--danger:#ff3b3b;
--shadow:0 0 30px rgba(0,255,255,.25);
}

body{
margin:0;
background:linear-gradient(180deg,var(--bg),var(--bg2));
color:var(--text);
font-family:system-ui;
padding:20px;
}

/* animated cards */
.card{
background:var(--card);
padding:20px;
border-radius:var(--radius);
box-shadow:var(--shadow);
transition:.25s;
}

.card:hover{
transform:translateY(-4px);
}

.btn{
padding:10px 16px;
border-radius:12px;
border:none;
cursor:pointer;
background:linear-gradient(135deg,var(--accent),var(--accent2));
color:#061127;
transition:.2s;
}

.btn:hover{
transform:translateY(-2px);
}

.keypad{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:10px;
margin-top:20px;
}

.key{
background:rgba(255,255,255,.1);
padding:16px;
border-radius:12px;
text-align:center;
cursor:pointer;
font-weight:bold;
transition:.1s;
}

.key:active{
transform:scale(.92);
}

.result-box{
margin-top:20px;
padding:12px;
border-radius:12px;
background:rgba(255,255,255,.05);
font-family:monospace;
white-space:pre-wrap;
animation:fade .3s;
}

@keyframes fade{
from{opacity:0;transform:scale(.98)}
to{opacity:1;transform:scale(1)}
}

</style>
</head>

<body>

<div class="card">

<h2>Maths Table</h2>

<div>
Number:
<div id="num"></div>
Start:
<div id="str">1</div>
End:
<div id="end"></div>
</div>

<div style="margin-top:10px">
<button class="btn" id="computeBtn">Compute</button>
<button class="btn" id="clearBtn">Clear</button>
<button class="btn" id="themeBtn">Theme</button>
</div>

<div class="result-box" id="resultBox">
Result will appear here
</div>

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

var active="num";

var $=id=>document.getElementById(id);

/* tap sound */
var audioCtx;

function clickSound(){
try{
audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();
var o=audioCtx.createOscillator();
var g=audioCtx.createGain();

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
}else{
$("resultBox").textContent=JSON.stringify(data,null,2);
}

}

/* clear */
$("clearBtn").onclick=()=>{
clickSound();
$("num").textContent="";
$("str").textContent="1";
$("end").textContent="";
$("resultBox").textContent="Result will appear here";
}

/* theme cycle */
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

    res.json(parsed.ok ? parsed.data : { raw: parsed.raw });

  } catch (e) {
    res.status(500).json({ error: "Proxy error", details: e.message });
  }
});

/* ---------- 404 ---------- */
app.use((req, res) => res.status(404).json({ error: "Not Found", path: req.path }));

app.listen(PORT, () => console.log("Maths UI running on port " + PORT));
