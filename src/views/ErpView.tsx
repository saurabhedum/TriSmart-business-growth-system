import React from 'react';

const erpHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Trismart ERP — Preview for Janta Gallery</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --navy:#16243F;
    --navy-light:#1F3358;
    --gold:#C8932B;
    --gold-light:#E8B655;
    --bg:#FAF7F2;
    --card:#FFFFFF;
    --text-dark:#1B2230;
    --text-muted:#6B7280;
    --border:#E7E2D8;
    --success:#2E7D52;
    --success-bg:#E7F4EC;
    --warn:#B8762A;
    --warn-bg:#FBF0DF;
    --danger:#C0392B;
    --danger-bg:#FBEAE7;
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  body{
    font-family:'Inter',sans-serif;
    background:var(--bg);
    color:var(--text-dark);
    display:flex;
    min-height:100vh;
  }
  h1,h2,h3,.num{font-family:'Poppins',sans-serif;}

  /* ---------- Sidebar ---------- */
  .sidebar{
    width:300px;
    background:var(--navy);
    color:#fff;
    display:flex;
    flex-direction:column;
    flex-shrink:0;
    position:sticky;
    top:0;
    height:100vh;
  }
  .brand{
    padding:24px 22px 18px;
    border-bottom:1px solid rgba(255,255,255,0.08);
    flex-shrink:0;
  }
  .brand .name{font-family:'Poppins',sans-serif;font-weight:700;font-size:19px;letter-spacing:0.3px;}
  .brand .name span{color:var(--gold-light);}
  .brand .for{font-size:12.5px;color:rgba(255,255,255,0.55);margin-top:4px;}

  /* Main menu control bar */
  .menu-control{
    padding:14px 18px 10px;
    flex-shrink:0;
    border-bottom:1px solid rgba(255,255,255,0.08);
  }
  .menu-control .mc-label{
    font-size:11px;
    text-transform:uppercase;
    letter-spacing:0.6px;
    color:rgba(255,255,255,0.45);
    font-weight:600;
    margin-bottom:9px;
  }
  .mc-switch{
    display:flex;
    background:rgba(255,255,255,0.07);
    border-radius:8px;
    padding:3px;
    gap:3px;
  }
  .mc-btn{
    flex:1;
    text-align:center;
    font-size:12px;
    font-weight:600;
    color:rgba(255,255,255,0.6);
    padding:7px 6px;
    border-radius:6px;
    cursor:pointer;
    user-select:none;
    transition:background .15s,color .15s;
  }
  .mc-btn:hover{color:#fff;}
  .mc-btn.on{background:var(--gold);color:var(--navy);}

  /* Accordion menu tree */
  .menu-scroll{flex:1;overflow-y:auto;padding:10px 10px 16px;}
  .menu-scroll::-webkit-scrollbar{width:6px;}
  .menu-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:3px;}

  .acc-header{
    display:flex;
    align-items:center;
    gap:9px;
    padding:9px 10px;
    border-radius:7px;
    color:rgba(255,255,255,0.8);
    font-size:13.5px;
    font-weight:500;
    cursor:pointer;
    user-select:none;
    transition:background .15s, color .15s;
  }
  .acc-header:hover{background:rgba(255,255,255,0.07);color:#fff;}
  .acc-header.leaf.active{background:var(--gold);color:var(--navy);font-weight:600;}
  .acc-node.level0 > .acc-header{font-weight:600;font-size:14px;color:rgba(255,255,255,0.92);}
  .acc-header .caret{
    display:inline-block;
    width:9px;
    flex-shrink:0;
    font-size:10px;
    color:rgba(255,255,255,0.4);
    transition:transform .15s;
  }
  .acc-header.leaf.active .caret{color:var(--navy);}
  .acc-header .dot{
    width:5px;height:5px;border-radius:50%;
    background:rgba(255,255,255,0.35);
    flex-shrink:0;
    margin-left:1px;
  }
  .acc-header.leaf.active .dot{background:var(--navy);}
  .acc-header .lbl{flex:1;line-height:1.3;}
  .acc-children{overflow:hidden;}

  .sidebar-foot{
    padding:14px 22px 18px;
    font-size:11.5px;
    color:rgba(255,255,255,0.4);
    border-top:1px solid rgba(255,255,255,0.08);
    flex-shrink:0;
  }

  /* ---------- Main ---------- */
  .main{flex:1;min-width:0; overflow-y: auto; height: 100vh;}
  .topbar{
    background:var(--card);
    border-bottom:1px solid var(--border);
    padding:20px 36px;
    display:flex;
    justify-content:space-between;
    align-items:center;
  }
  .topbar .greet h1{font-size:21px;font-weight:600;}
  .topbar .greet p{font-size:13.5px;color:var(--text-muted);margin-top:3px;}
  .topbar .date{
    font-size:13px;
    color:var(--text-muted);
    background:var(--bg);
    border:1px solid var(--border);
    padding:8px 14px;
    border-radius:8px;
  }

  .content{padding:32px 36px 60px;}
  .panel{display:none;animation:fade .25s ease;}
  .panel.active{display:block;}
  @keyframes fade{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}

  .section-title{font-size:18px;font-weight:600;margin-bottom:4px;}
  .section-sub{font-size:13.5px;color:var(--text-muted);margin-bottom:22px;}

  /* ---------- Cards ---------- */
  .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:28px;}
  .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:28px;}
  .stat-card{
    background:var(--card);
    border:1px solid var(--border);
    border-radius:14px;
    padding:20px 20px;
  }
  .stat-card .label{font-size:13px;color:var(--text-muted);font-weight:500;}
  .stat-card .num{font-size:25px;font-weight:700;margin-top:8px;color:var(--navy);}
  .stat-card .sub{font-size:12px;color:var(--success);margin-top:6px;font-weight:500;}
  .stat-card.gold{background:linear-gradient(135deg,var(--navy) 0%, var(--navy-light) 100%);border:none;color:#fff;}
  .stat-card.gold .label{color:rgba(255,255,255,0.65);}
  .stat-card.gold .num{color:var(--gold-light);}
  .stat-card.gold .sub{color:rgba(255,255,255,0.6);}

  .card{
    background:var(--card);
    border:1px solid var(--border);
    border-radius:14px;
    padding:22px 24px;
    margin-bottom:22px;
  }
  .card h3{font-size:15.5px;font-weight:600;margin-bottom:14px;}

  table{width:100%;border-collapse:collapse;}
  th{
    text-align:left;
    font-size:12px;
    text-transform:uppercase;
    letter-spacing:0.4px;
    color:var(--text-muted);
    padding:9px 10px;
    border-bottom:1px solid var(--border);
    font-weight:600;
  }
  td{
    padding:13px 10px;
    font-size:14px;
    border-bottom:1px solid var(--border);
  }
  tr:last-child td{border-bottom:none;}

  .pill{
    display:inline-block;
    font-size:11.5px;
    font-weight:600;
    padding:4px 11px;
    border-radius:20px;
  }
  .pill.good{background:var(--success-bg);color:var(--success);}
  .pill.warn{background:var(--warn-bg);color:var(--warn);}
  .pill.danger{background:var(--danger-bg);color:var(--danger);}
  .pill.info{background:#E6EDF7;color:var(--navy);}

  .btn{
    background:var(--gold);
    color:var(--navy);
    border:none;
    padding:9px 16px;
    border-radius:8px;
    font-size:13.5px;
    font-weight:600;
    cursor:pointer;
    font-family:'Inter',sans-serif;
    transition:background .15s, transform .1s;
  }
  .btn:hover{background:var(--gold-light);}
  .btn:active{transform:scale(0.97);}
  .btn.ghost{
    background:transparent;
    border:1px solid var(--border);
    color:var(--text-dark);
  }
  .btn.ghost:hover{background:var(--bg);}
  .btn.small{padding:6px 12px;font-size:12.5px;}

  /* ---------- New Bill screen ---------- */
  .bill-layout{display:grid;grid-template-columns:1.3fr 1fr;gap:22px;align-items:start;}
  .item-row{
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:13px 14px;
    border:1px solid var(--border);
    border-radius:10px;
    margin-bottom:10px;
  }
  .item-row .iname{font-weight:600;font-size:14px;}
  .item-row .iprice{font-size:12.5px;color:var(--text-muted);margin-top:2px;}
  .bill-box{position:sticky;top:20px;}
  .bill-line{
    display:flex;
    justify-content:space-between;
    font-size:14px;
    padding:9px 0;
    border-bottom:1px solid var(--border);
  }
  .bill-line .remove{color:var(--danger);font-size:12px;cursor:pointer;font-weight:600;margin-left:8px;}
  .bill-empty{color:var(--text-muted);font-size:13.5px;text-align:center;padding:26px 0;}
  .bill-total-row{display:flex;justify-content:space-between;padding:8px 0;font-size:13.5px;color:var(--text-muted);}
  .bill-total-row.grand{font-size:18px;font-weight:700;color:var(--navy);border-top:1px solid var(--border);margin-top:6px;padding-top:14px;}
  .success-msg{
    background:var(--success-bg);
    color:var(--success);
    padding:14px;
    border-radius:10px;
    font-size:13.5px;
    font-weight:500;
    margin-top:14px;
    display:none;
  }

  /* ---------- Reports bars ---------- */
  .bars{display:flex;align-items:flex-end;gap:16px;height:180px;padding-top:10px;}
  .bar-col{flex:1;display:flex;flex-direction:column;align-items:center;}
  .bar{width:100%;border-radius:7px 7px 0 0;background:linear-gradient(180deg,var(--gold-light),var(--gold));}
  .bar-label{font-size:12px;color:var(--text-muted);margin-top:8px;}
  .bar-val{font-size:11.5px;color:var(--navy);font-weight:600;margin-bottom:6px;}

  .note{
    font-size:12.5px;
    color:var(--text-muted);
    background:#F1ECE2;
    border:1px solid var(--border);
    padding:12px 16px;
    border-radius:10px;
    margin-top:26px;
  }

  /* ---------- Blank / not-yet-filled screen ---------- */
  .crumbs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px;}
  .crumb{
    font-size:12px;
    font-weight:600;
    color:var(--navy);
    background:#EFE9DC;
    border:1px solid var(--border);
    padding:5px 11px;
    border-radius:20px;
  }
  .crumb.last{background:var(--gold);color:#fff;border-color:var(--gold);}
  .empty-card{
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    text-align:center;
    padding:60px 30px;
    border:1.5px dashed var(--border);
    background:#FCFBF8;
  }
  .empty-card svg{width:46px;height:46px;color:var(--gold);opacity:0.85;margin-bottom:16px;}
  .empty-card .et{font-size:15px;font-weight:600;color:var(--text-dark);margin-bottom:6px;}
  .empty-card .es{font-size:13px;color:var(--text-muted);max-width:360px;}
</style>
</head>
<body>

<div class="sidebar">
  <div class="brand">
    <div class="name">Trismart <span>ERP</span></div>
    <div class="for">Made for Janta Gallery</div>
  </div>

  <div class="menu-control">
    <div class="mc-label">Main Menu View</div>
    <div class="mc-switch">
      <div class="mc-btn" id="modeAllBtn">Open Whole Menu</div>
      <div class="mc-btn on" id="modeOneBtn">One Menu at a Time</div>
    </div>
  </div>

  <div class="menu-scroll" id="menuRoot"></div>

  <div class="sidebar-foot">Preview Version · Not for billing</div>
</div>

<div class="main">
  <div class="topbar">
    <div class="greet">
      <h1 id="topTitle">Welcome, Janta Gallery</h1>
      <p id="topSub">Here is how your shop is doing today</p>
    </div>
    <div class="date">Tuesday, 18 June</div>
  </div>

  <div class="content">

    <!-- OVERVIEW -->
    <div class="panel active" id="panel-overview">
      <div class="grid4">
        <div class="stat-card gold">
          <div class="label">Today's Sale</div>
          <div class="num">₹45,230</div>
          <div class="sub">From 12 bills</div>
        </div>
        <div class="stat-card">
          <div class="label">Cash in Hand</div>
          <div class="num">₹18,400</div>
          <div class="sub">As of 4:30 PM</div>
        </div>
        <div class="stat-card">
          <div class="label">Money Customers Owe You</div>
          <div class="num">₹32,150</div>
          <div class="sub">From 8 customers</div>
        </div>
        <div class="stat-card">
          <div class="label">Items Running Low</div>
          <div class="num">5</div>
          <div class="sub" style="color:var(--warn);">Needs reordering</div>
        </div>
      </div>

      <div class="card">
        <h3>Today's Bills</h3>
        <table>
          <tr><th>Bill No.</th><th>Customer</th><th>Item</th><th>Amount</th><th>Status</th></tr>
          <tr><td>#1042</td><td>Rajesh Mehta</td><td>Samsung TV 43"</td><td>₹32,500</td><td><span class="pill good">Paid</span></td></tr>
          <tr><td>#1041</td><td>Simran Kaur</td><td>Philips Mixer Grinder</td><td>₹3,200</td><td><span class="pill good">Paid</span></td></tr>
          <tr><td>#1040</td><td>Amit Joshi</td><td>Voltas AC 1.5 Ton</td><td>₹38,900</td><td><span class="pill warn">Partly Paid</span></td></tr>
          <tr><td>#1039</td><td>Pooja Sharma</td><td>Sony Bluetooth Speaker</td><td>₹2,650</td><td><span class="pill good">Paid</span></td></tr>
        </table>
      </div>

      <div class="note">This page gives you a quick look at your shop — total sales, cash, and pending dues — the moment you open it each day.</div>
    </div>

    <!-- MAKE A BILL -->
    <div class="panel" id="panel-bill">
      <div class="section-title">Make a Bill</div>
      <div class="section-sub">Tap an item to add it. The total and tax are worked out for you automatically.</div>

      <div class="bill-layout">
        <div>
          <div class="item-row">
            <div><div class="iname">Samsung TV 43" Smart LED</div><div class="iprice">₹32,500</div></div>
            <button class="btn small" onclick="addItem('Samsung TV 43\u0022', 32500)">Add</button>
          </div>
          <div class="item-row">
            <div><div class="iname">LG 260L Refrigerator</div><div class="iprice">₹26,000</div></div>
            <button class="btn small" onclick="addItem('LG 260L Refrigerator', 26000)">Add</button>
          </div>
          <div class="item-row">
            <div><div class="iname">Voltas 1.5 Ton AC</div><div class="iprice">₹38,900</div></div>
            <button class="btn small" onclick="addItem('Voltas 1.5 Ton AC', 38900)">Add</button>
          </div>
          <div class="item-row">
            <div><div class="iname">Philips Mixer Grinder</div><div class="iprice">₹3,200</div></div>
            <button class="btn small" onclick="addItem('Philips Mixer Grinder', 3200)">Add</button>
          </div>
          <div class="item-row">
            <div><div class="iname">Sony Bluetooth Speaker</div><div class="iprice">₹2,650</div></div>
            <button class="btn small" onclick="addItem('Sony Bluetooth Speaker', 2650)">Add</button>
          </div>
          <div class="item-row">
            <div><div class="iname">Whirlpool Washing Machine</div><div class="iprice">₹21,500</div></div>
            <button class="btn small" onclick="addItem('Whirlpool Washing Machine', 21500)">Add</button>
          </div>
        </div>

        <div class="bill-box card">
          <h3>Current Bill — Walk-in Customer</h3>
          <div id="billLines"><div class="bill-empty">No items added yet</div></div>
          <div id="billTotals" style="display:none;">
            <div class="bill-total-row"><span>Item Total</span><span id="subtotalVal">₹0</span></div>
            <div class="bill-total-row"><span>Tax (18%)</span><span id="taxVal">₹0</span></div>
            <div class="bill-total-row grand"><span>To Collect</span><span id="grandVal">₹0</span></div>
          </div>
          <button class="btn" style="width:100%;margin-top:14px;" onclick="completeBill()">Complete Bill</button>
          <div class="success-msg" id="successMsg">Bill saved. The customer will automatically get this bill on WhatsApp — no extra work for you.</div>
        </div>
      </div>
    </div>

    <!-- STOCK -->
    <div class="panel" id="panel-stock">
      <div class="section-title">Stock in Shop</div>
      <div class="section-sub">See what you have, and what needs to be ordered, at a glance.</div>
      <div class="card">
        <table>
          <tr><th>Item</th><th>In Shop</th><th>Reorder Below</th><th>Status</th></tr>
          <tr><td>Samsung TV 43" Smart LED</td><td>14</td><td>5</td><td><span class="pill good">In Stock</span></td></tr>
          <tr><td>LG 260L Refrigerator</td><td>3</td><td>5</td><td><span class="pill danger">Low — Order Soon</span></td></tr>
          <tr><td>Voltas 1.5 Ton AC</td><td>8</td><td>4</td><td><span class="pill good">In Stock</span></td></tr>
          <tr><td>Philips Mixer Grinder</td><td>22</td><td>10</td><td><span class="pill good">In Stock</span></td></tr>
          <tr><td>Sony Bluetooth Speaker</td><td>2</td><td>5</td><td><span class="pill danger">Low — Order Soon</span></td></tr>
          <tr><td>Whirlpool Washing Machine</td><td>6</td><td>4</td><td><span class="pill good">In Stock</span></td></tr>
          <tr><td>Bajaj Ceiling Fan</td><td>4</td><td>8</td><td><span class="pill danger">Low — Order Soon</span></td></tr>
        </table>
      </div>
      <div class="note">Items marked "Low" are shown in red automatically, so you never run out of a fast-selling item without knowing.</div>
    </div>

    <!-- CUSTOMERS -->
    <div class="panel" id="panel-customers">
      <div class="section-title">Customers</div>
      <div class="section-sub">Know who owes you money, and how much, without checking a notebook.</div>
      <div class="card">
        <table>
          <tr><th>Name</th><th>Phone</th><th>Total Bought</th><th>Amount Due</th><th></th></tr>
          <tr><td>Rajesh Mehta</td><td>98xxx xx210</td><td>₹1,12,500</td><td>₹0</td><td><span class="pill good">Clear</span></td></tr>
          <tr><td>Amit Joshi</td><td>97xxx xx884</td><td>₹38,900</td><td>₹15,000</td><td><span class="pill warn">Due</span></td></tr>
          <tr><td>Simran Kaur</td><td>99xxx xx512</td><td>₹64,200</td><td>₹0</td><td><span class="pill good">Clear</span></td></tr>
          <tr><td>Harpreet Singh</td><td>98xxx xx337</td><td>₹89,300</td><td>₹17,150</td><td><span class="pill warn">Due</span></td></tr>
          <tr><td>Pooja Sharma</td><td>96xxx xx901</td><td>₹22,650</td><td>₹0</td><td><span class="pill good">Clear</span></td></tr>
        </table>
      </div>
      <div class="note">A simple reminder message can be sent to anyone with a due amount, straight from this list.</div>
    </div>

    <!-- REPAIRS -->
    <div class="panel" id="panel-repairs">
      <div class="section-title">Repairs</div>
      <div class="section-sub">Track every item that has come in for repair or service.</div>
      <div class="card">
        <table>
          <tr><th>Job No.</th><th>Customer</th><th>Item</th><th>Given On</th><th>Status</th></tr>
          <tr><td>#R-211</td><td>Harpreet Singh</td><td>LG Washing Machine</td><td>14 June</td><td><span class="pill warn">Waiting for Part</span></td></tr>
          <tr><td>#R-210</td><td>Neha Patel</td><td>Sony Speaker</td><td>15 June</td><td><span class="pill info">In Progress</span></td></tr>
          <tr><td>#R-209</td><td>Vikram Rao</td><td>Samsung TV</td><td>12 June</td><td><span class="pill good">Ready — Pickup</span></td></tr>
          <tr><td>#R-208</td><td>Anjali Desai</td><td>Mixer Grinder</td><td>10 June</td><td><span class="pill good">Ready — Pickup</span></td></tr>
        </table>
      </div>
      <div class="note">The customer can be sent a message the moment their item is ready — no phone calls needed.</div>
    </div>

    <!-- REPORTS -->
    <div class="panel" id="panel-reports">
      <div class="section-title">Reports</div>
      <div class="section-sub">A simple picture of how the shop has been doing, month by month.</div>

      <div class="grid3">
        <div class="stat-card">
          <div class="label">Sales — Last 6 Months</div>
          <div class="num">₹26.4 L</div>
          <div class="sub">Up from ₹21.8 L before</div>
        </div>
        <div class="stat-card">
          <div class="label">Profit — Last 6 Months</div>
          <div class="num">₹4.1 L</div>
          <div class="sub">About 15.5% of sales</div>
        </div>
        <div class="stat-card">
          <div class="label">Best Selling Item</div>
          <div class="num" style="font-size:18px;">Samsung TV 43"</div>
          <div class="sub" style="color:var(--text-muted);">31 units sold</div>
        </div>
      </div>

      <div class="card">
        <h3>Monthly Sales</h3>
        <div class="bars">
          <div class="bar-col"><div class="bar-val">₹3.8L</div><div class="bar" style="height:76px;"></div><div class="bar-label">Jan</div></div>
          <div class="bar-col"><div class="bar-val">₹4.0L</div><div class="bar" style="height:80px;"></div><div class="bar-label">Feb</div></div>
          <div class="bar-col"><div class="bar-val">₹3.5L</div><div class="bar" style="height:70px;"></div><div class="bar-label">Mar</div></div>
          <div class="bar-col"><div class="bar-val">₹4.6L</div><div class="bar" style="height:92px;"></div><div class="bar-label">Apr</div></div>
          <div class="bar-col"><div class="bar-val">₹4.9L</div><div class="bar" style="height:98px;"></div><div class="bar-label">May</div></div>
          <div class="bar-col"><div class="bar-val">₹5.6L</div><div class="bar" style="height:140px;"></div><div class="bar-label">Jun</div></div>
        </div>
      </div>
      <div class="note">Reports like this update on their own every day — no need to prepare them by hand at month-end.</div>
    </div>

    <!-- BLANK / PLACEHOLDER FOR ALL OTHER MENU ITEMS -->
    <div class="panel" id="panel-blank">
      <div class="crumbs" id="blankCrumbs"></div>
      <div class="empty-card">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4h16v16H4z"/><path d="M4 9h16M9 9v11"/></svg>
        <div class="et" id="blankTitle">Section</div>
        <div class="es">This screen is in the menu and ready to go. We will set it up with your shop's own data once we get started.</div>
      </div>
    </div>

  </div>
</div>

<script>
  /* ---------------------------------------------------
     FULL MAIN MENU STRUCTURE
     n = name shown to the user
     c = children (sub-menu)
     demo = links this item to an already-built sample screen
  --------------------------------------------------- */
  const menuTree = [
    {n:"Dashboard", c:[
      {n:"Current statistic", demo:"overview"},
      {n:"Sales"},
      {n:"Multi-store dashboard"}
    ]},
    {n:"Masters", c:[
      {n:"Settings", c:[
        {n:"Location"},{n:"State"},{n:"Service provider"},{n:"Service center"},{n:"Damage type"},
        {n:"Transporter"},{n:"Delivery mode"},{n:"Payment mode"},{n:"Return Reason"},{n:"Supplier Group"},
        {n:"Customer Group"},{n:"TID Master"},{n:"Finance Company"},{n:"Digital Company"},{n:"System Settings"}
      ]},
      {n:"Inventory Master", c:[
        {n:"Category"},{n:"Brand"},{n:"Color"},{n:"Model"},{n:"Model ID/OD Kit"},
        {n:"Category Tax"},{n:"Model Category"},{n:"Model MSL"},{n:"Other Items"},{n:"Service Item"}
      ]}
    ]},
    {n:"Employee", c:[
      {n:"Department"},{n:"Designation"},{n:"Employee"},{n:"Employee attendence"},
      {n:"Salesman Incentive"},{n:"Manager Incentive"},{n:"Technician"},{n:"Responsibilities"}
    ]},
    {n:"Accounts Masters", c:[
      {n:"Update transaction summary"},{n:"Accounting Year"},{n:"Voucher type"},{n:"Group"},{n:"Ledger"},
      {n:"Tax Type"},{n:"Tax Sub Type"},{n:"Tax Class"},{n:"Tax"},{n:"Update Opening Balance"}
    ]},
    {n:"Festivals", c:[
      {n:"Festivals"},{n:"Calender"}
    ]},
    {n:"Transactions", c:[
      {n:"Purchase"},{n:"Sales", demo:"bill"},{n:"Contra"},{n:"Payments"},{n:"Receipt"},
      {n:"Cod receipt"},{n:"Card Swipe"},{n:"Wallet"},{n:"Credit note"},{n:"Debit note"},
      {n:"Income/Expense"},{n:"Journal voucher"},{n:"Employee Salary"},{n:"Cod"},{n:"Day End Denomination"}
    ]},
    {n:"Inventory", c:[
      {n:"Exchange Item"},{n:"Exchange Inward"},{n:"Transfer issue"},{n:"Transfer Receipt"},
      {n:"Damage Transfer"},{n:"Sales Return Receipt"},{n:"Delivery Plan"},{n:"Dispatch Status"},
      {n:"Model"},{n:"Brand Stock"},{n:"Category Stock"}
    ]},
    {n:"Crm", c:[
      {n:"Gift Card", c:[
        {n:"Allocate Card"},{n:"Card Register"},{n:"Reference Credit"},{n:"Card Surrender"}
      ]},
      {n:"Delivery"},
      {n:"Sales Lead"},
      {n:"Greetings", c:[
        {n:"Agent"},{n:"Area"},{n:"Campaign"},{n:"Delivery location"}
      ]}
    ]},
    {n:"Service Center", c:[
      {n:"Generate payout"},{n:"Charges Master"},{n:"Call Registration", demo:"repairs"},
      {n:"Service Center"},{n:"Demo e-mail Setup"},{n:"Demo e-mail log"},{n:"Demo Register"}
    ]},
    {n:"Value settings", c:[
      {n:"Fright charges slab"},{n:"Upload Price List"},{n:"Price Drop note"},{n:"Supplier Schemes"},
      {n:"Schemes Analysis"},{n:"Model sell-in points"},{n:"Sellout Upgrade"},{n:"Sellout FOC"},
      {n:"Sellout Schemes"},{n:"Supplier CD slab"},{n:"Update NLC"}
    ]},
    {n:"Slabs & Targets", c:[
      {n:"Location Targets"},{n:"Salesman Targets"},{n:"Brand Targets"},{n:"Brand-Category Targets"},{n:"Incentive Slab"}
    ]},
    {n:"Accounts", c:[
      {n:"Final Accounts", c:[
        {n:"Account ledger"},{n:"Group summary"},{n:"Trial Balance"},{n:"Trading A/C"},
        {n:"Profit & Loss A/C"},{n:"Balance sheet"},{n:"Statistics"}
      ]},
      {n:"Cash book"},
      {n:"Day book"},
      {n:"Bank", c:[
        {n:"Batch settlement"},{n:"Finance Receipts"},{n:"Digital Receipts"},{n:"Bank Book"},{n:"Finance Receipts (New)"}
      ]},
      {n:"Ledger", c:[
        {n:"Customer", demo:"customers"},{n:"Supplier"}
      ]},
      {n:"GST-1"}
    ]},
    {n:"Reports", c:[
      {n:"Festival Comparison"},{n:"Purchase"},{n:"Sales", demo:"reports"},{n:"GST"},{n:"Service"},
      {n:"Stock", demo:"stock"},{n:"Transactions"},{n:"Receivable"},{n:"Payables"},{n:"Masters"},
      {n:"Accounts"},{n:"Employee"},{n:"KPI"},{n:"Targets"},{n:"Incentives"},{n:"CRM"},
      {n:"Profitability"},{n:"Schemes & Payouts"}
    ]},
    {n:"Utilities", c:[
      {n:"Bank reco with tally"},{n:"Tally Posting Range"},{n:"Voucher Posting"},{n:"Posting Report"},
      {n:"Reco with talley"},{n:"Reset Tally Posting"},{n:"Unlock Serial No."},{n:"Update serial number"},
      {n:"Scrap serial number"},{n:"Merge model"},{n:"Opening Stock"},{n:"LG EDI Download"},
      {n:"GSTN Setup"},{n:"Complaint Management"},{n:"Sony EDI Download"}
    ]},
    {n:"Security", c:[
      {n:"User Groups"},{n:"User Type Menu"},{n:"Menu Permissions"},{n:"Password Setup"},{n:"Users"},
      {n:"User Company Mapping"},{n:"Change Password"},{n:"User Type Menu(Mobile)"},
      {n:"Menu permission (mobile)"},{n:"Sales Company Mapping"}
    ]},
    {n:"Stock Enquiry"}
  ];

  let currentMode = "one"; // "one" = single menu open at a time, "all" = whole menu open

  function buildMenu(nodes, container, path, level){
    const group = document.createElement('div');
    group.className = 'acc-group';
    nodes.forEach(node => {
      const hasChildren = !!node.c;
      const item = document.createElement('div');
      item.className = 'acc-node level' + level;

      const header = document.createElement('div');
      header.className = 'acc-header' + (hasChildren ? '' : ' leaf');
      header.style.paddingLeft = (10 + level * 14) + 'px';
      header.innerHTML = (hasChildren ? '<span class="caret">▸</span>' : '<span class="dot"></span>') +
                          '<span class="lbl">' + node.n + '</span>';
      item.appendChild(header);
      node._headerEl = header;
      node._itemEl = item;

      if(hasChildren){
        const childWrap = document.createElement('div');
        childWrap.className = 'acc-children';
        childWrap.style.display = 'none';
        buildMenu(node.c, childWrap, path.concat(node.n), level + 1);
        item.appendChild(childWrap);
        node._childWrap = childWrap;

        header.addEventListener('click', () => {
          const isOpen = item.classList.contains('open');
          if(currentMode === 'one' && !isOpen){
            Array.from(group.children).forEach(sib => { if(sib !== item) closeNode(sib); });
          }
          isOpen ? closeNode(item) : openNode(item, childWrap);
        });
      } else {
        header.addEventListener('click', () => {
          document.querySelectorAll('.acc-header.leaf.active').forEach(h => h.classList.remove('active'));
          header.classList.add('active');
          loadLeaf(node, path.concat(node.n));
        });
      }
      group.appendChild(item);
    });
    container.appendChild(group);
    return group;
  }

  function openNode(item, childWrap){
    item.classList.add('open');
    childWrap.style.display = 'block';
    const caret = item.querySelector(':scope > .acc-header .caret');
    if(caret) caret.style.transform = 'rotate(90deg)';
  }
  function closeNode(item){
    item.classList.remove('open');
    const childWrap = item.querySelector(':scope > .acc-children');
    if(childWrap) childWrap.style.display = 'none';
    const caret = item.querySelector(':scope > .acc-header .caret');
    if(caret) caret.style.transform = 'rotate(0deg)';
    item.querySelectorAll('.acc-node.open').forEach(n => {
      n.classList.remove('open');
      const cw = n.querySelector(':scope > .acc-children');
      if(cw) cw.style.display = 'none';
      const c2 = n.querySelector(':scope > .acc-header .caret');
      if(c2) c2.style.transform = 'rotate(0deg)';
    });
  }
  function expandAll(root){
    root.querySelectorAll('.acc-node').forEach(item => {
      const childWrap = item.querySelector(':scope > .acc-children');
      if(childWrap){
        item.classList.add('open');
        childWrap.style.display = 'block';
        const caret = item.querySelector(':scope > .acc-header .caret');
        if(caret) caret.style.transform = 'rotate(90deg)';
      }
    });
  }
  function collapseAll(root){
    Array.from(root.children[0].children).forEach(top => closeNode(top));
  }

  function loadLeaf(node, fullPath){
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    if(node.demo){
      document.getElementById('panel-' + node.demo).classList.add('active');
    } else {
      document.getElementById('blankTitle').textContent = node.n;
      const crumbsEl = document.getElementById('blankCrumbs');
      crumbsEl.innerHTML = fullPath.map((p, i) =>
        '<span class="crumb' + (i === fullPath.length - 1 ? ' last' : '') + '">' + p + '</span>'
      ).join('');
      document.getElementById('panel-blank').classList.add('active');
    }
    document.getElementById('topTitle').textContent = node.n;
    document.getElementById('topSub').textContent = fullPath.join('  /  ');
  }

  const menuRoot = document.getElementById('menuRoot');
  buildMenu(menuTree, menuRoot, [], 0);

  document.getElementById('modeAllBtn').addEventListener('click', () => {
    currentMode = 'all';
    document.getElementById('modeAllBtn').classList.add('on');
    document.getElementById('modeOneBtn').classList.remove('on');
    expandAll(menuRoot);
  });
  document.getElementById('modeOneBtn').addEventListener('click', () => {
    currentMode = 'one';
    document.getElementById('modeOneBtn').classList.add('on');
    document.getElementById('modeAllBtn').classList.remove('on');
    collapseAll(menuRoot);
  });

  /* Default view: Dashboard open, Current statistic selected (matches the Overview screen already showing) */
  const dashNode = menuTree[0];
  openNode(dashNode._itemEl, dashNode._childWrap);
  dashNode.c[0]._headerEl.classList.add('active');
</script>

<script>
  let bill = [];

  function formatRs(n){
    return '₹' + n.toLocaleString('en-IN');
  }

  function addItem(name, price){
    bill.push({name, price});
    renderBill();
  }

  function removeItem(index){
    bill.splice(index, 1);
    renderBill();
  }

  function renderBill(){
    const linesEl = document.getElementById('billLines');
    const totalsEl = document.getElementById('billTotals');
    document.getElementById('successMsg').style.display = 'none';

    if(bill.length === 0){
      linesEl.innerHTML = '<div class="bill-empty">No items added yet</div>';
      totalsEl.style.display = 'none';
      return;
    }

    totalsEl.style.display = 'block';
    linesEl.innerHTML = bill.map((item, i) =>
      \`<div class="bill-line"><span>\${item.name}</span><span>\${formatRs(item.price)}<span class="remove" onclick="removeItem(\${i})">Remove</span></span></div>\`
    ).join('');

    const subtotal = bill.reduce((s, i) => s + i.price, 0);
    const tax = Math.round(subtotal * 0.18);
    const grand = subtotal + tax;

    document.getElementById('subtotalVal').textContent = formatRs(subtotal);
    document.getElementById('taxVal').textContent = formatRs(tax);
    document.getElementById('grandVal').textContent = formatRs(grand);
  }

  function completeBill(){
    if(bill.length === 0) return;
    document.getElementById('successMsg').style.display = 'block';
    setTimeout(() => {
      bill = [];
      renderBill();
    }, 2600);
  }
</script>

</body>
</html>
`;

export const ErpView = () => {
  const [htmlContent, setHtmlContent] = React.useState(erpHtml);

  React.useEffect(() => {
    // Inject the theme css variables into the iframe
    const style = getComputedStyle(document.documentElement);
    const bg = style.getPropertyValue('--bg-color').trim();
    const fg = style.getPropertyValue('--text-color').trim();
    const accent = style.getPropertyValue('--accent').trim();
    const muted = style.getPropertyValue('--text-muted').trim();
    const border = style.getPropertyValue('--border-color').trim() || '#E7E2D8';

    const injectedHtml = erpHtml.replace(
      ':root{',
      `{":root{"}
        --bg: ${bg || '#FAF7F2'};
        --card: ${bg || '#FFFFFF'};
        --text-dark: ${fg || '#1B2230'};
        --text-muted: ${muted || '#6B7280'};
        --border: ${border};
        --navy: ${accent || '#16243F'};
        --navy-light: ${accent || '#1F3358'};
        --gold: ${accent || '#C8932B'};
        --gold-light: ${accent || '#E8B655'};`.replace('{"', '').replace('"}', '')
    );
    
    setHtmlContent(injectedHtml);
  }, []);

  return (
    <div className="w-full h-full bg-[var(--bg-color)] overflow-hidden flex flex-col relative rounded-tl-2xl border-l border-t border-[var(--border-color)] dark:border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
      <div className="flex-1 w-full h-full p-0">
        <iframe
          srcDoc={htmlContent}
          className="w-full h-full border-none outline-none"
          title="ERP Preview"
          sandbox="allow-scripts allow-same-origin"
          style={{ background: 'var(--bg-color)' }}
        />
      </div>
    </div>
  );
};
