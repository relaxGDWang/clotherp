<?php
/* This will give an error. Note the output
 *  * above, which is before the header() call */
//header('Location: http://pad.suishou.cc/main.html');
//header('Location: http://qiang.suishou.cc/');
//exit;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0, minimum-scale=1.0, maximum-scale=1.0">
    <title>项目调试</title>
<style type="text/css">
*, *:after, *:before { box-sizing: border-box; }
html, body, h1, h2, h3, h4, h5, h6, p, ul, ol, form, iframe, object { margin: 0; padding: 0; }
a { text-decoration: none; color: inherit; -webkit-tap-highlight-color: transparent; }
input, textarea, select, button, option { font-family: inherit; font-size: inherit; color: inherit; -webkit-tap-highlight-color: transparent; }
a:active, a:focus, input:active, input:focus, button:active, button:focus { outline: none; }
input[type="button"]::-moz-focus-inner, input[type="submit"]::-moz-focus-inner, button::-moz-focus-inner { border: none; }
html, body { height: 100%; width: 100%; overflow: hidden; color: #333; font-family: Arial, Helvetica, sans-serif; }
html { font-size: 14px; }
body { font-size: 14px; }
iframe { display: block; width: 100%; height: 100%; position: relative; border: 0; }
input::-ms-clear, input::-ms-reveal { display: none; }
ul.nohead, ol.nohead { list-style: none;}

.outFrame{ width:100%; height:100%; position:relative; overflow:hidden;}
h1{ text-align:center; border-bottom:1px solid #ccc; padding:10px; margin-bottom:10px; font-size:20px; font-weight:normal;}
.equipmentStatus li{ float:left; padding:5px 10px; font-size:16px; color:#666;}
.equipmentStatus li strong{ margin-left:5px;}
.equipmentStatus .title{ background:#999; color:#fff; border-radius:6px;}
.equipmentStatus .nowValue{ float:none; clear:both; width:100%; border-top:1px solid #ccc; background:#f0f0f0; text-align:center; margin-bottom:20px;}
.counter{ width:100%; overflow:hidden;}
.counter h2{ float:left; background:#999; color:#fff; border-radius:6px; padding:0 10px; font-size:16px; line-height:34px;}
.counter div{ float:left; padding:0 10px; line-height:34px; font-size:16px;}
.counter strong{ color:red; font-weight:normal; font-size:14px;}
</style>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
</head>
<body>
	<div class="outFrame">
		<h1>项目调试</h1>
		<ul class="equipmentStatus nohead">
			<li class="title">设备状态</li>
			<li>打印机<strong id="eqPrint">--</strong></li>
			<li>计米器<strong id="eqCounter">--</strong></li>
			<li>网络链接<strong id="eqNet">--</strong></li>
			<li class="nowValue">获得值：<span id="statusText"></span></li>
		</ul>
		<div class="counter">
			<h2>计米器</h2>
			<div>
				<span>当前读数</span>
				<strong id="numbox"></strong>
			</div>
			<div>
				<span>设置</span>
				<button id="reset">计米器清零</button>
			</div>
		</div>
		<h4 id="statbox">0000</h4>
		<button type="button" onclick="window.register_js.goprint(str)">打印测试</button>
<br>
<br>
		<button type="button" onclick="window.register_js.gozero()">清零计数</button>
<br>
<br>
		<button type="button" onclick="window.register_js.goalt1(11)">设置alt1</button>
<br>
<br>
		<button type="button" onclick="window.register_js.goalt2(22)">设置alt2</button>
<br>
<br>
		<button type="button" onclick="window.register_js.exitwebview()">设置中心</button>
<br>
<br>
		<a href="">刷新页面</a>
<br>
		<a onclick="top.location.href='./test.html?v='+Math.random();">TEST</a>
<br>
<br>
		<a onclick="top.location.href='http://192.168.3.200:10000/login.html?v='+Math.random()">开发环境123</a>
		<a onclick="top.location.href='http://192.168.1.30:10000/login.html?v='+Math.random();">开发环境-wangleijia</a>
<br>
<br>
		<a onclick="top.location.href='http://pad.suishou.cc/main.html?v='+Math.random();">生产环境</a>

<br>
<br>
<input type="text" onkeydown="keydown()" onkeypress="keypress()" onkeyup="keyup()" />
<script type="text/javascript">
window.setInterval(get_num_val, 1000); //计米器读数
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
data.len = "940";	
data.gap = "0";	
data.xblank = "180";	
data.yblank = "100";	
data.lineh= "30";	
data.density = "15";	
data.speed= "15";	
data.info= info;

var dom={
	counter: $('#numbox'),   //计米器读数
	reset: $('#reset'),       //计米器清零按钮
	statusText: $('#statusText') //状态返回数值
};

reset.click(function(){
	try{
		window.register_js.gozero();
	}catch(e){
		
	}
	
});


var str = JSON.stringify(data);//将对象转换为json
console.log(str);

//	alert(str);
function syncstat(){  //获取设备链接状态
	var val;
	try{
		val = window.register_js.get_syncstat();
	}catch(e){
		val = '请在APP中访问';
	}
	dom.statusText.text(val);
}

function get_num_val(){  //获得计米器读数
	var val;
	try{
		val = window.register_js.updatenumbox();
	}catch(e){
		val = '计米器读数失败';
	}
	dom.counter.text(val);
}

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
</script>
</body>
</html>




