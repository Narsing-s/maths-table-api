// server.js
const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Mule endpoint
const MULE_TABLE_URL = process.env.MULE_TABLE_URL || "https://maths-table-jik9pb.5sc6y6-3.usa-e2.cloudhub.io/table";

/* ---------- Diagnostics ---------- */
app.use((req, res, next) => {
  res.setHeader("X-App", "Maths-UI");
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/* ---------- Health ---------- */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", node: process.version, muleTableUrl: MULE_TABLE_URL });
});

/* ---------- UI ---------- */

const UI_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Maths Table</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />

<style>

:root{
--accent:#4ae387;
--accent2:#5aa1ff;
--card:#121a2f;
--text:#eef3ff;
}

*{box-sizing:border-box}

body{
margin:0;
font-family:system-ui;
color:var(--text);
background:linear-gradient(270deg,#0b1020,#162a63,#0e1530,#1b2b65);
background-size:600% 600%;
animation:bg 12s ease infinite;
padding:30px;
}

@keyframes bg{
0%{background-position:0% 50%}
50%{background-position:100% 50%}
100%{background-position:0% 50%}
}

.wrap{max-width:800px;margin:auto}

.card{
background:var(--card);
padding:25px;
border-radius:16px;
box-shadow:0 20px 40px rgba(0,0,0,.4);
}

h2{margin-top:0}

.fields{
display:grid;
grid-template-columns:1fr auto 1fr auto 1fr;
gap:12px;
margin-bottom:20px
}

.field{
display:flex;
flex-direction:column;
}

.input{
background:#1b2547;
border:none;
border-radius:10px;
padding:12px;
font-size:18px;
color:white;
outline:none;
}

.symbol{
display:flex;
align-items:center;
justify-content:center;
font-size:26px;
font-weight:bold
}

.btn{
margin-top:15px;
padding:12px 16px;
border:none;
border-radius:12px;
font-weight:bold;
background:linear-gradient(135deg,var(--accent),var(--accent2));
cursor:pointer
}

.result{
margin-top:15px;
background:#0f1633;
border-radius:10px;
padding:12px;
font-family:monospace;
white-space:pre-wrap;
max-height:320px;
overflow:auto
}

.keypad{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:10px;
margin-top:20px
}

.key{
height:60px;
border-radius:14px;
background:#1b2547;
display:flex;
align-items:center;
justify-content:center;
font-size:20px;
cursor:pointer;
transition:.15s
}

.key:hover{background:#28356d}
.key:active{transform:scale(.95)}

</style>
</head>

<body>

<div class="wrap">

<div class="card">

<h2>Math Table Generator</h2>

<div class="fields">

<div class="field">
<label>Number</label>
<input id="num" class="input" type="number" />
</div>

<div class="symbol">×</div>

<div class="field">
<label>Start</label>
<input id="str" class="input" type="number" value="1" />
</div>

<div class="symbol">=</div>

<div class="field">
<label>End</label>
<input id="end" class="input" type="number" />
</div>

</div>

<button class="btn" id="compute">Compute</button>

<div id="result" class="result">Result will appear here</div>

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
<div class="key">⌫</div>
<div class="key">C</div>
</div>

</div>

</div>

<script>

let active="num"

const clickSound=()=>{
try{
const ctx=new(window.AudioContext||window.webkitAudioContext)()
const osc=ctx.createOscillator()
const gain=ctx.createGain()
osc.connect(gain)
gain.connect(ctx.destination)
osc.frequency.value=200
osc.type="square"
gain.gain.setValueAtTime(.1,ctx.currentTime)
osc.start()
osc.stop(ctx.currentTime+.05)
}catch(e){}
}

const num=document.getElementById("num")
const str=document.getElementById("str")
const end=document.getElementById("end")

num.onclick=()=>active="num"
str.onclick=()=>active="str"
end.onclick=()=>active="end"

function getActiveInput(){
if(active==="num") return num
if(active==="str") return str
return end
}

const keys=document.querySelectorAll(".key")

keys.forEach(k=>{

k.onclick=()=>{

clickSound()

const t=k.textContent

const input=getActiveInput()

if(t==="C"){
num.value=""
str.value="1"
end.value=""
return
}

if(t==="⌫"){
input.value=input.value.slice(0,-1)
return
}

if(/[0-9]/.test(t)){
input.value=input.value+t
}

}

})

async function compute(){

clickSound()

const N=Number(num.value)
const S=Number(str.value)
const E=Number(end.value)

if(!N||!S||!E){
alert("Enter Number, Start and End")
return
}

const res=await fetch("/api/table",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({num:N,str:S,end:E})
})

const data=await res.json()

let out=""

if(Array.isArray(data)){
data.forEach(l=>out+=l+"\n")
}else{
out=JSON.stringify(data,null,2)
}

const box=document.getElementById("result")
box.textContent=out
box.scrollTop=box.scrollHeight

}


document.getElementById("compute").onclick=compute

</script>

</body>
</html>`;

/* ---------- Serve UI ---------- */
app.get("/", (_req, res) => res.type("html").send(UI_HTML));
app.get("/ui", (_req, res) => res.type("html").send(UI_HTML));

/* ---------- Proxy to Mule ---------- */

async function safeParse(resp) {
  const text = await resp.text();
  try {
    return { ok: true, data: JSON.parse(text), raw: text };
  } catch {
    return { ok: false, data: null, raw: text };
  }
}

app.post("/api/table", async (req, res) => {
  try {
    const { num, str, end } = req.body || {};

    if (num === undefined || str === undefined || end === undefined) {
      return res.status(400).json({ error: "Body must include num, str, end" });
    }

    const upstream = await fetch(MULE_TABLE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
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
app.get(/^\/(?!api|health).*$/, (_req, res) => res.type("html").send(UI_HTML));

app.use((req, res) => res.status(404).json({ error: "Not Found", path: req.path }));

app.listen(PORT, () => console.log("Maths UI running on port " + PORT));
