//============================================================
//基于iframe的SPA页类 2016-4-28 by relax
//============================================================
/*
待优化内容记录
1.关于事件触发，目前的方法是传递DOM元素后，由类文件默认绑定点击事件触发打开iframe窗口，优化的话需要考虑事件触发由外部绑定，调用类方法，有同样URL的iframe的情况下显示该iframe，否则添加，此逻辑将会比现在由类绑定自由很多
2.当前的BUG，如果有多个重复href项传入该类，在点击触发打开选项卡时候，会打开多个重复的iframe分页面
3.自定义滚动条--滚动条类的优化实现
4.目前暂时不支持页面初始加载，需要的选项已经存在的应对情况，后期再考虑优化扩展
*/
/*
setting = {
	bar:""      //显示选项卡的DOM对象
	move:""     //选项卡外框scroll的移动按钮DOM对象
	iframe:""   //显示iframe元素的DOM对象
	clear:true/false 用于操作存放在本地存储的初始数据是否清除 true清除初始数据，按默认值进行构建，否则先加载初始数据，然后按默认值协调
	show:[
		{
			href:"...",
			txt:"",
			title:""
		},
	]
}
menuList = {
	key:{
		href:  链接地址
		txt:   显示文本
		title: 鼠标移动上去显示的文本
		itemObj:   对应的选项卡JQ_dom对象
		frameObj:  对应的iframe dom对象
	}
}
localStorage.menu = {
	key:{
		href:
		txt:
		title:
		[sel:]
	}
}
*/
function SPAmenu(setting){
	this.menuList = {};     //选项卡对象
	this.localSave = false; //本地存储标志
	this.selKey = "";       //当前选中的选项卡的索引名称
	this.templateBar = "";     //选项卡的模板

	this.domBar = "";
	this.domMove = "";
	this.domIframe = "";

	this.moveLeft = "";    //向左按钮
	this.moveRight = "";   //向右按钮
	this.timeID = "";      //控制左移右移的时间变量

	if (("bar" in setting) && ("length" in setting.bar) && setting.bar.length===1){
		this.domBar = setting.bar;

		var barObj = this.domBar.find(".template").eq(0);
		if (barObj.length > 0){
			//ie8下某些属性某些情况下会无双引号，用正则替换
			this.templateBar = barObj.prop("outerHTML").toLowerCase().replace(/([^"\s<]+=)([^"\s>]+)/g,"$1\"$2\"").replace("template","");
			barObj.remove();
		}else{
			this.templateBar = '<li title="{#title#}" key="{#key#}" class="temp"><span class="txt">{#txt#}</span><span class="close">&times;</span></li>';
		}
	}
	if (("move" in setting) && ("length" in setting.move) && setting.move.length===1){
		this.domMove = setting.move;
		//获得向左按钮
		this.moveLeft = this.domMove.find(".buttonLeft");
		if (this.moveLeft.length >= 1){
			this.moveLeft = this.moveLeft.eq(0);
		}else{
			this.moveLeft = "";
		}
		//获得向右按钮
		this.moveRight = this.domMove.find(".buttonRight");
		if (this.moveRight.length >= 1){
			this.moveRight = this.moveRight.eq(0);
		}else{
			this.moveRight = "";
		}
		if (this.moveLeft==="" || this.moveRight===""){
			this.domMove = "";
		}
		this.domMove.css("display","none");
	}
	if (("iframe" in setting) && ("length" in setting.iframe) && setting.iframe.length===1){
		this.domIframe = setting.iframe;
	}
	if (this.domBar=== "" || this.domIframe=== ""){
		this.menuList = "";
		return;
	}

	var CL = this;
	var showKey = "";

	//判定当前客户端是否支持本地存储，不支持则不进行读取存储信息
	if (window.localStorage){
		this.localSave = true;
		if (("clear" in setting) && setting.clear){
			if ("menu" in window.localStorage) window.localStorage.menu = "";
		}else{
			var nowMenu = "";
			if (("menu" in window.localStorage) && window.localStorage.menu){
				nowMenu = window.localStorage.menu;
				console.log(window.localStorage.menu);
				nowMenu = json_decode(nowMenu);
				this.menuList = {};
				for (var x in nowMenu){
					if (nowMenu[x].sel) showKey = x;
					CL._opNode("add",{key:x, href:nowMenu[x].href, txt:nowMenu[x].txt, title:nowMenu[x].title, sel:nowMenu[x].sel});
				}
			}
		}
	}

	//判定是否有初始值
	if (setting.show){
		if ("length" in setting.show){
			var tempKey = "";
			for (var i=0; i<setting.show.length; i++){
				var tempObj = setting.show[i];
				if (!(CL._findNode(tempObj.href))){
					tempKey = CL._opNode("add",{key:"", href:tempObj.href, txt:tempObj.txt, title:tempObj.title});
				}
			}
			if (showKey==="") showKey = tempKey;
		}
	}
	CL._show(showKey);

	//绑定相关事件
	CL.domBar.click(function(e){
		var tempObj = $(e.target);
		var classStr = tempObj[0].className;
		if (classStr.indexOf("sel")>=0)  return;

		var key = "";
		switch(classStr){
			case "temp":
				key = tempObj.attr("key");
				break;
			case "close":
				key = tempObj.parent().attr("key");
				break;
			case "txt":
				key = tempObj.parent().attr("key");
				break;
		}
		if (key==="") return;
		if (classStr==="close"){
			if (CL.selKey===key){
				var setKey = CL._getNextPrev("prev",key);
				if (!setKey) setKey = CL._getNextPrev("next",key);
				CL._opNode("del", key);
				if (setKey){
					CL._show(setKey);
				}
			}else{
				CL._opNode("del", key);
			}
		}else{
			CL._show(key);
		}

		protectEvent(e);
	});

	//向左向右按钮事件绑定
	if (CL.domMove){
		var parentObj = CL.domBar.parent()[0];
		CL.moveLeft.mousedown(function(e){
			if (CL.timeID){
				clearInterval(CL.timeID);
			}
			CL.timeID = setInterval(function(){
				parentObj.scrollLeft = parentObj.scrollLeft - 10;
				if (parentObj.scrollLeft - 10 < 0){
					parentObj.scrollLeft = 0;
					clearInterval(CL.timeID);
					CL.timeID = "";
				}
			},20);
		}).mouseup(function(e){
			if (CL.timeID) clearInterval(CL.timeID);
		});

		CL.moveRight.mousedown(function(e){
			if (CL.timeID) clearInterval(CL.timeID);
			CL.timeID = setInterval(function(){
				parentObj.scrollLeft = parentObj.scrollLeft - 0 + 10;
				if (parentObj.scrollLeft + $(parentObj).width() > parentObj.scrollWidth){
					parentObj.scrollLeft = parentObj.scrollWidth - $(parentObj).width();
					clearInterval(CL.timeID);
					CL.timeID = "";
				}
			},20);
		}).mouseup(function(e){
			if (CL.timeID){
				clearInterval(CL.timeID);
			}
		});
	}

	if (CL.domMove){
		$(window).resize(function(e){
			CL._fitBarScroll();
		});
	}

	//窗口关闭绑定事件，记录当前记录
	window.onbeforeunload = function(){
		if (CL.localSave){
			if (("clear" in setting) && setting.clear){
			}else{
				var tempObj = {};
				for (var x in CL.menuList){
					var tempObj2 = CL.menuList[x];
					tempObj[x] = {
							title: tempObj2.title,
							txt: tempObj2.txt,
							href: tempObj2.href
					}

					if (CL.selKey===x){
						tempObj[x]["sel"] = 1;
					}
				}
				window.localStorage.menu = json_encode(tempObj);
			}
		}
	}

	//为iframe子页面提供打开接口
	if (!("showItem" in SPAmenu)){
		window.showItem = function(eventObj, domObj, txt, title, href){
			CL.showItem(eventObj, domObj, txt, title, href);
		}
	}
}


