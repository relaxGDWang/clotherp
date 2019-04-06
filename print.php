<?php
/* This will give an error. Note the output
 *  * above, which is before the header() call */
//header('Location: http://pad.suishou.cc/main.html');
//header('Location: http://qiang.suishou.cc/');
//header('Location: http://zufang.suishou.cc/');
//exit;
?>

<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0, minimum-scale=1.0, maximum-scale=1.0">
	<title>工程测试页面</title>
	<style type="text/css">
	body{ text-align:center; background:#eee;}
	h1{ padding:0; margin:0; text-align:left; color:blue;}
	h2{ border-bottom:1px solid #ddd; padding-bottom:15px; padding-top:0; margin:0; text-align:left; color:#999;}
	body>div{ padding:20px; max-width:700px; background:#fff; margin:10px auto; border:1px solid #ddd; border-radius:6px; box-shadow:0 0 10px rgba(0,0,0,.1); position:relative;}
	.noBack{ background:transparent; padding:0; box-shadow:none; border:0;}
	.noBack h1{ border-bottom:0;}
	.buttonBar{ position:absolute; top:5px; right:0;}
	.buttonBar.ext{ top:15px; right:20px;}
	.showBar{ display:block; padding:10px 0 0 0;}
	button{ padding:5px 15px; cursor:pointer; font-size:16px;}
	input[type="text"]{ height:30px;}
	</style>
</head>
<body>
	<div class="noBack">
		<h1>工程测试</h1>
		<span class="buttonBar">
			<button type="button" onclick="window.register_js.exitwebview()">设置中心</button> <button type="button" onclick="location.reload()">刷新页面</button>
		</span>
	</div>
	<div>
		<h2>打印机计米器测试</h2>
		<h3 id="numbox">00.00</h3>
		<h4 id="statbox">0000</h4>
		<button type="button" onclick="window.register_js.goprint(str)">打印测试</button> <button type="button" onclick="window.register_js.gozero()">清零计数</button>
	</div>
	<div>
		<h2>版本查看</h2>
		<span class="buttonBar ext">
			<button type="button" onclick="top.location.href='http://pad.suishou.cc/main.html?v='+Math.random();">生产环境</button> <button onclick="top.location.href='http://pad-dev.suishou.cc/main.html?v='+Math.random();">测试环境</button>
		</span>
		<span class="showBar">
			<label>测试地址</label>
			<input type="text" id="gourl" placeholder="http://"/>
			<button type="button" id="goButton">跳转</button>
		</span>
	</div>
	<div>
		<h2>扫描枪测试</h2>
		<span class="showBar">
			<input type="text" onkeydown="keydown()" onkeypress="keypress()" onkeyup="keyup()" />
		</span>
	</div>
</body>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<script type="text/javascript">
//获得设备状态信息
function syncstat(){
	val = window.register_js? window.register_js.get_syncstat() : '--';
	dom1.text(val);
}

//获得计米器读数
function get_num_val(){
	val = window.register_js? window.register_js.updatenumbox() : '--';
	dom2.text(val);
}

var dom1=$('#statbox');
var dom2=$('#numbox');
var dom3=$('#gourl');
dom3.val(localStorage.getItem('url') || '');

window.setInterval(get_num_val, 1000); 
window.setInterval(syncstat, 1000); 

var items = [];//创建数组

var a1={};	
var a2={};	
var a3={};	
var a4={};	
var a5={};	
var a6={};	
a1.text = "名称：亚光绣花型";
a2.text = "库存：100米";
a3.text = "入库：2018-19-21";
a4.text = "仓位：A15-04";
a5.text = "版本：法西兰";
a6.text = "批号：ABC_0101010101";
items.push(a1);//添加对象
items.push(a2);
items.push(a3);
items.push(a4);
items.push(a5);
items.push(a6);

var info={};	
info.header= "随手订货库存单";	
info.code= "ABC_0123456789";	
info.footer= "AAAAAAAAAAAAAAAAAAAA";	
//info.footer= "VVVVVVVVVVVVVVVVV";	
info.items= items;	

var data = {};
data.width = "50";	
data.len = "70";	
data.gap = "3";	
data.xblank = "60";	
data.yblank = "60";	
data.lineh= "30";	
data.density = "15";	
data.speed= "15";	
data.info= info;	


var str = JSON.stringify(data);//将对象转换为json
data.gap = "0";	
data.len = "100";	
var str2 = JSON.stringify(data);//将对象转换为json
console.log(str);

function keydown(event) {
	console.log('keydown');
}
function keypress(event) {
 //   console.log(event.keyCode);
  //  console.log(event.charCode);
	console.log('keypress');
}
function keyup(event) {
	console.log('keyup');
}

$('#goButton').click(function(){
	var url=dom3.val();
	location.href='http://'+url;
	localStorage.setItem('url',url);
});

dom3.focus(function(){
	this.select();
});
</script>


</html>




