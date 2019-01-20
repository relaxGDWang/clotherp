var vu=new Vue({
    el: '#app',
    data:{
        search:{
            listType: 'doing'   //doing,cut
        },
        flagReload: false,     //用于标记窗口关闭是否要刷新列表
        username: '',
        UI:{
            listHeight: 100,
            bottomHeight: 100,
            len: 0,
            perLen: 10,
            direction: 'right'
        },
        input:{
            flag: false,  //标记修改操作的ajax是否在提交
            msg:'',        //错误信息提示
            status: '',    //错误信息状态
            len: '',       //修正布长
            start:'',      //疵点开始
            end:'',        //疵点结束
            step:1         //步骤
        },
        editObject: '',
        mission: [], //任务细分数组，ajax直接返回
        missionKey: {}, //bolt_id与数组index对应关系
        clothDetails: {}  //布匹的裁剪任务，以bolt_no作为索引，结构 defects[疵点列表数组] cutouts[事件记录数组] splits[裁剪分段数组] list[以bolt_id作为索引的对象，值为splits的数组index] first[起始裁剪bolt_id] viewObj[当前查看的分段信息] product[对应的商品编号]
    },
    computed:{
        getMark: function(){
            var loopCount=Math.ceil(this.UI.len/this.UI.perLen);
            var result=[];
            for (var i=0; i<loopCount; i++){
                result.push(i*this.UI.perLen);
            }
            result.push(this.UI.len);
            return result;
        }
    },
    methods:{
        getList: function(){  //获得任务列表
            this.mission=[];
            this.missionKey={};
            this.editObject='';
            this.clothDetails={};
            ajax.send({
                url: PATH.missionCut,
                data:{status: this.search.listType},
                success:function(data){
                    dialog.close('loading');
                    for (var i=0; i<data.length; i++){
                        vu.mission.push(data[i]);
                        vu.missionKey[data[i]['bolt_id']]=i;
                    }
                }
            });
        },
        //bid 每个裁剪分段的编号 bno 每个布匹的编号
        openDetails: function(bid){
            var keyStr=this.mission[this.missionKey[bid]].bolt_no;
            var dialogConfig={
                closeCallback: function(){
                    vu.editObject='';
                    vu.UI.len=0;
                    if (vu.flagReload){
                        vu.getList();
                    }
                    vu.flagReload=false;
                }
            };
            if (this.clothDetails[keyStr]!==undefined){
                this.editObject=this.clothDetails[keyStr];
                this.setViewObject(this.editObject, bid);
                this._setColthLen();
                dialog.open('opDetails',dialogConfig);
            }else{
                ajax.send({
                    url: PATH.missionCutDetails,
                    data:{bolt_id: bid},
                    success:function(data){
                        dialog.close('loading');
                        var keyStr=data.bolt_no;
                        var bidStr=data.bolt_id;
                        vu._solveCutData(keyStr, data);
                        vu.editObject=vu.clothDetails[keyStr];
                        vu.setViewObject(vu.editObject, bidStr);
                        vu._setColthLen();
                        dialog.open('opDetails',dialogConfig);
                    }
                });
            }
        },
        _solveCutData: function(key, data){  //按详细信息加工成可界面处理数据
            var temp=this.clothDetails[key], i, flagNew=false;
            if (!temp){
                flagNew=true;
                temp=this.clothDetails[key]={};
            }
            temp.defects=this._formatFlawInfor(data.defects);
            temp.cutouts=data.cutouts;
            temp.splits=data.splits;
            temp.list={};
            temp.first='';
            for (i=0; i<temp.splits.length; i++){
                if (temp.first==='' && temp.splits[i].status_code==='mark') temp.first=temp.splits[i].bolt_id;
                temp.list[temp.splits[i].bolt_id]=i;
            }
            if (flagNew) {
                var index = this.missionKey[data.bolt_id];
                temp.product = this.mission[index].product_code;
                temp.bolt = this.mission[index].bolt_no;
                temp.father = data.init_bolt_id;
                temp.position = this.mission[index].position;
            }
        },
        setViewObject: function(nowObject, bid){  //设置当前查看的分段点信息
            if (bid) {
                //可能的bid并不存在于splits里，多见于已完成的裁剪单，目前则使用第一个splits的节点
                if (nowObject.list[bid]!==undefined) {
                    Vue.set(this.editObject, 'viewObj', nowObject.splits[nowObject.list[bid]]);
                    return;
                }
            }
            if (nowObject.first!=='') {
                Vue.set(this.editObject, 'viewObj', nowObject.splits[nowObject.list[nowObject.first]]);
            }else{
                Vue.set(this.editObject, 'viewObj',nowObject.splits[0]);
            }
        },
        _setColthLen: function(){   //设置用于显示的当前布长
            if (this.editObject){
                var first=this.editObject.first;
                if (first){
                    var index=this.editObject.list[first];
                    this.UI.len=this.editObject.splits[index].current_length;
                    return;
                }
            }
            this.UI.len=0;
        },
        getTypeString: function(itemObject){   //获得当前裁剪端的分类名称
            if (itemObject.order){
                return 'customer';
            }else if(itemObject.defect_type && itemObject.defect_type.indexOf('瑕疵')>=0){
                return 'flaw';
            }else{
                return 'normal';
            }
        },
        askFinish: function(){
            //检测完整性
            dialog.open('information',{
                content: '是否完成当前裁剪操作？',
                cname:'sure',
                closeCallback: function(id, dialogType, buttonType){
                    if (buttonType==='sure') vu.doFinish();
                }
            });
        },
        doFinish: function(){
            ajax.send({
                url: PATH.missionCutFinished,
                method: 'post',
                data:{bolt_id: vu.editObject.viewObj.bolt_id},
                success:function(data){
                    vu.flagReload=true;
                    dialog.close('loading');
                    var cutLen=0; //判断是否还有裁剪段
                    for (var i=0; i<data.splits.length; i++){
                        if (data.splits[i].status_code==='mark') cutLen++;
                    }
                    if (cutLen===0){  //判断是否还有裁剪段
                        dialog.open('information',{
                            content: '当前布匹上的裁剪任务已经全部处理完毕!',
                            cname:'ok',
                            closeCallback: function(){
                                dialog.close('opDetails');
                                vu.getList();
                                vu.flagReload=false;
                            }
                        });
                    }else{
                        var keyStr=data.bolt_no;
                        vu._solveCutData(keyStr, data);
                        vu.editObject=vu.clothDetails[keyStr];
                        vu.setViewObject(vu.editObject, '');
                        vu._setColthLen();
                        dialog.open('resultShow',{content:'当前裁剪操作已成功！'});
                        //重新绘制概览图
                        setTimeout(function(){
                            vu.redrawCloth();
                            vu.redrawClothBlock();
                        },100);
                    }
                }
            });
        },
        resetLength: function(){  //重写布匹长度操作
            dialog.open('reLength',{
                closeCallback: function(){
                    vu.input.len='';
                    vu.input.flag=false;
                    vu.input.status='';
                    vu.input.msg='';
                }
            });
        },
        doResetLength: function(){ //重写布匹长度ajax
            if (REG.flaw.test(this.input.len)===false){
                this._setMessage({status:'warning',msg:'布长填写错误，请重新输入'});
                return;
            }
            if (this.input.len==this.editObject.viewObj.current_length){
                this._setMessage({status:'warning',msg:'填写值和当前长度一致，无需提交'});
                return;
            }
            ajaxModify.send({
                url: PATH.resetLength,
                method: 'post',
                data:{bolt_id: vu.editObject.father, length: vu.input.len},
                success: function(data){
                    vu.flagReload=true;
                    var cutLen=0; //判断是否还有裁剪段
                    for (var i=0; i<data.splits.length; i++){
                        if (data.splits[i].status_code==='mark') cutLen++;
                    }
                    if (cutLen===0){
                        vu._setMessage({flag:true, status:'ok', msg:'布长已经成功标记为'+vu.input.len+'! 裁剪任务调整，该卷布已无任务裁剪任务。'});
                        setTimeout(function(){
                            dialog.close('reLength');
                            dialog.close('opDetails');
                            vu.input.len='';
                            vu.input.flag=false;
                            vu.input.status='';
                            vu.input.msg='';
                            vu.getList();
                            vu.flagReload=false;
                        },1500);
                        return;
                    }
                    vu._setMessage({flag:true, status:'ok', msg:'布长已经成功标记为'+vu.input.len});
                    //调整布长
                    var keyStr=data.bolt_no;
                    vu._solveCutData(keyStr, data);
                    vu.setViewObject(vu.editObject, '');
                    vu._setColthLen();
                    setTimeout(function(){
                        dialog.close('reLength');
                        vu.input.len='';
                        vu.input.flag=false;
                        vu.input.status='';
                        vu.input.msg='';
                        //重绘概览
                        vu.redrawCloth();
                        vu.redrawClothBlock();
                    },1500);
                }
            });
        },
        operateFlaw: function(bolt_id){
            if (bolt_id===undefined){ //添加疵点操作
                dialog.open('addFlaw',{
                    closeCallback: function(){
                        vu.input.start='';
                        vu.input.end='';
                        vu.input.step=1;
                        vu.input.flag=false;
                        vu.input.status='';
                        vu.input.msg=''
                    }
                });
            }else{   //删除疵点操作
                dialog.open('information',{
                    content:'是否确定删除当前疵点？',
                    cname:'sure',
                    closeCallback: function(id, dialogType, buttonType){
                        if (buttonType==='sure'){
                            vu.delOperateFlaw(bolt_id);
                        }
                    }
                });
            }
        },
        goStep: function(op){   //分步骤展现操作
            switch(op){
                case 'next':
                    if (REG.flaw.test(this.input.start)===false){
                        this._setMessage({status:'warning',msg:'疵点开始位置填写有误'});
                        return;
                    }
                    if (this.input.start>this.editObject.viewObj.current_length){
                        this._setMessage({status:'warning',msg:'疵点开始位置大于布长，请重新输入'});
                        return;
                    }
                    this.input.step=2;
                    this.input.end=this.input.start;
                    break
                case 'prev':
                    this.input.step=1;
                    break;
            }
        },
        addOperateFlaw: function(){ //添加疵点ajax
            if (REG.flaw.test(this.input.end)===false){
                this._setMessage({status:'warning',msg:'疵点结束位置填写有误'});
                return;
            }
            if (this.input.end>this.editObject.viewObj.current_length){
                this._setMessage({status:'warning',msg:'疵点结束位置大于布长，请重新输入'});
                return;
            }
            if (this.input.end<this.input.start){
                this._setMessage({status:'warning',msg:'疵点结束位置不能小于开始位置，请重新输入'});
                return;
            }
            ajaxModify.send({
                url: PATH.addFlaw,
                method: 'post',
                data:{bolt_id: vu.editObject.father, defects:[vu.input.start+","+vu.input.end]},
                success: function(data){
                    vu.flagReload=true;
                    var cutLen=0; //判断是否还有裁剪段
                    for (var i=0; i<data.splits.length; i++){
                        if (data.splits[i].status_code==='mark') cutLen++;
                    }
                    if (cutLen===0){
                        vu._setMessage({flag:true, status:'ok', msg:'新增疵点已经成功， 裁剪任务调整，该卷布已无裁剪任务。'});
                        setTimeout(function(){
                            dialog.close('reLength');
                            dialog.close('opDetails');
                            vu.input.len='';
                            vu.input.flag=false;
                            vu.input.status='';
                            vu.input.msg='';
                            vu.getList();
                            vu.flagReload=false;
                        },1500);
                        return;
                    }
                    vu._setMessage({flag:true, status:'ok', msg:'新增疵点已经成功，裁剪任务已经刷新！'});
                    var keyStr=data.bolt_no;
                    vu._solveCutData(keyStr, data);
                    vu.setViewObject(vu.editObject, '');
                    vu._setColthLen();
                    setTimeout(function(){
                        dialog.close('addFlaw');
                        vu.input.start='';
                        vu.input.end='';
                        vu.input.step=1;
                        vu.input.flag=false;
                        vu.input.status='';
                        vu.input.msg='';
                        vu.redrawCloth();
                        vu.redrawClothBlock();
                    },2000);
                }
            });
        },
        delOperateFlaw: function(bolt_id){   //删除疵点ajax
            ajax.send({
                url: PATH.delFlaw,
                method: 'delete',
                data:{bolt_id: bolt_id},
                success: function(data){
                    vu.flagReload=true;
                    var cutLen=0; //判断是否还有裁剪段
                    for (var i=0; i<data.splits.length; i++){
                        if (data.splits[i].status_code==='mark') cutLen++;
                    }
                    if (cutLen===0){
                        dialog.open('information',{
                            content:'疵点已经成功删除！裁剪任务调整，该卷布已无裁剪任务。',
                            btncancel:'',
                            cname:'ok',
                            closeCallback: function(){
                                dialog.close('opDetails');
                                vu.getList();
                                vu.flagReload=false;
                            }
                        });
                        return;
                    }
                    dialog.close('loading');
                    dialog.open('information',{content:'疵点已经成功删除！',btncancel:'',cname:'ok'});
                    var keyStr=data.bolt_no;
                    vu._solveCutData(keyStr, data);
                    vu.setViewObject(vu.editObject, '');
                    vu._setColthLen();
                    setTimeout(function(){
                        vu.redrawCloth();
                        vu.redrawClothBlock();
                    },100);
                }
            });
        },
        redrawCloth: function(){  //绘制布匹概览
            var cloth=$(this.$refs.cloth);
            var ruler=$(this.$refs.ruler);
            var len=cloth.width()-1;
            var pm=len/this.UI.len;
            var direction=this.UI.direction;
            drawRulers();
            drawFlaws();

            function drawRulers(){   //绘制刻度
                var tempArray=ruler.children('span');
                var i,pos1;
                for (i=0; i<tempArray.length; i++){
                    pos1=$(tempArray[i]).attr('pos');
                    $(tempArray[i]).css(direction, pm*pos1);
                }
            }
            function drawFlaws(){  //绘制疵点
                var tempArray=cloth.children('.flaw');
                var i,pos1,widthNum;
                for (i=0; i<tempArray.length; i++){
                    var temp=$(tempArray[i]);
                    if (temp.attr('type')==='dot'){
                        pos1=temp.attr('end')*pm;
                        widthNum=1;
                    }else{
                        pos1=temp.attr('start')*pm;
                        widthNum=temp.attr('len')*pm || 1;
                    }
                    temp.css(direction, pos1).css('width', widthNum);
                }
            }
        },
        redrawClothBlock: function(){   //绘制当前裁剪块
            if (!this.editObject) return;
            var cloth=$(this.$refs.cloth);
            var len=cloth.width()-1;
            var pm=len/this.UI.len;
            var direction=this.UI.direction;
            var i, start=0, widthNum;
            if (this.editObject.viewObj && this.editObject.viewObj.status_code!=='mark'){
                cloth.children('.nowBlock').hide();
                cloth.children('.clip').hide();
            }else{
                for (i=0; i<this.editObject.splits.length; i++){
                    if (this.editObject.splits[i].status_code!=='mark') continue;
                    if (this.editObject.splits[i].bolt_id===this.editObject.viewObj.bolt_id){
                        break;
                    }
                    console.log(i);
                    start+=this.editObject.splits[i].cut_length;
                }
                widthNum=this.editObject.viewObj.cut_length*pm || 1;
                cloth.children('.nowBlock').show().css(this.UI.direction, start*pm).css('width', widthNum);
                cloth.children('.clip').show().css(this.UI.direction, start*pm+widthNum);
            }
        },
        showFocus: function(e){
            var dom=$('#doFinish');
            if (JS_contains(dom[0], e.target)){
                if (dom.attr('disabled')){
                    var dom2=$('#focusDom');
                    if (dom2.hasClass('focus')) return;
                    dom2.addClass('focus');
                    setTimeout(function(){
                        dom2.removeClass('focus');
                    },2000);
                }
            }
        },
        _setMessage: function(config){
            this.input.flag=config.flag || false;
            this.input.status=config.status || '';
            this.input.msg=config.msg || '';
        },
        operateBefore: function(){  //用于设置操作的ajax before的设置
            this._setMessage({flag:true,status:'loading',msg:'正在提交设置数据，请稍等...'});
        },
        operateError: function(code, msg){
            this._setMessage({status:'error', msg:msg});
        },
        _formatFlawInfor: function(itemList){   //批处理瑕疵点
            for (var i=0; i<itemList.length; i++){
                if (itemList[i].defect_type==='dot'){
                    itemList[i].position=itemList[i].end;
                    itemList[i].length='';
                }else{
                    itemList[i].position=itemList[i].start+'~'+itemList[i].end;
                }
            }
            return itemList;
        },
        //打印标签
        printDoing: function(){
            //判定是疵点还是订单打印
            var printStr='';
            var bolt_id=this.editObject.viewObj.bolt_id;
            for (var i=0; i<this.editObject.defects.length; i++){
                var temp=this.editObject.defects[i];
                if (bolt_id===temp.bold_id){
                    printStr=JSON.stringify(temp.print_data);
                    break;
                }
            }
            if (printStr===''){
                var header= this.editObject.viewObj.order? '随手订货单':'随手库存单';
                printStr='{"width":"40","len":"400","gap":"0","xblank":"100","yblank":"100","lineh":"30","density":"15","speed":"15","info":{"header":"'+ header +'","code":"'+this.editObject.viewObj.bolt_no+'","footer":"--------------------","items":[{"text":"名称：亚光绣花型"},{"text":"库存：'+ this.editObject.viewObj.current_length +'米"},{"text":"入库：'+formatDateTime(new Date(),'date','-',true)+'"},{"text":"仓位：'+this.editObject.position+'"},{"text":"版本：法西兰"},{"text":"批号：'+this.editObject.viewObj.bolt_no+'"}]}}';
            }
            try{
                window.register_js.goprint(printStr);
                dialog.open('information',{content:'打印指令发送成功！',cname:'ok',btncancel:''});
            }catch(e){
                dialog.open('information',{content:'打印调用出错，请检查打印机连接情况',cname:'warning',btncancel:''});
            }
        }
    },
    beforeMount: function () {
        var temp=JSON.parse(localStorage.getItem(CFG.admin));
        this.username=temp.name;
    },
    watch: {
        'input.len': function(newVal){
            this.input.status='';
            this.input.msg='';
        },
        'input.start': function(newVal){
            this.input.status='';
            this.input.msg='';
        },
        'input.end': function(newVal){
            this.input.status='';
            this.input.msg='';
        },
        'UI.len': function(newVal){
            if (newVal===0) return;
            setTimeout(function(){
                vu.redrawCloth();
                vu.redrawClothBlock();
            },100)
        },
        'search.listType': function(){
            this.getList();
        }
    }
});

var dialog=relaxDialog();
var ajax=relaxAJAX({
    type: 'get',
    contentType: CFG.JDTYPE,
    formater: CFG.ajaxFormater,
    checker: CFG.ajaxReturnDo,
    before: function(){
        dialog.open('loading');
    },
    error: function(code, msg){
        dialog.close('loading');
        dialog.open('information',{content:msg, cname:'error', btncancel:''});
    }
});
var ajaxModify=relaxAJAX({
    contentType: CFG.JDTYPE,
    formater: CFG.ajaxFormater,
    checker: CFG.ajaxReturnDo,
    before: vu.operateBefore,
    error: vu.operateError
});

$(function(){
    var timeID, body=$('body');
    $(window).resize(function(){
        if (timeID){
            clearTimeout(timeID);
            timeID='';
        }
        timeID=setTimeout(function(){
            fitUI();
        },100);
    });

    fitUI('first');
    vu.getList();

    function fitUI(flag){
        var H=body.height();
        vu.UI.listHeight=H-70;
        vu.UI.bottomHeight=H-325;
        if (flag===undefined){
            vu.redrawCloth();
            vu.redrawClothBlock();
        }
    }
});