/*
node = {
	key,
	href,
	txt,
	title,
	sel,
}
*/
SPAmenu.prototype._opNode = function(typeStr, node){
	var CL = this;
	if (CL.menuList==="") return false;

	if (typeStr==="add"){
		var keyStr = "";
		if (node.key){
			keyStr = node.key;
		}
		//如果key为空字符，则按当前unix时间戳进行获取
		//需要relax_function.js 函数库支持
		if (keyStr==="") keyStr=getUnixTime("",-8)+"";
		if (keyStr in CL.menuList){
			for (x in node){
				if (node[x]){
					CL.menuList[keyStr][x] = node[x];
				}
			}
			//更新当前选项卡的显示元素
			CL.menuList[keyStr]["itemObj"].attr("title",node.title);
			CL.menuList[keyStr]["itemObj"].find(".txt").text(node.txt);
		}else{
			if (!(node.href)) return false;  //没有href属性的节点不会被添加
			CL.menuList[keyStr] = {
				itemObj:"",
				frameObj:""
			};
			for (x in node){
				CL.menuList[keyStr][x] = node[x];
			}
			//把新元素添加到domBar显示中
			var tempStr = CL.templateBar;
			tempStr = tempStr.replace("{#title#}",CL.menuList[keyStr]["title"]).replace("{#key#}", keyStr).replace("{#txt#}", CL.menuList[keyStr]["txt"]);
			CL.domBar.append(tempStr);
			CL.menuList[keyStr]["itemObj"] = CL.domBar.children("*[key='"+ keyStr + "']").eq(0);
		}
		//添加成功则返回节点索引值
		return keyStr;
	}

	//删除操作
	if (typeStr==="del"){
		if (!(node in CL.menuList)) return false;
		//判断是否加载过iframe 加载过则删除
		if (CL.menuList[node]["frameObj"]){
			//CL.menuList[node]["frameObj"].src = null;
			$(CL.menuList[node]["frameObj"]).empty().remove();
		}
		delete CL.menuList[node];
		CL.domBar.find("*[key='"+ node +"']").remove();
		if (CL.selKey!=="" && CL.selKey!==node){
			return CL.selKey;
		}else{

		}
		return true;
	}
}

