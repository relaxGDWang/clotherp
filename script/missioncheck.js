var vu=new Vue({
    el: '#app',
    data:{
        search:{
            listType: 'doing'   //doing,finished
        },
        username: '',
        UI:{
            listHeight: 100,
            bottomListHeight: 100,
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
        mission: [],    //任务细分数组，ajax直接返回
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
                url: PATH.missionCheck,
                data:{status: this.search.listType},
                success:function(data){
                    dialog.close('loading');
                    for (var i = 0; i < data.length; i++) {
                        vu.mission.push(data[i]);
                        vu.missionKey[data[i]['bolt_id']] = i;
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
                }
            };
            if (this.clothDetails[keyStr]!==undefined){
                this.editObject=this.clothDetails[keyStr];
                this._setColthLen();
                dialog.open('opDetails',dialogConfig);
            }else{
                ajax.send({
                    url: PATH.missionCheckDetails,
                    data:{bolt_id: bid},
                    success:function(data){
                        dialog.close('loading');
                        var keyStr=data.bolt_no;
                        var bidStr=data.bolt_id;
                        vu._solveCutData(keyStr, data);
                        vu.editObject=vu.clothDetails[keyStr];
                        vu._setColthLen();
                        dialog.open('opDetails',dialogConfig);
                    }
                });
            }
        },
        _solveCutData: function(key, data){  //按详细信息加工成可界面处理数据
            var temp=this.clothDetails[key], i;
            if (!temp) temp=this.clothDetails[key]={};
            temp.defects=this._formatFlawInfor(data.defects);
            temp.cutouts=data.cutouts;
            temp.viewObj=this.mission[this.missionKey[data.bolt_id]];
        },
        _setColthLen: function(){   //设置用于显示的当前布长
            if (this.editObject){
                this.UI.len=this.editObject.viewObj.current_length;
            }else{
                this.UI.len=0;
            }
        },
        askFinish: function(){
            //检测完整性
            dialog.open('information',{
                content: '是否完成当前布匹的检验任务？',
                cname: 'sure',
                closeCallback: function(id, dialogType, buttonType){
                    if (buttonType==='sure') vu.doFinish();
                }
            });
        },
        doFinish: function(){
            ajax.send({
                url: PATH.missionCheckFinished,
                method: 'post',
                data:{bolt_id: vu.editObject.viewObj.bolt_id},
                success:function(data){
                    dialog.close('loading');
                    dialog.close('opDetails');
                    dialog.open('information', {
                        content: '布匹检验已完成！',
                        btncancel: '',
                        cname:'ok'
                    });
                    //删除对应的列表信息
                    var keyStr=vu.editObject.viewObj.bolt_id;
                    var index=vu.missionKey[keyStr];
                    vu.mission.splice(index,1);
                    //重构missionKey
                    vu.missonKey={};
                    for (var i=0; i<vu.mission.length; i++){
                        vu.missionKey[vu.mission[i].bolt_id]=i;
                    }
                    vu.editObject='';
                    vu.UI.len=0;
                    delete vu.clothDetails[keyStr];
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
                data:{bolt_id: vu.editObject.viewObj.bolt_id, length: vu.input.len},
                success: function(data){
                    //调整布长
                    Vue.set(vu.editObject.viewObj,'current_length',vu.input.len);
                    vu.UI.len=vu.input.len;
                    vu._setMessage({flag:true, status:'ok', msg:'布长已经成功标记为'+vu.input.len});
                    setTimeout(function(){
                        dialog.close('reLength');
                        vu.input.len='';
                        vu.input.flag=false;
                        vu.input.status='';
                        vu.input.msg='';
                        //重绘概览
                        vu.redrawCloth();
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
                data:{bolt_id: vu.editObject.viewObj.bolt_id, defects:[vu.input.start+","+vu.input.end]},
                success: function(data){
                    vu.editObject.defects=vu._formatFlawInfor(data.defects);  //刷新疵点列表
                    vu._setMessage({flag:true, status:'ok', msg:'新增疵点已经成功！'});
                    setTimeout(function(){
                        dialog.close('addFlaw');
                        vu.input.start='';
                        vu.input.end='';
                        vu.input.step=1;
                        vu.input.flag=false;
                        vu.input.status='';
                        vu.input.msg='';
                        vu.redrawCloth();
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
                    dialog.close('loading');
                    dialog.open('information',{content:'疵点已经成功删除！',btncancel:'',cname:'ok'});
                    vu.editObject.defects=vu._formatFlawInfor(data.defects);
                    setTimeout(function(){
                        vu.redrawCloth();
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
        printDoing: function(typeStr){
            if (!typeStr){
                dialog.open('printBox');
            }else{
                var splitString='';
                if (typeStr==='start'){
                    splitString='--------------------';
                }else{
                    splitString='vvvvvvvvvvvvvvvvvvvv';
                }
                try{
                    window.register_js.goprint('{"width":"40","len":"400","gap":"0","xblank":"100","yblank":"100","lineh":"30","density":"15","speed":"15","info":{"header":"随手布匹标记","code":"'+this.editObject.viewObj.bolt_no+'","footer":"'+ splitString +'","items":[{"text":"名称：亚光绣花型"},{"text":"库存：'+ this.editObject.viewObj.current_length +'米"},{"text":"入库：'+ formatDateTime(new Date(),'date','-',true)+'"},{"text":"仓位：'+ this.editObject.viewObj.position +'"},{"text":"版本：法西兰"},{"text":"卷号：'+ this.editObject.viewObj.bolt_no+'"}]}}');
                    dialog.open('information',{content:'打印指令发送成功！',cname:'ok',btncancel:''});
                }catch(e){
                    dialog.open('information',{content:'打印调用出错，请检查打印机连接情况',cname:'warning',btncancel:''});
                }
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
        vu.UI.bottomHeight=H-285;
        if (flag===undefined){
            vu.redrawCloth();
        }
    }
});
