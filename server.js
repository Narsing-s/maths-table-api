```javascript
// server.js
const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const MULE_TABLE_URL =
  process.env.MULE_TABLE_URL ||
  "https://maths-table-jik9pb.5sc6y6-3.usa-e2.cloudhub.io/table";

/* ---------- Logs ---------- */
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

/* ---------- Health ---------- */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ---------- UI ---------- */

const UI_HTML = `
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>

<meta charset="UTF-8">
<title>Maths Table App</title>
<meta name="viewport" content="width=device-width,initial-scale=1">

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<style>

:root{
--bg:#0b1020;
--card:#121a2f;
--text:#fff;
--accent:#4ae387;
--accent2:#5aa1ff;
}

[data-theme="light"]{
--bg:#f3f6ff;
--card:#ffffff;
--text:#111;
--accent:#2563eb;
--accent2:#7c3aed;
}

[data-theme="neon"]{
--bg:#020617;
--card:#050a20;
--text:#00f7ff;
--accent:#00f7ff;
--accent2:#ff00ff;
}

body{
background:var(--bg);
color:var(--text);
font-family:system-ui;
padding:20px;
margin:0;
}

.card{
background:var(--card);
padding:20px;
border-radius:16px;
max-width:550px;
margin:auto;
}

.btn{
padding:10px 16px;
border:none;
border-radius:12px;
cursor:pointer;
background:linear-gradient(135deg,var(--accent),var(--accent2));
margin:4px;
}

.keypad{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:10px;
margin-top:20px;
}

.key{
background:rgba(255,255,255,.1);
padding:20px;
border-radius:12px;
text-align:center;
font-size:20px;
cursor:pointer;
}

.result{
margin-top:20px;
white-space:pre-wrap;
font-family:monospace;
background:rgba(255,255,255,.05);
padding:12px;
border-radius:10px;
}

</style>
</head>

<body>

<div class="card">

<h2>Multiplication Table</h2>

<div>Number: <span id="num"></span></div>
<div>Start: <span id="str">1</span></div>
<div>End: <span id="end">10</span></div>

<div>

<button class="btn" id="setNum">Set Number</button>
<button class="btn" id="setStr">Set Start</button>
<button class="btn" id="setEnd">Set End</button>

</div>

<div>

<button class="btn" id="computeBtn">Compute</button>
<button class="btn" id="graphBtn">Graph</button>
<button class="btn" id="quizBtn">Quiz</button>
<button class="btn" id="downloadBtn">Download</button>
<button class="btn" id="themeBtn">Theme</button>
<button class="btn" id="clearBtn">Clear</button>

</div>

<div class="result" id="resultBox">Result will appear here</div>

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

const $=id=>document.getElementById(id)

let active="num"
let currentTable=[]

/* Tap Sound */
let audioCtx
function tap(){
try{
audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)()
const o=audioCtx.createOscillator()
const g=audioCtx.createGain()
o.frequency.value=300
g.gain.setValueAtTime(.001,audioCtx.currentTime)
g.gain.exponentialRampToValueAtTime(.2,audioCtx.currentTime+.01)
g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.08)
o.connect(g)
g.connect(audioCtx.destination)
o.start()
o.stop(audioCtx.currentTime+.08)
}catch(e){}
}

/* choose input */
$("setNum").onclick=()=>active="num"
$("setStr").onclick=()=>active="str"
$("setEnd").onclick=()=>active="end"

/* keypad */
$("pad").onclick=e=>{
const k=e.target.closest(".key")
if(!k)return
tap()
$(active).textContent += k.textContent
}

/* compute */
$("computeBtn").onclick=async()=>{

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
currentTable=data
$("resultBox").textContent=data.join("\\n").replaceAll(" x "," × ")
localStorage.setItem("lastTable",JSON.stringify(data))
}else{
$("resultBox").textContent=JSON.stringify(data,null,2)
}

}

/* graph */
$("graphBtn").onclick=()=>{

if(!currentTable.length)return

const labels=[]
const vals=[]

currentTable.forEach((l,i)=>{
const v=l.split("=")[1]
labels.push(i+1)
vals.push(Number(v))
})

new Chart($("chart"),{
type:"line",
data:{
labels:labels,
datasets:[{label:"Table",data:vals}]
}
})

}

/* quiz */
$("quizBtn").onclick=()=>{
const n=Number($("num").textContent)
const r=Math.floor(Math.random()*10)+1
const ans=prompt(n+" × "+r+" = ?")
if(Number(ans)===n*r)
alert("Correct")
else
alert("Wrong. Answer: "+(n*r))
}

/* download */
$("downloadBtn").onclick=()=>{
if(!currentTable.length)return
const blob=new Blob([currentTable.join("\\n")])
const a=document.createElement("a")
a.href=URL.createObjectURL(blob)
a.download="table.txt"
a.click()
}

/* clear */
$("clearBtn").onclick=()=>{
tap()
$("num").textContent=""
$("str").textContent="1"
$("end").textContent="10"
$("resultBox").textContent="Result will appear here"
currentTable=[]
}

/* theme */
const themes=["dark","light","neon"]
let t=0

$("themeBtn").onclick=()=>{
tap()
t=(t+1)%themes.length
document.documentElement.setAttribute("data-theme",themes[t])
}

</script>

</body>
</html>
`

/* ---------- Serve UI ---------- */

app.get("/", (req, res) => res.type("html").send(UI_HTML))

/* ---------- Mule Proxy ---------- */

async function safeParse(resp){
const text=await resp.text()
try{
return JSON.parse(text)
}catch{
return {raw:text}
}
}

app.post("/api/table", async (req,res)=>{

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

/* ---------- Start Server ---------- */

app.listen(PORT,()=>{

console.log("Server running on port",PORT)

})
```