//显示某个选项卡
SPAmenu.prototype._show = function(key){
	var CL = this;
	//console.log(CL.menuList);
	if (CL.menuList==="") return false;

	if (!(key in CL.menuList)) return false;
	if (CL.selKey===key) return false;

	//切换其他选项卡的选中状态
	if (CL.selKey!=="" && (CL.selKey in CL.menuList)){
		CL.menuList[CL.selKey]["itemObj"].removeClass("sel");
		if (CL.menuList[CL.selKey]["frameObj"]){
			CL.menuList[CL.selKey]["frameObj"].style.display = "none";
		}
	}
	//设置当前选项卡的选中状态
	CL.menuList[key]["itemObj"].addClass("sel");
	if (CL.menuList[key]["frameObj"]){
		CL.menuList[key]["frameObj"].style.display = "block";
	}else{
		CL.menuList[key]["frameObj"] = document.createElement('iframe');
		if (CL.menuList[key]["href"].indexOf("?")>=0){
			CL.menuList[key]["frameObj"].src = CL.menuList[key]["href"] + "&v="+Math.random();
		}else{
			CL.menuList[key]["frameObj"].src = CL.menuList[key]["href"] + "?v="+Math.random();
		}
		CL.domIframe.append(CL.menuList[key]["frameObj"]);
	}
	CL.selKey = key;
	CL._fitBarScroll(key);
}

//按key查找结点元素，或者按href地址查找节点值，区别在于key是否是数值
SPAmenu.prototype._findNode = function(key){
	var CL = this;

	if (isNaN(key -0)){
		//按href遍历
		for (var x in CL.menuList){
			if (CL.menuList[x].href===key) return x;
		}
		return false;
	}else{
		if (key in CL.menuList){
			return key;
		}else{
			return false;
		}
	}
}
//外部接口，用于外部JS直接使用该类实例
SPAmenu.prototype.showItem = function(eventObj, domObj, txt, title, href){
	var CL = this;
  var key;
	if (domObj === null){
		key = CL._findNode(href);
		if (key===false){
			key=CL._opNode("add",{
				key: key,
				href: href,
				txt: txt,
				title: title
			});
		}
		CL._show(key);
		if (typeof(eventObj)){
			protectEvent(eventObj);
		}
	}else{
		key = domObj.attr("key");
		if (key && CL._findNode(key)){
			CL._show(key);
			if (typeof(eventObj)){
				protectEvent(eventObj);
			}
		}

		//判断是否是jquery对象 不是则不执行
		if (typeof(domObj)==="object" && ("length" in domObj)){
			var txt2 = domObj.attr("txt");
			txt2 = txt2? txt2:domObj.text();
			var title2 = domObj.attr("title");
			var href2 = domObj.attr("href");

			if (!(txt)) txt = txt2;
			if (!(title)){
				title = title2;
				if (!title) title = txt;
			}
			if (!(href)) href = href2;

			key = domObj.attr("key");
			if (key){
				key = CL._opNode("add",{
					key: key,
					href: href,
					txt: txt,
					title: title
				});
			}else{
				key = CL._findNode(href);
				if (key=== false){
					key = CL._opNode("add",{
						key: key,
						href: href,
						txt: txt,
						title: title
					});
				}
			}
			CL._show(key);
			if (typeof(eventObj)) protectEvent(eventObj);
		}
	}
}

//获得当前结点的上一个节点或者下一个节点，没有则返回false
//typeStr = next 往后遍历
//typeStr = prev 往前遍历
SPAmenu.prototype._getNextPrev = function(typeStr, key){
	var CL = this;
	var getKey = "";
	var count = 0;

	if (typeStr==="next"){
		for (var x in CL.menuList){
			if (getKey==="ok"){
				getKey = x;
				break;
			}else{
				if (key===x) getKey = "ok";
			}
		}
		if (getKey==="" || getKey==="ok"){
			return false;
		}else{
			return getKey;
		}
	}
	if (typeStr==="prev"){
		for (var x in CL.menuList){
			if (count=== 0){
				if (key=== x) break;
				getKey = x;
			}else{
				if (key!==x){
					getKey = x;
				}else{
					break;
				}
			}
			count++;
		}
		if (getKey==="") return false;
		return getKey;
	}
}
SPAmenu.prototype._fitBarScroll = function(key){
	var CL = this;
	if (CL.menuList==="" || CL.domMove==="") return;

	var w1 = CL.domBar.parent().width();
	var w2 = 0;
	var nodeLeft = 0;
	for (var x in CL.menuList){
		if (key && x===key){
			nodeLeft = w2;
		}
		w2 += CL.menuList[x]["itemObj"].width()+37;
	}
	if (w2 > w1){
		CL.domBar.width(w2+1);
		CL.domMove.css("display","block");
		if (key){
			CL.domBar.parent()[0].scrollLeft = nodeLeft;
		}
	}else{
		CL.domBar.width(w1);
		CL.domMove.css("display","none");
	}
}
