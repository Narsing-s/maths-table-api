```javascript
const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const MULE_TABLE_URL =
process.env.MULE_TABLE_URL ||
"https://maths-table-jik9pb.5sc6y6-3.usa-e2.cloudhub.io/table";


/* ---------------- UI ---------------- */

const UI = `<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8">
<title>Animated Maths API UI</title>
<meta name="viewport" content="width=device-width,initial-scale=1">

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<style>

body{
margin:0;
font-family:system-ui;
color:white;
height:100vh;

background:linear-gradient(-45deg,#0f2027,#203a43,#2c5364,#1a2a6c);
background-size:400% 400%;

animation:bgMove 12s infinite linear;

display:flex;
justify-content:center;
align-items:center;
}

@keyframes bgMove{
0%{background-position:0 50%}
50%{background-position:100% 50%}
100%{background-position:0 50%}
}

/* Card */

.card{
backdrop-filter:blur(12px);
background:rgba(255,255,255,.1);
padding:30px;
border-radius:20px;
width:380px;
box-shadow:0 10px 40px rgba(0,0,0,.4);

animation:pop .6s ease;
}

@keyframes pop{
from{transform:scale(.7);opacity:0}
to{transform:scale(1);opacity:1}
}

h2{
margin-top:0;
text-align:center;
}

/* Buttons */

button{
border:none;
padding:10px 16px;
margin:4px;
border-radius:10px;
cursor:pointer;

background:linear-gradient(45deg,#00c6ff,#0072ff);
color:white;
font-weight:bold;

transition:.25s;
}

button:hover{
transform:translateY(-3px);
box-shadow:0 5px 15px rgba(0,0,0,.4);
}

/* Keypad */

.keypad{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:10px;
margin-top:20px;
}

.key{
background:rgba(255,255,255,.15);
padding:20px;
text-align:center;
border-radius:12px;
cursor:pointer;
font-size:18px;
transition:.15s;
}

.key:hover{
background:rgba(255,255,255,.25);
}

.key:active{
transform:scale(.9);
}

/* Result */

.result{
margin-top:20px;
white-space:pre-wrap;
font-family:monospace;
background:rgba(0,0,0,.3);
padding:10px;
border-radius:10px;
}

canvas{
margin-top:20px;
}

</style>
</head>

<body>

<div class="card">

<h2>Multiplication Table API</h2>

<div>Number: <span id="num"></span></div>
<div>Start: <span id="str">1</span></div>
<div>End: <span id="end">10</span></div>

<div>

<button onclick="setActive('num')">Set Number</button>
<button onclick="setActive('str')">Set Start</button>
<button onclick="setActive('end')">Set End</button>

</div>

<div>

<button onclick="compute()">Compute</button>
<button onclick="drawGraph()">Graph</button>
<button onclick="clearAll()">Clear</button>

</div>

<div class="result" id="resultBox"></div>

<canvas id="chart"></canvas>

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

const $ = id => document.getElementById(id)

let active="num"
let table=[]

/* Tap Sound */

let ctx

function tap(){

try{

ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()

const o = ctx.createOscillator()
const g = ctx.createGain()

o.frequency.value = 300

g.gain.setValueAtTime(.001,ctx.currentTime)
g.gain.exponentialRampToValueAtTime(.2,ctx.currentTime+.01)
g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.08)

o.connect(g)
g.connect(ctx.destination)

o.start()
o.stop(ctx.currentTime+.08)

}catch(e){}

}

/* Select Input */

function setActive(v){
active=v
}

/* Keypad */

document.getElementById("pad").onclick=e=>{

const k=e.target.closest(".key")
if(!k) return

tap()

$(active).textContent += k.textContent

}

/* Compute */

async function compute(){

tap()

const num=Number($("num").textContent)
const str=Number($("str").textContent)
const end=Number($("end").textContent)

const res=await fetch("/api/table",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({num,str,end})
})

const data=await res.json()

if(Array.isArray(data)){

table=data

$("resultBox").textContent=data.join("\\n").replaceAll(" x "," × ")

}else{

$("resultBox").textContent=JSON.stringify(data,null,2)

}

}

/* Graph */

function drawGraph(){

if(!table.length) return

const labels=[]
const vals=[]

table.forEach((l,i)=>{
const v=l.split("=")[1]
labels.push(i+1)
vals.push(Number(v))
})

new Chart($("chart"),{
type:"line",
data:{
labels:labels,
datasets:[{
label:"Multiplication",
data:vals
}]
}
})

}

/* Clear */

function clearAll(){

$("num").textContent=""
$("str").textContent="1"
$("end").textContent="10"
$("resultBox").textContent=""
table=[]

}

</script>

</body>

</html>`


/* ---------------- Serve UI ---------------- */

app.get("/",(req,res)=>{
res.send(UI)
})


/* ---------------- Mule Proxy ---------------- */

async function safeParse(r){
const text = await r.text()
try{
return JSON.parse(text)
}catch{
return {raw:text}
}
}

app.post("/api/table", async(req,res)=>{

try{

const {num,str,end}=req.body

const r=await fetch(MULE_TABLE_URL,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({num,str,end})
})

const data=await safeParse(r)

res.json(data)

}catch(e){

res.status(500).json({error:e.message})

}

})


/* ---------------- Start Server ---------------- */

app.listen(PORT,()=>{
console.log("Animated Maths API running on port",PORT)
})
```
